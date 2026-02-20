/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function classifyRisk(probability: number, impact: number) {
  const severity = probability * impact

  if (severity >= 15) return { severity, level: 'Crítico' as const, priority: 'P1' as const }
  if (severity >= 10) return { severity, level: 'Alto' as const, priority: 'P2' as const }
  if (severity >= 5) return { severity, level: 'Médio' as const, priority: 'P3' as const }
  return { severity, level: 'Baixo' as const, priority: 'P4' as const }
}

export async function getProjectRisks(projectId: string) {
  try {
    const risks = await prisma.projectRisk.findMany({
      where: { projectId },
      orderBy: { severity: 'desc' },
    })
    return { success: true, data: risks }
  } catch (error) {
    console.error('Erro ao buscar riscos:', error)
    return { success: false, error: 'Falha ao carregar riscos' }
  }
}

export async function getProjectRiskDashboard(projectId: string) {
  try {
    const risks = await prisma.projectRisk.findMany({ where: { projectId } })

    const byLevel = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 }
    const byStatus: Record<string, number> = {}

    for (const risk of risks) {
      const level = classifyRisk(risk.probability, risk.impact).level
      byLevel[level] += 1
      const status = risk.status || 'Ativo'
      byStatus[status] = (byStatus[status] || 0) + 1
    }

    return {
      success: true,
      data: {
        total: risks.length,
        byLevel,
        byStatus,
      },
    }
  } catch (error) {
    console.error('Erro ao calcular dashboard de riscos:', error)
    return { success: false, error: 'Falha ao calcular dashboard de riscos' }
  }
}

export async function createProjectRisk(projectId: string, data: any) {
  try {
    const probability = parseInt(data.probability) || 1
    const impact = parseInt(data.impact) || 1
    const classified = classifyRisk(probability, impact)

    await prisma.projectRisk.create({
      data: {
        projectId,
        description: data.description,
        type: data.type || 'Ameaça',
        category: data.category,
        causes: data.causes,
        consequences: data.consequences,
        contingency: data.contingency,
        probability,
        impact,
        severity: classified.severity,
        responseStrategy: data.responseStrategy,
        responsePlan: data.responsePlan,
        status: data.status,
        owner: data.owner,
      },
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
      where: { id: riskId },
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
      where: { id: riskId },
    })
    return { success: true, data: risk }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar risco' }
  }
}

export async function updateProjectRisk(riskId: string, projectId: string, data: any) {
  try {
    const probability = parseInt(data.probability) || 1
    const impact = parseInt(data.impact) || 1
    const classified = classifyRisk(probability, impact)

    await prisma.projectRisk.update({
      where: { id: riskId },
      data: {
        description: data.description,
        type: data.type,
        category: data.category,
        causes: data.causes,
        consequences: data.consequences,
        contingency: data.contingency,
        probability,
        impact,
        severity: classified.severity,
        responseStrategy: data.responseStrategy,
        responsePlan: data.responsePlan,
        status: data.status,
        owner: data.owner,
      },
    })

    revalidatePath(`/dashboard/projetos/${projectId}/riscos`)
    return { success: true, message: 'Risco atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atualizar risco:', error)
    return { success: false, error: 'Falha ao atualizar risco' }
  }
}
