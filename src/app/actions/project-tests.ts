'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTestScenario(projectId: string, data: any) {
  try {
    const scenario = await prisma.testScenario.create({
      data: {
        projectId,
        scenario: data.scenario,
        task: data.task,
        status: data.status || 'Não iniciado',
        responsible: data.responsible,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        externalId: data.externalId,
        sequence: data.sequence,
        docBeo: data.docBeo,
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/testes/cenarios`)
    revalidatePath(`/dashboard/projetos/${projectId}/testes/status`)
    return { success: true, message: 'Cenário criado com sucesso!', data: scenario }
  } catch (error) {
    console.error('Erro ao criar cenário:', error)
    return { success: false, error: 'Falha ao criar cenário' }
  }
}

export async function updateTestScenario(id: string, projectId: string, data: any) {
  try {
    await prisma.testScenario.update({
      where: { id },
      data: {
        scenario: data.scenario,
        task: data.task,
        status: data.status,
        responsible: data.responsible,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        sequence: data.sequence,
        docBeo: data.docBeo,
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/testes/cenarios`)
    revalidatePath(`/dashboard/projetos/${projectId}/testes/status`)
    return { success: true, message: 'Cenário atualizado!' }
  } catch (error) {
    console.error('Erro ao atualizar cenário:', error)
    return { success: false, error: 'Falha ao atualizar' }
  }
}

export async function deleteTestScenario(id: string, projectId: string) {
  try {
    await prisma.testScenario.delete({ where: { id } })
    revalidatePath(`/dashboard/projetos/${projectId}/testes/cenarios`)
    revalidatePath(`/dashboard/projetos/${projectId}/testes/status`)
    return { success: true, message: 'Cenário excluído!' }
  } catch (error) {
    console.error('Erro ao excluir cenário:', error)
    return { success: false, error: 'Falha ao excluir' }
  }
}

export async function getTestScenarios(projectId: string) {
  try {
    const scenarios = await prisma.testScenario.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' } // Or sequence/externalId if preferred
    })
    return { success: true, data: scenarios }
  } catch (error) {
    console.error('Erro ao buscar cenários:', error)
    return { success: false, error: 'Erro ao carregar dados' }
  }
}

export async function getTestDashboardStats(projectId: string) {
  try {
    // Busca todos os cenários para processamento
    const scenarios = await prisma.testScenario.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' }
    })
    
    // Buscar projeto para data de fim prevista
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { endDate: true, startDate: true }
    })

    const total = scenarios.length
    const completedScenarios = scenarios.filter(s => ['Concluído', 'Sucesso', 'Passou', 'Keyuser - Concluído'].includes(s.status))
    const completed = completedScenarios.length
    const pending = total - completed
    const blocked = scenarios.filter(s => ['Bloqueado', 'Impedimento'].includes(s.status)).length
    const failed = scenarios.filter(s => ['Falhou', 'Erro'].includes(s.status)).length
    
    // Saúde do Projeto (Percentual de Sucesso)
    const medical = total > 0 ? Math.round((completed / total) * 100) : 0

    // Agrupamento por Responsável com contagem de concluídos
    const byResponsible: Record<string, { total: number, completed: number, percentage: number }> = {}
    scenarios.forEach(s => {
        const resp = s.responsible || 'Sem Responsável'
        if (!byResponsible[resp]) byResponsible[resp] = { total: 0, completed: 0, percentage: 0 }
        byResponsible[resp].total++
        if (['Concluído', 'Sucesso', 'Passou', 'Keyuser - Concluído'].includes(s.status)) {
            byResponsible[resp].completed++
        }
    })
    // Calcular percentuais
    Object.values(byResponsible).forEach(r => {
        r.percentage = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0
    })

    // Agrupamento por Status
    const byStatus: Record<string, number> = {}
    scenarios.forEach(s => {
        const st = s.status || 'Não iniciado'
        byStatus[st] = (byStatus[st] || 0) + 1
    })
    
    // --- CÁLCULO META DO DIA ---
    const targetDate = project?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Se não tiver, assume 30 dias
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Dias úteis até a data alvo (simplificado: apenas seg-sex)
    const businessDaysRemaining = countBusinessDays(today, new Date(targetDate))
    const metaPerDay = businessDaysRemaining > 0 ? Math.ceil(pending / businessDaysRemaining) : pending
    
    // --- GRÁFICO DE EVOLUÇÃO ---
    // Agrupar conclusões por data (endDate do cenário ou updatedAt)
    const completionsByDate: Record<string, number> = {}
    completedScenarios.forEach(s => {
        const date = (s.endDate || s.updatedAt).toISOString().split('T')[0]
        completionsByDate[date] = (completionsByDate[date] || 0) + 1
    })
    
    // Ordenar datas e calcular acumulado
    const sortedDates = Object.keys(completionsByDate).sort()
    let accumulatedCompleted = 0
    
    // Dados para o gráfico (Concluído x Meta)
    const chartData = sortedDates.map((date, idx) => {
        accumulatedCompleted += completionsByDate[date]
        // Meta linear: (total / dias úteis totais) * dia
        const projectStart = project?.startDate || (sortedDates[0] ? new Date(sortedDates[0]) : today)
        const totalBusinessDays = countBusinessDays(new Date(projectStart), new Date(targetDate)) || 1
        const dayIndex = countBusinessDays(new Date(projectStart), new Date(date))
        const metaAccumulated = Math.round((total / totalBusinessDays) * dayIndex)
        
        return {
            date,
            concluido: accumulatedCompleted,
            meta: metaAccumulated
        }
    })
    
    // --- TABELA DIÁRIA ---
    // Gerar tabela com: Data, Concluídos no Dia, Meta Acumulada, Saldo
    const dailyTable = chartData.map((row, idx) => ({
        date: row.date,
        completed: completionsByDate[row.date] || 0,
        accumulated: row.concluido,
        meta: row.meta,
        saldo: row.concluido - row.meta
    }))
    
    return { 
        success: true, 
        data: {
            total,
            completed,
            pending,
            blocked,
            failed,
            medical,
            byResponsible,
            byStatus,
            chartData,
            dailyTable,
            // Meta do Dia
            targetDate: targetDate.toISOString().split('T')[0],
            businessDaysRemaining,
            metaPerDay
        }
    }
  } catch (error) {
     console.error('Stats error:', error)
     return { success: false, error: 'Erro ao calcular dashboard' }
  }
}

