'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Listar todos os perfis (roles)
export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
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
    const role = await prisma.role.create({
      data: {
        name: data.name,
        permissions: data.permissions
      }
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, data: role, message: 'Perfil criado com sucesso!' }
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'Já existe um perfil com este nome' }
    }
    return { success: false, error: 'Falha ao criar perfil' }
  }
}

// Atualizar perfil
export async function updateRole(id: string, data: { name?: string, permissions?: Record<string, boolean> }) {
  try {
    const role = await prisma.role.update({
      where: { id },
      data
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, data: role, message: 'Perfil atualizado!' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: 'Falha ao atualizar perfil' }
  }
}

// Deletar perfil
export async function deleteRole(id: string) {
  try {
    // Verificar se tem usuários com este perfil
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    })
    
    if (role && role._count.users > 0) {
      return { success: false, error: `Não é possível excluir. ${role._count.users} usuário(s) estão usando este perfil.` }
    }
    
    await prisma.role.delete({ where: { id } })
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
    await prisma.user.update({
      where: { id: userId },
      data: { roleId }
    })
    revalidatePath('/dashboard/sistema/perfis')
    return { success: true, message: 'Perfil atribuído com sucesso!' }
  } catch (error) {
    console.error('Erro ao atribuir perfil:', error)
    return { success: false, error: 'Falha ao atribuir perfil' }
  }
}
