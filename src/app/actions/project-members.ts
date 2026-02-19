'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ... (funções anteriores getProjectMembers, addProjectMember, removeProjectMember)

export async function getProjectMembers(projectId: string) {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: members }
  } catch (error) {
    console.error('Erro ao buscar membros:', error)
    return { success: false, error: 'Falha ao carregar envolvidos' }
  }
}

export async function addProjectMember(projectId: string, email: string, role: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado com este email' }
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id
        }
      }
    })

    if (existingMember) {
      return { success: false, error: 'Usuário já é membro deste projeto' }
    }

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/envolvidos`)
    revalidatePath(`/dashboard/projetos/${projectId}/alocacao`)
    return { success: true, message: 'Membro adicionado com sucesso!' }
  } catch (error) {
    console.error('Erro ao adicionar membro:', error)
    return { success: false, error: 'Falha ao adicionar membro' }
  }
}

export async function removeProjectMember(memberId: string, projectId: string) {
  try {
    await prisma.projectMember.delete({
      where: { id: memberId }
    })
    
    revalidatePath(`/dashboard/projetos/${projectId}/envolvidos`)
    revalidatePath(`/dashboard/projetos/${projectId}/alocacao`)
    return { success: true, message: 'Membro removido' }
  } catch (error) {
    return { success: false, error: 'Erro ao remover membro' }
  }
}

export async function updateMemberAllocation(memberId: string, projectId: string, data: { effort?: number, cost?: number, revenue?: number }) {
  try {
    await prisma.projectMember.update({
      where: { id: memberId },
      data: {
        effort: data.effort,
        cost: data.cost,
        revenue: data.revenue
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/alocacao`)
    return { success: true, message: 'Alocação atualizada' }
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error)
    return { success: false, error: 'Erro ao atualizar dados' }
  }
}
