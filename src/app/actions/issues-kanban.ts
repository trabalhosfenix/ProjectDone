'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

export async function updateIssueStatus(issueId: string, statusId: string, projectId: string) {
  try {
    await requireProjectAccess(projectId)
    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true } })
    if (!issue || issue.projectId !== projectId) {
      return { success: false, error: 'Acesso negado à questão' }
    }
    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: { statusId: parseInt(statusId) }
    })
    
    revalidatePath(`/dashboard/projetos/${projectId}/questoes/kanban`)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Erro ao atualizar status da questão:', error)
    return { success: false, error: 'Falha ao atualizar status' }
  }
}
