'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Buscar itens do Kanban
 */
export async function getKanbanItems(projectId: string) {
  try {
    const items = await prisma.projectItem.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
          id: true,
          task: true, // Titulo
          status: true, // Coluna: "A iniciar", "Em andamento", "Em espera", "Concluído"
          responsible: true,
          priority: true,
          dateActualEnd: true // Usando como data de entrega/deadline
      }
    })

    return { success: true, data: items }
  } catch (error) {
    console.error('Erro ao buscar kanban:', error)
    return { success: false, error: 'Falha ao carregar kanban' }
  }
}

/**
 * Criar novo item no Kanban
 */
export async function createKanbanItem(projectId: string, task: string, status: string = 'A iniciar', priority: string = 'Média', responsible?: string) {
  try {
    const item = await prisma.projectItem.create({
      data: {
        projectId,
        task,
        originSheet: 'KANBAN',
        status,
        priority,
        responsible: responsible || null
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)
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
    await prisma.projectItem.update({
      where: { id: itemId },
      data: { status: newStatus }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)
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
    await prisma.projectItem.delete({
      where: { id: itemId }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar item kanban:', error)
    return { success: false, error: 'Falha ao deletar card' }
  }
}
