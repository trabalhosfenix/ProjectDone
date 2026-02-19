'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

// Get all Cutover tasks for a project
export async function getCutoverTasks(projectId: string) {
  try {
    const tasks = await prisma.cutoverTask.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    })
    return { success: true, data: tasks }
  } catch (error) {
    console.error('Error fetching cutover tasks:', error)
    return { success: false, error: 'Erro ao buscar tarefas' }
  }
}

// Get dashboard stats
export async function getCutoverStats(projectId: string) {
  try {
    const tasks = await prisma.cutoverTask.findMany({
      where: { projectId }
    })
    
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const delayed = tasks.filter(t => t.status === 'delayed').length
    const pending = tasks.filter(t => t.status === 'pending').length
    
    // Calculate percentages
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0
    const inProgressPercent = total > 0 ? Math.round((inProgress / total) * 100) : 0
    const delayedPercent = total > 0 ? Math.round((delayed / total) * 100) : 0
    
    return {
      success: true,
      data: {
        total,
        completed,
        inProgress,
        delayed,
        pending,
        completedPercent,
        inProgressPercent,
        delayedPercent
      }
    }
  } catch (error) {
    console.error('Error fetching cutover stats:', error)
    return { success: false, error: 'Erro ao calcular estatísticas' }
  }
}

// Create a new Cutover task
export async function createCutoverTask(projectId: string, data: any) {
  try {
    const lastTask = await prisma.cutoverTask.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    })
    
    const task = await prisma.cutoverTask.create({
      data: {
        projectId,
        activity: data.activity,
        predecessor: data.predecessor,
        responsible: data.responsible,
        transaction: data.transaction,
        duration: data.duration ? parseFloat(data.duration) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        newDeadline: data.newDeadline ? new Date(data.newDeadline) : null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        percentComplete: data.percentComplete ? parseFloat(data.percentComplete) : 0,
        percentPlanned: data.percentPlanned ? parseFloat(data.percentPlanned) : 0,
        status: data.status || 'pending',
        observations: data.observations,
        order: (lastTask?.order || 0) + 1
      }
    })
    
    revalidatePath(`/dashboard/projetos/${projectId}/cutover`)
    return { success: true, data: task }
  } catch (error) {
    console.error('Error creating cutover task:', error)
    return { success: false, error: 'Erro ao criar tarefa' }
  }
}

// Update a Cutover task
export async function updateCutoverTask(id: string, projectId: string, data: any) {
  try {
    await prisma.cutoverTask.update({
      where: { id },
      data: {
        activity: data.activity,
        predecessor: data.predecessor,
        responsible: data.responsible,
        transaction: data.transaction,
        duration: data.duration !== undefined ? parseFloat(data.duration) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        newDeadline: data.newDeadline ? new Date(data.newDeadline) : null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        percentComplete: data.percentComplete !== undefined ? parseFloat(data.percentComplete) : undefined,
        percentPlanned: data.percentPlanned !== undefined ? parseFloat(data.percentPlanned) : undefined,
        status: data.status,
        observations: data.observations
      }
    })
    
    revalidatePath(`/dashboard/projetos/${projectId}/cutover`)
    return { success: true }
  } catch (error) {
    console.error('Error updating cutover task:', error)
    return { success: false, error: 'Erro ao atualizar tarefa' }
  }
}

// Delete a Cutover task
export async function deleteCutoverTask(id: string, projectId: string) {
  try {
    await prisma.cutoverTask.delete({ where: { id } })
    revalidatePath(`/dashboard/projetos/${projectId}/cutover`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting cutover task:', error)
    return { success: false, error: 'Erro ao excluir tarefa' }
  }
}

// Import Cutover tasks from Excel
export async function importCutoverFromExcel(projectId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Arquivo não fornecido' }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    
    // Use first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON with headers
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[]
    
    // Get last order
    const lastTask = await prisma.cutoverTask.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    })
    let currentOrder = lastTask?.order || 0
    
    let count = 0
    let errors = 0
    
    // Helper to parse Excel date
    const parseExcelDate = (val: any) => {
      if (!val) return null
      if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000))
      }
      const parsed = new Date(val)
      return isNaN(parsed.getTime()) ? null : parsed
    }
    
    // Map columns (flexible matching)
    for (const row of rows) {
      try {
        // Try to find activity column
        const activity = row['ATIVIDADES'] || row['Atividade'] || row['Atividades'] || row['atividade'] || row['ATIVIDADE']
        if (!activity) continue
        
        currentOrder++
        
        await prisma.cutoverTask.create({
          data: {
            projectId,
            activity: String(activity),
            predecessor: row['PREDECESSORA'] || row['Predecessora'] || null,
            responsible: row['RESPONSAVEL PELA'] || row['RESPONSÁVEL'] || row['Responsável'] || row['Responsavel'] || null,
            transaction: row['TRANSAÇÃO'] || row['Transação'] || row['Transacao'] || null,
            duration: row['DURAÇÃO'] || row['Duração'] || row['Duracao'] ? parseFloat(String(row['DURAÇÃO'] || row['Duração'] || row['Duracao']).replace('h', '')) : null,
            startDate: parseExcelDate(row['INÍCIO'] || row['Início'] || row['Inicio'] || row['DATA INÍCIO']),
            endDate: parseExcelDate(row['TÉRMINO'] || row['Término'] || row['Termino'] || row['DATA TÉRMINO']),
            startTime: row['HORA INÍCIO'] || row['Hora Início'] || null,
            endTime: row['HORA FIM'] || row['Hora Fim'] || null,
            newDeadline: parseExcelDate(row['NOVO PRAZO'] || row['Novo Prazo']),
            actualDate: parseExcelDate(row['PRAZO REALIZADO'] || row['Prazo Realizado']),
            percentComplete: row['% CONCL'] || row['% Concl'] || row['%CONCL'] ? parseFloat(String(row['% CONCL'] || row['% Concl'] || row['%CONCL']).replace('%', '')) : 0,
            percentPlanned: row['% PLAN'] || row['% Plan'] || row['%PLAN'] || row['% PLANE'] ? parseFloat(String(row['% PLAN'] || row['% Plan'] || row['%PLAN'] || row['% PLANE']).replace('%', '')) : 0,
            status: determineStatus(row),
            observations: row['OBSERVAÇÕES'] || row['Observações'] || row['Observacoes'] || null,
            order: currentOrder
          }
        })
        count++
      } catch (err) {
        console.error('Error importing row:', row, err)
        errors++
      }
    }
    
    revalidatePath(`/dashboard/projetos/${projectId}/cutover`)
    return { success: true, message: `Importação concluída: ${count} tarefas importadas, ${errors} erros.` }
  } catch (error) {
    console.error('Import error:', error)
    return { success: false, error: 'Falha ao processar arquivo' }
  }
}

// Helper to determine status based on row data
function determineStatus(row: any): string {
  const statusCol = row['STATUS'] || row['Status'] || row['status']
  if (statusCol) {
    const s = String(statusCol).toLowerCase()
    if (s.includes('conclu') || s.includes('complet') || s.includes('done')) return 'completed'
    if (s.includes('andamento') || s.includes('progress') || s.includes('exec')) return 'in_progress'
    if (s.includes('atras') || s.includes('delay')) return 'delayed'
  }
  
  // Infer from percentComplete
  const pct = row['% CONCL'] || row['% Concl'] || 0
  const pctNum = parseFloat(String(pct).replace('%', '')) || 0
  
  if (pctNum >= 100) return 'completed'
  if (pctNum > 0) return 'in_progress'
  
  return 'pending'
}
