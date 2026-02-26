'use server'

import { addDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isDoneStatus, normalizeTaskStatus } from '@/lib/task-status'
import { syncProjectProgress } from '@/lib/project-progress'
import { syncStatusAndProgress } from '@/lib/project-item-flow'
import { requireProjectAccess } from '@/lib/access-control'

type CreateKanbanItemInput = {
  projectId: string
  task: string
  wbs?: string
  scenario?: string
  status?: string
  priority?: string
  responsible?: string
  datePlanned?: Date | string | null
  datePlannedEnd?: Date | string | null
}

function parseOptionalDate(value?: Date | string | null): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Buscar itens do Kanban
 */
export async function getKanbanItems(projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const items = await prisma.projectItem.findMany({
      where: {
        projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        wbs: true,
        task: true,
        scenario: true,
        status: true,
        responsible: true,
        priority: true,
        datePlanned: true,
        datePlannedEnd: true,
        dateActualStart: true,
        dateActual: true,
        originSheet: true,
        externalId: true,
        metadata: true
      }
    })

    return {
      success: true,
      data: items.map((item) => ({
        ...item,
        status: normalizeTaskStatus(item.status),
      })),
    }
  } catch (error) {
    console.error('Erro ao buscar kanban:', error)
    return { success: false, error: 'Falha ao carregar kanban' }
  }
}

/**
 * Criar novo item no Kanban
 */
export async function createKanbanItem(input: CreateKanbanItemInput) {
  try {
    const { user } = await requireProjectAccess(input.projectId)
    const normalizedStatus = normalizeTaskStatus(input.status)
    const plannedStart = parseOptionalDate(input.datePlanned) ?? startOfDay(new Date())
    const plannedEnd = parseOptionalDate(input.datePlannedEnd) ?? addDays(plannedStart, 7)
    const needsScheduling = !parseOptionalDate(input.datePlanned) || !parseOptionalDate(input.datePlannedEnd)
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { tenantId: true },
    })

    const item = await prisma.projectItem.create({
      data: {
        projectId: input.projectId,
        tenantId: project?.tenantId || user.tenantId || undefined,
        task: input.task,
        wbs: input.wbs?.trim() || null,
        scenario: input.scenario || null,
        originSheet: 'KANBAN',
        status: normalizedStatus,
        priority: input.priority || 'Média',
        responsible: input.responsible || null,
        datePlanned: plannedStart,
        datePlannedEnd: plannedEnd,
        metadata: {
          needsScheduling,
          createdFrom: 'KANBAN',
          progress: isDoneStatus(normalizedStatus) ? 1 : 0,
        },
      }
    })

    revalidatePath(`/dashboard/projetos/${input.projectId}/acompanhamento/kanban`)
    revalidatePath(`/dashboard/projetos/${input.projectId}/kanban`)
    revalidatePath(`/dashboard/projetos/${input.projectId}/cronograma`)
    revalidatePath(`/dashboard/projetos/${input.projectId}/gantt`)
    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao criar item kanban:', error)
    return { success: false, error: 'Falha ao criar card' }
  }
}

/**
 * Mover item de coluna (Atualizar Status)
 */
export async function moveKanbanItem(itemId: string, projectId: string, newStatus: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const existing = await prisma.projectItem.findUnique({
      where: { id: itemId },
      select: { dateActualStart: true, dateActual: true, metadata: true, status: true, tenantId: true, projectId: true }
    })

    if (!existing) {
      return { success: false, error: 'Card não encontrado' }
    }
    if (existing.projectId !== projectId || (user.tenantId && existing.tenantId && existing.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao card' }
    }

    const flow = syncStatusAndProgress({
      currentStatus: existing.status,
      currentMetadata: existing.metadata,
      patchStatus: newStatus,
    })

    const updateData: {
      status: string
      dateActualStart?: Date
      dateActual?: Date | null
      metadata: Record<string, unknown>
    } = { status: flow.status, metadata: flow.metadata }

    if (flow.status === 'Em andamento' && !existing.dateActualStart) {
      updateData.dateActualStart = new Date()
    }

    if (flow.status === 'Concluído') {
      if (!existing.dateActual) {
        updateData.dateActual = new Date()
      }
    }

    if (flow.status !== 'Concluído' && existing.dateActual) {
      updateData.dateActual = null
    }

    await prisma.projectItem.update({
      where: { id: itemId },
      data: updateData
    })
    await syncProjectProgress(projectId)

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)
    revalidatePath(`/dashboard/projetos/${projectId}/kanban`)
    revalidatePath(`/dashboard/projetos/${projectId}/cronograma`)
    revalidatePath(`/dashboard/projetos/${projectId}/gantt`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao mover item kanban:', error)
    return { success: false, error: 'Falha ao mover card' }
  }
}

/**
 * Deletar item do Kanban
 */
export async function deleteKanbanItem(itemId: string, projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const existing = await prisma.projectItem.findUnique({
      where: { id: itemId },
      select: { projectId: true, tenantId: true },
    })
    if (!existing || existing.projectId !== projectId || (user.tenantId && existing.tenantId && existing.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao card' }
    }
    await prisma.projectItem.delete({
      where: { id: itemId }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)
    revalidatePath(`/dashboard/projetos/${projectId}/kanban`)
    revalidatePath(`/dashboard/projetos/${projectId}/cronograma`)
    revalidatePath(`/dashboard/projetos/${projectId}/gantt`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar item kanban:', error)
    return { success: false, error: 'Falha ao deletar card' }
  }
}
