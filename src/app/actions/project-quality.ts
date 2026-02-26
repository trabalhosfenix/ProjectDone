'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

// ========= METAS DE QUALIDADE =========

export async function getProjectGoals(projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const goals = await prisma.projectGoal.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: goals }
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return { success: false, error: 'Falha ao carregar metas' }
  }
}

export async function createProjectGoal(projectId: string, data: any) {
  try {
    await requireProjectAccess(projectId)
    await prisma.projectGoal.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        metric: data.metric,
        targetValue: parseFloat(data.targetValue) || 0,
        currentValue: parseFloat(data.currentValue) || 0,
        weight: parseFloat(data.weight) || 1,
        status: data.status || 'Em andamento',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        expectedResult: data.expectedResult,
        strategicObjective: data.strategicObjective,
        verificationMethod: data.verificationMethod,
        category: data.category,
        context: data.context,
        typeId: data.typeId
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/metas`)
    return { success: true, message: 'Meta criada com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar meta:', error)
    return { success: false, error: 'Falha ao salvar meta' }
  }
}

export async function updateProjectGoal(goalId: string, projectId: string, data: any) {
  try {
    await requireProjectAccess(projectId)
    const existing = await prisma.projectGoal.findUnique({ where: { id: goalId }, select: { projectId: true } })
    if (!existing || existing.projectId !== projectId) {
      return { success: false, error: 'Acesso negado à meta' }
    }
    await prisma.projectGoal.update({
      where: { id: goalId },
      data: {
        name: data.name,
        description: data.description,
        metric: data.metric,
        targetValue: parseFloat(data.targetValue) || 0,
        currentValue: parseFloat(data.currentValue) || 0,
        weight: parseFloat(data.weight) || 1,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        expectedResult: data.expectedResult,
        strategicObjective: data.strategicObjective,
        verificationMethod: data.verificationMethod,
        category: data.category,
        context: data.context,
        typeId: data.typeId
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/metas`)
    return { success: true, message: 'Meta atualizada!' }
  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
    return { success: false, error: 'Falha ao atualizar meta' }
  }
}

export async function deleteProjectGoal(goalId: string, projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const existing = await prisma.projectGoal.findUnique({ where: { id: goalId }, select: { projectId: true } })
    if (!existing || existing.projectId !== projectId) {
      return { success: false, error: 'Acesso negado à meta' }
    }
    await prisma.projectGoal.delete({
      where: { id: goalId }
    })
    revalidatePath(`/dashboard/projetos/${projectId}/metas`)
    return { success: true, message: 'Meta removida' }
  } catch (error) {
    return { success: false, error: 'Erro ao remover meta' }
  }
}

// ========= DOCUMENTOS DO PROJETO =========

export async function getProjectDocuments(projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const documents = await prisma.projectDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: documents }
  } catch (error) {
    console.error('Erro ao buscar documentos:', error)
    return { success: false, error: 'Falha ao carregar documentos' }
  }
}

export async function createProjectDocument(projectId: string, data: any) {
  try {
    await requireProjectAccess(projectId)
    await prisma.projectDocument.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        type: data.type || 'Link',
        url: data.url,
        category: data.category,
        size: data.size,
        uploadedById: data.uploadedById,
        uploadedByName: data.uploadedByName,
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/documentos`)
    return { success: true, message: 'Documento adicionado!' }
  } catch (error) {
    console.error('Erro ao criar documento:', error)
    return { success: false, error: 'Falha ao salvar documento' }
  }
}

export async function deleteProjectDocument(docId: string, projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const existing = await prisma.projectDocument.findUnique({ where: { id: docId }, select: { projectId: true } })
    if (!existing || existing.projectId !== projectId) {
      return { success: false, error: 'Acesso negado ao documento' }
    }
    await prisma.projectDocument.delete({
      where: { id: docId }
    })
    revalidatePath(`/dashboard/projetos/${projectId}/documentos`)
    return { success: true, message: 'Documento removido' }
  } catch (error) {
    return { success: false, error: 'Erro ao remover documento' }
  }
}