// Helper: Conta dias úteis entre duas datas (seg-sex)
function countBusinessDays(start: Date, end: Date): number {
    let count = 0
    const curr = new Date(start)
    while (curr <= end) {
        const day = curr.getDay()
        if (day !== 0 && day !== 6) count++
        curr.setDate(curr.getDate() + 1)
    }
    return count
}

// Função para importar Excel
import * as XLSX from 'xlsx'

export async function importTestScenarios(projectId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Arquivo não fornecido' }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    
    // Ler a aba 'Outbound' conforme print, ou a primeira se não existir
    const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('outbound')) || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Converter para JSON
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    // Pular cabeçalho (assumindo linha 1)
    const dataRows = rows.slice(1)
    
    // Mapeamento de colunas (baseado no print)
    // A: ID, B: Cenário, C: Tarefa, D: Seq, E: Descrição, F: Responsável, G: DOC BEO, H: Status, I: Dt Inicio, J: Dt Conclusao
    // Índices: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    
    let count = 0
    let errors = 0
    
    for (const row of dataRows) {
        if (!row[0] || !row[1]) continue // ID e Cenário obrigatórios

        try {
            const externalId = String(row[0])
            // Normalizar datas do Excel (que são números serial)
            const parseExcelDate = (val: any) => {
                if (!val) return null
                if (typeof val === 'number') {
                    // Excel epoch (1900)
                    return new Date(Math.round((val - 25569) * 86400 * 1000))
                }
                return new Date(val)
            }

            const startDate = parseExcelDate(row[8])
            const endDate = parseExcelDate(row[9])
            
            // Upsert (Atualiza se existir ID, Cria se não)
            const existing = await prisma.testScenario.findFirst({
                where: { projectId, externalId }
            })

            if (existing) {
                await prisma.testScenario.update({
                    where: { id: existing.id },
                    data: {
                        scenario: String(row[1]),
                        task: String(row[2]),
                        sequence: String(row[3] || ''),
                        description: String(row[4] || ''),
                        responsible: String(row[5] || ''),
                        docBeo: String(row[6] || ''),
                        status: String(row[7] || 'Não iniciado'),
                        startDate,
                        endDate
                    }
                })
            } else {
                await prisma.testScenario.create({
                    data: {
                        projectId,
                        externalId,
                        scenario: String(row[1]),
                        task: String(row[2]),
                        sequence: String(row[3] || ''),
                        description: String(row[4] || ''),
                        responsible: String(row[5] || ''),
                        docBeo: String(row[6] || ''),
                        status: String(row[7] || 'Não iniciado'),
                        startDate,
                        endDate
                    }
                })
            }
            count++
        } catch (err) {
            console.error('Erro na linha:', row, err)
            errors++
        }
    }

    revalidatePath(`/dashboard/projetos/${projectId}/testes/cenarios`)
    revalidatePath(`/dashboard/projetos/${projectId}/testes/status`)
    return { success: true, message: `Importação concluída: ${count} processados, ${errors} erros.` }
  } catch (error) {
    console.error('Import error:', error)
    return { success: false, error: 'Falha ao processar arquivo' }
  }
}
