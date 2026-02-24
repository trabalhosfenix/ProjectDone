'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { normalizeItemProgress } from '@/lib/project-progress'
import { requireProjectAccess } from '@/lib/access-control'

/**
 * Buscar projeto completo com todos os relacionamentos
 */
export async function getProjectDetails(id: string) {
  try {
    const { user } = await requireProjectAccess(id)
    const project = await prisma.project.findFirst({
      where: {
        id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
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
    const { user } = await requireProjectAccess(projectId)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      include: {
        items: {
          where: user.tenantId ? { tenantId: user.tenantId } : undefined,
          select: {
            id: true,
            status: true,
            metadata: true,
            weight: true,
            plannedValue: true,
            actualCost: true,
            duration: true,
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

    const items = project.items || []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

    const toDay = (value: Date | string) => {
      const parsed = new Date(value)
      parsed.setHours(0, 0, 0, 0)
      return parsed
    }

    const diffDays = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))

    const sumPositivePlannedValue = items.reduce((sum, item) => {
      const planned = Number(item.plannedValue || 0)
      return sum + (planned > 0 ? planned : 0)
    }, 0)

    const projectBudget = Number(project.budget || 0)
    const hasProjectBudget = projectBudget > 0

    const plannedAverage =
      sumPositivePlannedValue > 0
        ? sumPositivePlannedValue / Math.max(items.filter((item) => Number(item.plannedValue || 0) > 0).length, 1)
        : 0

    const weightTotal = items.reduce((sum, item) => {
      const planned = Number(item.plannedValue || 0)
      return sum + (planned > 0 ? planned : 1)
    }, 0)

    const itemBudgets = items.map((item) => {
      const planned = Number(item.plannedValue || 0)

      if (hasProjectBudget) {
        if (weightTotal <= 0) return 0
        const weight = planned > 0 ? planned : 1
        return projectBudget * (weight / weightTotal)
      }

      if (sumPositivePlannedValue > 0) {
        return planned > 0 ? planned : plannedAverage
      }

      return items.length > 0 ? 100 : 0
    })

    const BAC = hasProjectBudget ? projectBudget : itemBudgets.reduce((sum, value) => sum + value, 0)

    const resolvePlannedEnd = (item: (typeof items)[number], plannedStart: Date | null) => {
      if (item.datePlannedEnd) return toDay(item.datePlannedEnd)

      const duration = Number(item.duration || 0)
      if (plannedStart && Number.isFinite(duration) && duration > 0) {
        const derived = new Date(plannedStart)
        derived.setDate(derived.getDate() + Math.max(0, Math.ceil(duration) - 1))
        return derived
      }

      return null
    }

    const plannedRatio = (
      plannedStart: Date | null,
      plannedEnd: Date | null,
      fallbackRatio: number
    ) => {
      if (!plannedStart && !plannedEnd) return fallbackRatio
      if (plannedStart && !plannedEnd) return now >= plannedStart ? 1 : 0
      if (!plannedStart && plannedEnd) return now > plannedEnd ? 1 : 0

      if (!plannedStart || !plannedEnd) return fallbackRatio
      if (now <= plannedStart) return 0
      if (now >= plannedEnd) return 1

      const totalWindow = diffDays(plannedEnd, plannedStart)
      if (totalWindow <= 0) return now >= plannedEnd ? 1 : 0

      const elapsedWindow = diffDays(now, plannedStart)
      return clamp(elapsedWindow / totalWindow)
    }

    let EV = 0
    let PV = 0
    let maxOverdueDays = 0

    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      const itemBudget = itemBudgets[index] || 0

      const actualProgressRatio = clamp(normalizeItemProgress(item.status, item.metadata) / 100)
      EV += itemBudget * actualProgressRatio

      const plannedStart = item.datePlanned ? toDay(item.datePlanned) : null
      const plannedEnd = resolvePlannedEnd(item, plannedStart)
      PV += itemBudget * plannedRatio(plannedStart, plannedEnd, actualProgressRatio)

      if (plannedEnd && actualProgressRatio < 1 && now > plannedEnd) {
        maxOverdueDays = Math.max(maxOverdueDays, diffDays(now, plannedEnd))
      }
    }

    const itemActualCost = items.reduce((sum, item) => {
      const value = Number(item.actualCost || 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    const projectActualCost = Number(project.actualCost || 0)
    const AC = projectActualCost > 0 ? projectActualCost : itemActualCost

    const SPI = PV > 0 ? EV / PV : 1
    const CPI = AC > 0 ? EV / AC : 1
    const SV = EV - PV
    const CV = EV - AC
    const EAC = CPI > 0 ? BAC / CPI : BAC
    const ETC = EAC - AC
    const VAC = BAC - EAC
    const progress = BAC > 0 ? clamp(EV / BAC, 0, 1) * 100 : 0

    let delayDays = 0
    if (project.endDate && project.realEndDate) {
      delayDays = diffDays(toDay(project.realEndDate), toDay(project.endDate))
    } else {
      delayDays = maxOverdueDays
    }

    const formatValue = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '0.00')

    return {
      success: true,
      data: {
        // Valores base
        BAC: formatValue(BAC),
        AC: formatValue(AC),
        EV: formatValue(EV),
        PV: formatValue(PV),
        
        // Índices
        SPI: formatValue(SPI),
        CPI: formatValue(CPI),
        
        // Variâncias
        SV: formatValue(SV),
        CV: formatValue(CV),
        
        // Estimativas
        EAC: formatValue(EAC),
        ETC: formatValue(ETC),
        VAC: formatValue(VAC),
        
        // Progresso
        progress: formatValue(progress),
        delayDays,
        
        // Status
        scheduleStatus: SPI >= 1 ? 'on-track' : SPI >= 0.9 ? 'warning' : 'critical',
        costStatus: CPI >= 1 ? 'on-track' : CPI >= 0.9 ? 'warning' : 'critical'
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
    await requireProjectAccess(data.projectId)
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
    const current = await prisma.projectRecord.findUnique({
      where: { id },
      select: { projectId: true },
    })
    if (!current?.projectId) return { success: false, error: 'Registro não encontrado' }
    await requireProjectAccess(current.projectId)

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
    await requireProjectAccess(record.projectId)

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
    await requireProjectAccess(projectId)
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
    await requireProjectAccess(data.projectId)
    await requireProjectAccess(data.dependsOnProjectId)
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
    await requireProjectAccess(dependency.projectId)

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
    const { user } = await requireProjectAccess(projectId)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
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
        where: { projectId, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
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
    const { user } = await requireProjectAccess(projectId)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Buscar tarefas críticas OU atrasadas
    const items = await prisma.projectItem.findMany({
      where: {
        projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
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
