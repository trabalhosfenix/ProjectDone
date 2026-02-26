'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireProjectAccess } from '@/lib/access-control'

// ... (funções anteriores getProjectMembers, addProjectMember, removeProjectMember)

export async function getProjectMembers(projectId: string) {
  try {
    const { user } = await requireProjectAccess(projectId)
    const members = await prisma.projectMember.findMany({
      where: { projectId, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
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

export async function getAvailableProjectUsers(projectId: string) {
  try {
    const { project, user: currentUser } = await requireProjectAccess(projectId)
    const expectedTenantId = project.tenantId || currentUser.tenantId || null

    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    })

    const existingUserIds = existingMembers.map((member) => member.userId)

    const users = await prisma.user.findMany({
      where: {
        ...(expectedTenantId ? { tenantId: expectedTenantId } : {}),
        ...(existingUserIds.length > 0 ? { id: { notIn: existingUserIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Erro ao buscar usuários elegíveis para o projeto:', error)
    return { success: false, error: 'Falha ao carregar usuários disponíveis' }
  }
}

export async function addProjectMember(projectId: string, email: string, role: string) {
  try {
    const { project, user: currentUser } = await requireProjectAccess(projectId)
    const normalizedEmail = email.trim().toLowerCase()
    const expectedTenantId = project.tenantId || currentUser.tenantId || null

    const user = expectedTenantId
      ? await prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: expectedTenantId,
              email: normalizedEmail,
            },
          },
          select: {
            id: true,
            tenantId: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
            tenantId: true,
          },
          orderBy: { createdAt: 'asc' },
        })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado com este email' }
    }

    if (expectedTenantId && user.tenantId !== expectedTenantId) {
      return { success: false, error: 'Somente usuários da mesma conta (tenant) podem ser vinculados ao projeto' }
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
        role,
        tenantId: project.tenantId || currentUser.tenantId || undefined,
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
    const { user } = await requireProjectAccess(projectId)
    const existing = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { projectId: true, tenantId: true },
    })
    if (!existing || existing.projectId !== projectId || (user.tenantId && existing.tenantId && existing.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao membro' }
    }
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
    const { user } = await requireProjectAccess(projectId)
    const existing = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { projectId: true, tenantId: true },
    })
    if (!existing || existing.projectId !== projectId || (user.tenantId && existing.tenantId && existing.tenantId !== user.tenantId)) {
      return { success: false, error: 'Acesso negado ao membro' }
    }
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
