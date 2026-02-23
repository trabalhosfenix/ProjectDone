'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

export async function createProjectGoalType(projectId: string, data: any) {
  try {
    await requireProjectAccess(projectId)
    await prisma.projectGoalType.create({
      data: {
        projectId,
        name: data.name,
        dataType: data.dataType,
        unit: data.unit
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/metas/configuracao`)
    return { success: true, message: 'Tipo de meta criado com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar tipo de meta:', error)
    return { success: false, error: 'Falha ao salvar tipo de meta' }
  }
}

export async function getProjectGoalTypes(projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const types = await prisma.projectGoalType.findMany({
      where: { projectId },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: types }
  } catch (error) {
    console.error('Erro ao buscar tipos de meta:', error)
    return { success: false, error: 'Erro ao carregar tipos' }
  }
}

export async function deleteProjectGoalType(id: string, projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const existing = await prisma.projectGoalType.findUnique({ where: { id }, select: { projectId: true } })
    if (!existing || existing.projectId !== projectId) {
      return { success: false, error: 'Acesso negado ao tipo de meta' }
    }
    await prisma.projectGoalType.delete({
      where: { id }
    })
    revalidatePath(`/dashboard/projetos/${projectId}/metas/configuracao`)
    return { success: true, message: 'Tipo removido!' }
  } catch (error) {
    console.error('Erro ao excluir tipo:', error)
    return { success: false, error: 'Erro ao excluir' }
  }
}
