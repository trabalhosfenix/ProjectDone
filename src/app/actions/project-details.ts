'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { normalizeItemProgress } from '@/lib/project-progress'

/**
 * Buscar projeto completo com todos os relacionamentos
 */
export async function getProjectDetails(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            originSheet: true,
            status: true,
            priority: true,
            createdAt: true
          }
        },
        records: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            publishedBy: {
              select: { id: true, name: true, email: true }
            },
            executedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        dependencies: {
          include: {
            dependsOnProject: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        dependentOn: {
          include: {
            project: {
              select: { id: true, name: true, code: true }
            }
          }
        }
        // members e risks adicionados separadamente após verificar schema
      }
    })

    if (!project) {
      return { success: false, error: 'Projeto não encontrado' }
    }

    return { success: true, data: project }
  } catch (error) {
    console.error('Erro ao buscar projeto:', error)
    return { success: false, error: 'Erro ao buscar projeto' }
  }
}

/**
 * Calcular métricas EVA (Earned Value Analysis)
 */
export async function calculateProjectMetrics(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        items: {
          select: {
            id: true,
            status: true,
            metadata: true,
            weight: true,
            plannedValue: true,
            actualCost: true,
            // Datas para cálculo SPI
            datePlanned: true,
            datePlannedEnd: true,
            dateActualStart: true,
            dateActual: true
          }
        }
      }
    })

    if (!project) {
      return { success: false, error: 'Projeto não encontrado' }
    }

    // ===== NOVA LÓGICA SPI (REGRA DE DATAS) =====
    let sumSPI = 0
    let countConsidered = 0
    let countLate = 0
    
    // Variáveis financeiras acumuladas (se existirem dados)
    let totalItemPV = 0
    let totalItemEV = 0

    const now = new Date()
    // Zerar hora do 'agora' para comparação justa de datas (apenas dia conta)
    now.setHours(0, 0, 0, 0)

    for (const item of project.items) {
      // Determinar SPI Individual da Tarefa
      let itemSPI = 1.0 // Padrão: Em dia
      let shouldConsider = false
      let isLate = false

      // Converter strings/dates para timestamps comparáveis
      // Se datas não existirem, usamos metadados ou ignoramos? 
      // Se importou do Excel, tem datas no banco.
      
      const dtPlannedEnd = item.datePlannedEnd ? new Date(item.datePlannedEnd) : null
      const dtActualEnd = item.dateActual ? new Date(item.dateActual) : null
      
      if (dtPlannedEnd) {
          dtPlannedEnd.setHours(0,0,0,0)
          shouldConsider = true

          if (dtActualEnd) {
              dtActualEnd.setHours(0,0,0,0)
              // Cenário 1: Tarefa Concluída
              if (dtActualEnd.getTime() > dtPlannedEnd.getTime()) {
                  // Entregou DEPOIS do previsto -> Atraso
                  itemSPI = 0.9
                  isLate = true
              } else {
                  // Entregou ANTES ou NO DIA -> Adiantado/Em dia (Diff >= 0)
                  itemSPI = 1.0
              }
          } else {
              // Cenário 2: Tarefa Não Concluída
              // Se já venceu (Hoje > Planejado) -> Atraso
              if (now.getTime() > dtPlannedEnd.getTime()) {
                  itemSPI = 0.9 
                  isLate = true
              } else {
                  // Ainda no prazo
                  itemSPI = 1.0
              }
          }
      }

      if (shouldConsider) {
          sumSPI += itemSPI
          countConsidered++
      }
      
      // Acumular custo real (se necessário para AC)
      // ...
    }

    // Cálculo SPI Global (Média)
    const SPI = countConsidered > 0 ? sumSPI / countConsidered : 1.0 // Começa com 1 (ideal)

    // Valores Financeiros / Pontos para Exibição
    // Se tiver Budget financeiro, PV total = Budget.
    // Se não, vamos usar "Pontos" onde cada tarefa vale 1 ponto (ou peso se tivesse).
    
    // EV = SPI * PV. 
    // Como SPI = EV/PV -> EV = SPI * PV.
    // Vamos definir PV = BAC (Budget Total).
    // EV = SPI_Calculado * BAC.
    
    const BAC = Number(project.budget || 0) > 0 ? Number(project.budget) : countConsidered * 100 // Fallback R$ 100 por tarefa se sem budget
    const PV = BAC // Planejado Total (simplificação, ou deveria ser PV acumulado até hoje?)
    
    // Ajuste: PV deve ser o Valor Planejado ATÉ AGORA para o cálculo classico.
    // Mas o usuário quer mostrar o calculo da média? "R$ EV / R$ PV = SPI".
    // Se SPI=0.9 e PV=1000 -> EV=900.
    
    // Vamos usar PV Total do Projeto?
    // Se usarmos PV acumulado, o SPI seria EV_acum / PV_acum.
    // Mas nossa lógica de média Força o SPI.
    // Então vamos derivar o EV para bater com a conta.
    
    const displayPV = BAC 
    const displayEV = displayPV * SPI
    
    // AC (Custo Real) - Continua sendo soma real ou input do projeto
    // Calcular AC das tarefas
    let itemActualCost = project.items.reduce((acc, item) => acc + (item.actualCost || 0), 0)
    const AC = Number(project.actualCost || 0) + itemActualCost

    // Outros índices
    const CPI = AC > 0 ? displayEV / AC : 0
    const SV = displayEV - displayPV
    const CV = displayEV - AC
    const EAC = CPI > 0 ? BAC / CPI : 0
    const ETC = EAC - AC
    const VAC = BAC - EAC

    // Delay Days (Atraso) - Mantém lógica ou usa countLate?
    // Vou manter lógica de dias, mas informativo.

    // Cálculo de atraso em dias (Global)
    let delayDays = 0
    if (project.endDate && project.realEndDate) {
      const planned = new Date(project.endDate)
      const real = new Date(project.realEndDate)
      delayDays = Math.floor((real.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Progresso %
    const progress = (displayEV / BAC) * 100

    return {
      success: true,
      data: {
        // Valores base
        BAC: BAC.toFixed(2),
        AC: AC.toFixed(2),
        EV: displayEV.toFixed(2),
        PV: displayPV.toFixed(2),
        
        // Índices
        SPI: SPI.toFixed(2),
        CPI: CPI.toFixed(2),
        
        // Variâncias
        SV: SV.toFixed(2),
        CV: CV.toFixed(2),
        
        // Estimativas
        EAC: EAC.toFixed(2),
        ETC: ETC.toFixed(2),
        VAC: VAC.toFixed(2),
        
        // Progresso
        progress: progress.toFixed(2),
        delayDays,
        
        // Status
        scheduleStatus: SPI >= 0.95 ? 'on-track' : SPI >= 0.85 ? 'warning' : 'critical',
        costStatus: CPI >= 0.95 ? 'on-track' : CPI >= 0.85 ? 'warning' : 'critical'
      }
    }
  } catch (error) {
    console.error('Erro ao calcular métricas:', error)
    return { success: false, error: 'Erro ao calcular métricas' }
  }
}

/**
 * Criar novo registro do projeto
 */
export async function createProjectRecord(data: {
  projectId: string
  publishedById: string
  executedById?: string
  comment?: string
  attachmentUrl?: string | null
  attachmentName?: string | null
}) {
  try {
    const record = await prisma.projectRecord.create({
      data,
      include: {
        publishedBy: {
          select: { id: true, name: true, email: true }
        },
        executedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${data.projectId}`)
    return { success: true, data: record }
  } catch (error) {
    console.error('Erro ao criar registro:', error)
    return { success: false, error: 'Erro ao criar registro' }
  }
}

/**
 * Atualizar registro do projeto
 */
export async function updateProjectRecord(
  id: string,
  data: Partial<{
    comment: string
    executedById: string
    attachmentUrl: string | null
    attachmentName: string | null
  }>
) {
  try {
    const record = await prisma.projectRecord.update({
      where: { id },
      data,
      include: {
        publishedBy: {
          select: { id: true, name: true, email: true }
        },
        executedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${record.projectId}`)
    return { success: true, data: record }
  } catch (error) {
    console.error('Erro ao atualizar registro:', error)
    return { success: false, error: 'Erro ao atualizar registro' }
  }
}

/**
 * Deletar registro do projeto
 */
export async function deleteProjectRecord(id: string) {
  try {
    const record = await prisma.projectRecord.findUnique({
      where: { id },
      select: { projectId: true }
    })

    if (!record) {
      return { success: false, error: 'Registro não encontrado' }
    }

    await prisma.projectRecord.delete({ where: { id } })

    revalidatePath(`/dashboard/projetos/${record.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar registro:', error)
    return { success: false, error: 'Erro ao deletar registro' }
  }
}

/**
 * Buscar dependências do projeto
 */
export async function getProjectDependencies(projectId: string) {
  try {
    const dependencies = await prisma.projectDependency.findMany({
      where: { projectId },
      include: {
        dependsOnProject: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        }
      }
    })

    return { success: true, data: dependencies }
  } catch (error) {
    console.error('Erro ao buscar dependências:', error)
    return { success: false, error: 'Erro ao buscar dependências' }
  }
}

/**
 * Criar dependência entre projetos
 */
export async function createProjectDependency(data: {
  projectId: string
  dependsOnProjectId: string
  type?: string
}) {
  try {
    const dependency = await prisma.projectDependency.create({
      data,
      include: {
        dependsOnProject: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${data.projectId}`)
    return { success: true, data: dependency }
  } catch (error) {
    console.error('Erro ao criar dependência:', error)
    return { success: false, error: 'Erro ao criar dependência' }
  }
}

/**
 * Deletar dependência entre projetos
 */
export async function deleteProjectDependency(id: string) {
  try {
    const dependency = await prisma.projectDependency.findUnique({
      where: { id },
      select: { projectId: true }
    })

    if (!dependency) {
      return { success: false, error: 'Dependência não encontrada' }
    }

    await prisma.projectDependency.delete({ where: { id } })

    revalidatePath(`/dashboard/projetos/${dependency.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar dependência:', error)
    return { success: false, error: 'Erro ao deletar dependência' }
  }
}

/**
 * Buscar estatísticas consolidadas para a página de Situação
 */
export async function getProjectSituationStats(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
          id: true,
          name: true,
          description: true,
          status: true,
          budget: true,
          progress: true,
          managerName: true,
          client: true,
          area: true,
          priority: true,
          duration: true,
          realStartDate: true,
          realEndDate: true 
      }
    })

    if (!project) return { success: false, error: 'Projeto não encontrado' }

    // 1. Calcular Duração Real (Unindo datas dos itens) e Progresso Real (Média?)
    const items = await prisma.projectItem.findMany({
        where: { projectId },
        select: {
            dateActualStart: true,
            dateActual: true, // End Real
            duration: true,
            responsible: true,
            status: true,
            metadata: true
        }
    })

    let realDuration = 0
    let minStart: Date | null = project.realStartDate ? new Date(project.realStartDate) : null
    let maxEnd: Date | null = project.realEndDate ? new Date(project.realEndDate) : null
    
    // Contagem de Equipe (Alocados no Cronograma)
    const uniqueResponsibles = new Set<string>()

    let totalProgress = 0
    let totalTasks = 0
    let completedTasks = 0

    items.forEach(item => {
        if (item.responsible) {
             uniqueResponsibles.add(item.responsible.trim())
        }
        if (item.dateActualStart) {
            const d = new Date(item.dateActualStart)
            if (!minStart || d < minStart) minStart = d
        }
        if (item.dateActual) { 
            const d = new Date(item.dateActual)
            if (!maxEnd || d > maxEnd) maxEnd = d
        }
        const itemProgress = normalizeItemProgress(item.status, item.metadata)
        totalProgress += itemProgress
        totalTasks++

        if (itemProgress >= 100) {
            completedTasks++
        }
    })

    // Se temos um início real, calculamos a duração decorrida
    if (minStart) {
        const endDateCalc = maxEnd || new Date() // Se não acabou, usa hoje
        // Se o projeto estiver oficialmente concluído (status), mas sem data fim real, usamos hoje? 
        // Não, se status Concluído e sem data fim, algo errado, mas assumimos hoje.
        // Se status != Concluído, usamos hoje.
        
        // Ajuste fino: Se status == Concluído e tem maxEnd, usa maxEnd. Se não tem maxEnd, usa hoje.
        // Se status != Concluído, usa hoje.
        
        let finalDate = endDateCalc
        if (project.status === 'Concluído' && maxEnd) {
             finalDate = maxEnd
        } else if (project.status !== 'Concluído') {
             finalDate = new Date()
        }

        // Diferença em ms
        const diffTime = Math.abs(finalDate.getTime() - minStart.getTime())
        realDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    }
    
    // Evitar duração 0 se começou hoje
    if (minStart && realDuration === 0) realDuration = 1
    
    const calculatedProgress = totalTasks > 0 ? (totalProgress / totalTasks) : 0
    
    // 2. Contar Riscos e Issues
    const risksCount = await prisma.projectRisk.count({ where: { projectId } })
    const issuesCount = await prisma.issue.count({ where: { projectId } })
    
    const totalRisksIssues = risksCount + issuesCount

    return {
        success: true,
        data: {
            ...project,
            realDuration,
            teamCount: uniqueResponsibles.size,
            risksIssuesCount: totalRisksIssues,
            calculatedProgress: Math.round(calculatedProgress),
            completedTasks,
            totalTasks
        }
    }

  } catch (error) {
    console.error('Erro ao buscar stats de situação:', error)
    return { success: false, error: 'Erro ao calcular estatísticas' }
  }
}

/**
 * Buscar tarefas críticas e atrasadas para o painel de Monitoramento
 */
export async function getProjectCriticalItems(projectId: string) {
  try {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Buscar tarefas críticas OU atrasadas
    const items = await prisma.projectItem.findMany({
      where: {
        projectId,
        OR: [
          { isCritical: true }, // Críticas
          { 
             // Atrasadas: Data Fim < Agora E Status != Concluído
             datePlannedEnd: { lt: now },
             status: { notIn: ['Concluído', 'Completed', 'Done'] }
          }
        ]
      },
      orderBy: { datePlannedEnd: 'asc' },
      select: {
          id: true,
          task: true,
          responsible: true,
          status: true,
          datePlannedEnd: true,
          datePlanned: true,
          isCritical: true,
          dateActual: true,
          metadata: true
      }
    })

    const delayed = items.filter(i => {
        if (!i.datePlannedEnd) return false
        const dtEnd = new Date(i.datePlannedEnd)
        dtEnd.setHours(0,0,0,0)
        return dtEnd < now && !['Concluído', 'Completed', 'Done'].includes(i.status || '')
    })

    const critical = items.filter(i => i.isCritical)

    return { 
        success: true, 
        data: {
            all: items,
            delayed,
            critical,
            totalDelayed: delayed.length,
            totalCritical: critical.length
        } 
    }

  } catch (error) {
    console.error('Erro ao buscar tarefas críticas:', error)
    return { success: false, error: 'Erro ao buscar tarefas críticas' }
  }
}
