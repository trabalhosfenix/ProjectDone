'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

/**
 * Buscar itens do Checklist
 */
export async function getChecklistItems(projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const items = await prisma.projectItem.findMany({
      where: {
        projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
        originSheet: 'CHECKLIST'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
          id: true,
          task: true,
          status: true,
          responsible: true
      }
    })

    return { success: true, data: items }
  } catch (error) {
    console.error('Erro ao buscar checklist:', error)
    return { success: false, error: 'Falha ao carregar checklist' }
  }
}

/**
 * Criar novo item no Checklist
 */
export async function createChecklistItem(projectId: string, task: string, responsible?: string) {
  try {
    const { project, user } = await requireProjectAccess(projectId)
    const item = await prisma.projectItem.create({
      data: {
        projectId,
        tenantId: project.tenantId || user.tenantId || undefined,
        task,
        originSheet: 'CHECKLIST',
        status: 'Pendente',
        responsible: responsible || null
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/checklist`)
    return { success: true, data: item }
  } catch (error) {
    console.error('Erro ao criar item do checklist:', error)
    return { success: false, error: 'Falha ao criar item' }
  }
}

/**
 * Alternar status do item (Concluido/Pendente)
 */
export async function toggleChecklistItem(itemId: string, projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const item = await prisma.projectItem.findUnique({
      where: { id: itemId },
      select: { id: true, status: true, projectId: true, tenantId: true }
    })

    if (!item) return { success: false, error: 'Item não encontrado' }
    if (item.projectId !== projectId || (user.tenantId && item.tenantId && item.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao item' }
    }

    const newStatus = item.status === 'Concluído' ? 'Pendente' : 'Concluído'

    await prisma.projectItem.update({
      where: { id: itemId },
      data: { status: newStatus }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/checklist`)
    return { success: true, status: newStatus }
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return { success: false, error: 'Falha ao atualizar status' }
  }
}

/**
 * Deletar item do Checklist
 */
export async function deleteChecklistItem(itemId: string, projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const item = await prisma.projectItem.findUnique({
      where: { id: itemId },
      select: { projectId: true, tenantId: true }
    })
    if (!item || item.projectId !== projectId || (user.tenantId && item.tenantId && item.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao item' }
    }
    await prisma.projectItem.delete({
      where: { id: itemId }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/checklist`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return { success: false, error: 'Falha ao deletar item' }
  }
}
