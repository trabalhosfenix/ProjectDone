'use server'

import { prisma } from '@/lib/prisma'

/**
 * Buscar TODOS os itens do projeto para EAP
 */
export async function getProjectItemsForEAP(projectId: string) {
  try {
    const items = await prisma.projectItem.findMany({
      where: { projectId },
      select: {
        id: true,
        task: true,
        status: true,
        priority: true,
        externalId: true,
        metadata: true,
        datePlanned: true,
        datePlannedEnd: true,
        responsible: true,
        wbs: true
      },
      // Não ordenamos aqui porque vamos fazer natural sort no JS
    })

    return { success: true, data: items }
  } catch (error) {
    console.error('Erro ao buscar itens para EAP:', error)
    return { success: false, error: 'Erro ao buscar itens' }
  }
}
