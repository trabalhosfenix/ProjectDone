'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

export async function batchReplaceResource(projectId: string, oldName: string, newName: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    if (!projectId || !oldName || !newName) {
      return { success: false, error: 'Parâmetros inválidos' }
    }

    // Atualiza tarefas onde o responsável é exatamente o oldName
    const result = await prisma.projectItem.updateMany({
      where: {
        projectId: projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
        responsible: oldName
      },
      data: {
        responsible: newName
      }
    })

    // Também podemos querer atualizar onde ele aparece na lista de recursos (se for lista separada por vírgula)
    // Mas o updateMany do prisma não suporta replace de string parcial facilmente sem raw query.
    // Vamos assumir substituição exata por enquanto para o campo 'responsible' principal.
    
    revalidatePath(`/dashboard/projetos/${projectId}`)
    
    return { 
      success: true, 
      count: result.count,
      message: `${result.count} tarefas atualizadas de "${oldName}" para "${newName}"`
    }
  } catch (error) {
    console.error('Erro na substituição:', error)
    return { success: false, error: 'Falha ao substituir recursos' }
  }
}

export async function getProjectResources(projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const items = await prisma.projectItem.findMany({
      where: { projectId, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
      select: { responsible: true },
      distinct: ['responsible']
    })
    
    const resources = items
      .map(i => i.responsible)
      .filter(Boolean)
      .sort() as string[]
      
    return { success: true, data: resources }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar recursos' }
  }
}
