'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { syncProjectProgress } from '@/lib/project-progress'
import { syncStatusAndProgress } from '@/lib/project-item-flow'

/**
 * Buscar todas as tarefas do projeto (sem hierarquia por enquanto)
 */
export async function getProjectItemsTree(projectId: string) {
  try {
    const items = await prisma.projectItem.findMany({
      where: { projectId },
      orderBy: [
        { externalId: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Por enquanto, retornar lista plana (hierarquia será implementada depois)
    const itemsWithChildren = items.map(item => ({
      ...item,
      children: []
    }))

    return { success: true, data: itemsWithChildren }
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return { success: false, error: 'Erro ao buscar tarefas' }
  }
}

/**
 * Buscar tarefa específica
 */
export async function getProjectItem(id: string) {
  try {
    const item = await prisma.projectItem.findUnique({
      where: { id }
    })

    if (!item) {
      return { success: false, error: 'Tarefa não encontrada' }
    }

    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return { success: false, error: 'Erro ao buscar tarefa' }
  }
}

/**
 * Criar nova tarefa
 */
export async function createProjectItem(data: {
  projectId: string
  task: string
  scenario?: string
  responsible?: string
  status?: string
  priority?: string
  perspective?: string
  plannedValue?: number
  actualCost?: number
  datePlanned?: Date
  dateActual?: Date
}) {
  try {
    const item = await prisma.projectItem.create({
      data: {
        task: data.task,
        scenario: data.scenario,
        responsible: data.responsible,
        status: data.status || 'A iniciar',
        priority: data.priority || 'Média',
        perspective: data.perspective || 'Geral',
        plannedValue: data.plannedValue || 0,
        actualCost: data.actualCost || 0,
        datePlanned: data.datePlanned,
        dateActual: data.dateActual,
        originSheet: 'MANUAL',
        project: {
          connect: { id: data.projectId }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${data.projectId}/monitorar`)
    revalidatePath(`/dashboard/projetos/${data.projectId}/cronograma`)
    revalidatePath(`/dashboard/projetos/${data.projectId}/kanban`)
    revalidatePath(`/dashboard/projetos/${data.projectId}/acompanhamento/kanban`)
    revalidatePath(`/dashboard/projetos/${data.projectId}/gantt`)
    revalidatePath(`/dashboard/projetos/${data.projectId}/situacao`)
    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return { success: false, error: 'Erro ao criar tarefa' }
  }
}

/**
 * Atualizar tarefa
 */
export async function updateProjectItem(
  id: string,
  data: Partial<{
    task: string
    scenario: string
    responsible: string
    status: string
    priority: string
    perspective: string
    plannedValue: number
    actualCost: number
    datePlanned: Date
    datePlannedEnd: Date
    dateActual: Date
    dateActualStart: Date
    metadata: any
    isCritical: boolean
  }>
) {
  try {
    const currentItem = await prisma.projectItem.findUnique({
      where: { id },
      select: { projectId: true, metadata: true, status: true, dateActual: true, dateActualStart: true }
    })

    if (!currentItem) {
      return { success: false, error: 'Tarefa não encontrada' }
    }

    const shouldSyncFlow = data.status !== undefined || data.metadata !== undefined
    const flow = shouldSyncFlow
      ? syncStatusAndProgress({
          currentStatus: currentItem.status,
          currentMetadata: currentItem.metadata,
          patchStatus: data.status,
          patchMetadata: data.metadata,
        })
      : null

    const dataToUpdate: Record<string, unknown> = {
      ...data,
    }

    if (flow) {
      dataToUpdate.status = flow.status
      dataToUpdate.metadata = flow.metadata

      if (flow.status === 'Em andamento' && !currentItem.dateActualStart && data.dateActualStart === undefined) {
        dataToUpdate.dateActualStart = new Date()
      }

      if (flow.status === 'Concluído' && !currentItem.dateActual && data.dateActual === undefined) {
        dataToUpdate.dateActual = new Date()
      }

      if (flow.status !== 'Concluído' && currentItem.dateActual && data.dateActual === undefined) {
        dataToUpdate.dateActual = null
      }
    }

    const item = await prisma.projectItem.update({
      where: { id },
      data: dataToUpdate
    })

    if (currentItem.projectId) {
      await syncProjectProgress(currentItem.projectId)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/monitorar`)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/cronograma`)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/kanban`)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/acompanhamento/kanban`)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/gantt`)
      revalidatePath(`/dashboard/projetos/${currentItem.projectId}/situacao`)
    }

    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    return { success: false, error: 'Erro ao atualizar tarefa' }
  }
}

/**
 * Alternar status crítico da tarefa
 */
export async function toggleProjectItemCritical(id: string, isCritical: boolean) {
  try {
    const item = await prisma.projectItem.update({
      where: { id },
      data: { isCritical },
      select: { projectId: true, isCritical: true }
    })

    if (item.projectId) {
      revalidatePath(`/dashboard/projetos/${item.projectId}/monitorar`)
    }

    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao alterar status crítico:', error)
    return { success: false, error: 'Erro ao alterar status crítico' }
  }
}

/**
 * Deletar tarefa
 */
export async function deleteProjectItem(id: string) {
  try {
    const item = await prisma.projectItem.findUnique({
      where: { id },
      select: { projectId: true }
    })

    await prisma.projectItem.delete({ where: { id } })

    if (item?.projectId) {
      revalidatePath(`/dashboard/projetos/${item.projectId}/monitorar`)
      revalidatePath(`/dashboard/projetos/${item.projectId}/cronograma`)
      revalidatePath(`/dashboard/projetos/${item.projectId}/kanban`)
      revalidatePath(`/dashboard/projetos/${item.projectId}/acompanhamento/kanban`)
      revalidatePath(`/dashboard/projetos/${item.projectId}/gantt`)
      revalidatePath(`/dashboard/projetos/${item.projectId}/situacao`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error)
    return { success: false, error: 'Erro ao excluir tarefa' }
  }
}
