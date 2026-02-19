'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProjectRisks(projectId: string) {
  try {
    const risks = await prisma.projectRisk.findMany({
      where: { projectId },
      orderBy: { severity: 'desc' }, // Riscos mais severos primeiro
    })
    return { success: true, data: risks }
  } catch (error) {
    console.error('Erro ao buscar riscos:', error)
    return { success: false, error: 'Falha ao carregar riscos' }
  }
}

export async function createProjectRisk(projectId: string, data: any) {
  try {
    const severity = (parseInt(data.probability) || 1) * (parseInt(data.impact) || 1)

    await prisma.projectRisk.create({
      data: {
        projectId,
        description: data.description,
        type: data.type || 'Ameaça',
        category: data.category,
        causes: data.causes,
        consequences: data.consequences,
        contingency: data.contingency,
        probability: parseInt(data.probability),
        impact: parseInt(data.impact),
        severity,
        responseStrategy: data.responseStrategy,
        responsePlan: data.responsePlan,
        status: data.status,
        owner: data.owner,
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/riscos`)
    return { success: true, message: 'Risco criado com sucesso!' }
  } catch (error) {
    console.error('Erro ao criar risco:', error)
    return { success: false, error: 'Falha ao salvar risco' }
  }
}

export async function deleteProjectRisk(riskId: string, projectId: string) {
  try {
    await prisma.projectRisk.delete({
      where: { id: riskId }
    })
    revalidatePath(`/dashboard/projetos/${projectId}/riscos`)
    return { success: true, message: 'Risco removido' }
  } catch (error) {
    return { success: false, error: 'Erro ao remover risco' }
  }
}

export async function getRiskById(riskId: string) {
  try {
    const risk = await prisma.projectRisk.findUnique({
      where: { id: riskId }
    })
    return { success: true, data: risk }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar risco' }
  }
}

export async function updateProjectRisk(riskId: string, projectId: string, data: any) {
  try {
    const severity = (parseInt(data.probability) || 1) * (parseInt(data.impact) || 1)

    await prisma.projectRisk.update({
      where: { id: riskId },
      data: {
        description: data.description,
        type: data.type,
        category: data.category,
        causes: data.causes,
        consequences: data.consequences,
        contingency: data.contingency,
        probability: parseInt(data.probability),
        impact: parseInt(data.impact),
        severity,
        responseStrategy: data.responseStrategy,
        responsePlan: data.responsePlan,
        status: data.status,
        owner: data.owner,
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/riscos`)
    return { success: true, message: 'Risco atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atualizar risco:', error)
    return { success: false, error: 'Falha ao atualizar risco' }
  }
}
