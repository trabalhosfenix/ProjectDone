'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type SessionUser = {
  role?: string
  tenantId?: string | null
}

async function getAdminSession() {
  const session = await getServerSession(authOptions)
  const user = (session?.user as SessionUser | undefined) || {}
  return {
    isAdmin: user.role === 'ADMIN',
    tenantId: user.tenantId || null,
  }
}

function roleScope(tenantId: string | null) {
  return tenantId ? { tenantId } : {}
}

// Listar todos os perfis (roles)
export async function getRoles() {
  try {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return { success: false, error: 'Acesso negado' }
    }

    const roles = await prisma.role.findMany({
      where: roleScope(session.tenantId),
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })
    return { success: true, data: roles }
  } catch (error) {
    console.error('Erro ao buscar perfis:', error)
    return { success: false, error: 'Falha ao carregar perfis' }
  }
}

// Criar novo perfil
export async function createRole(data: { name: string, permissions: Record<string, boolean> }) {
  try {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return { success: false, error: 'Acesso negado' }
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        permissions: data.permissions,
        tenantId: session.tenantId || undefined,
      }
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, data: role, message: 'Perfil criado com sucesso!' }
  } catch (error: unknown) {
    console.error('Erro ao criar perfil:', error)
    const code = (error as { code?: string } | null)?.code
    if (code === 'P2002') {
      return { success: false, error: 'Já existe um perfil com este nome para este tenant' }
    }
    return { success: false, error: 'Falha ao criar perfil' }
  }
}

// Atualizar perfil
export async function updateRole(id: string, data: { name?: string, permissions?: Record<string, boolean> }) {
  try {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return { success: false, error: 'Acesso negado' }
    }

    const role = await prisma.role.findFirst({
      where: { id, ...roleScope(session.tenantId) },
      select: { id: true },
    })

    if (!role) {
      return { success: false, error: 'Perfil não encontrado neste tenant' }
    }

    const updatedRole = await prisma.role.update({
      where: { id: role.id },
      data
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, data: updatedRole, message: 'Perfil atualizado!' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: 'Falha ao atualizar perfil' }
  }
}

// Deletar perfil
export async function deleteRole(id: string) {
  try {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return { success: false, error: 'Acesso negado' }
    }

    const role = await prisma.role.findFirst({
      where: { id, ...roleScope(session.tenantId) },
      include: { _count: { select: { users: true } } }
    })

    if (!role) {
      return { success: false, error: 'Perfil não encontrado neste tenant' }
    }

    if (role._count.users > 0) {
      return { success: false, error: `Não é possível excluir. ${role._count.users} usuário(s) estão usando este perfil.` }
    }

    await prisma.role.delete({ where: { id: role.id } })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, message: 'Perfil excluído' }
  } catch (error) {
    console.error('Erro ao excluir perfil:', error)
    return { success: false, error: 'Falha ao excluir perfil' }
  }
}

// Atribuir perfil a usuário
export async function assignRoleToUser(userId: string, roleId: string | null) {
  try {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return { success: false, error: 'Acesso negado' }
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        ...(session.tenantId ? { tenantId: session.tenantId } : {})
      },
      select: { id: true, tenantId: true }
    })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado neste tenant' }
    }

    if (roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          ...(session.tenantId ? { tenantId: session.tenantId } : { tenantId: user.tenantId })
        },
        select: { id: true }
      })

      if (!role) {
        return { success: false, error: 'Perfil inválido para este tenant' }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { roleId }
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, message: 'Perfil atribuído com sucesso!' }
  } catch (error) {
    console.error('Erro ao atribuir perfil:', error)
    return { success: false, error: 'Falha ao atribuir perfil' }
  }
}
