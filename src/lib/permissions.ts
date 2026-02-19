import { prisma } from '@/lib/prisma'

// Lista de permissões do sistema
export const PERMISSIONS = {
  ACCESS_SYSTEM: 'acessar_sistema',
  CHANGE_PASSWORD: 'alterar_senha',
  CHANGE_PROFILE: 'alterar_cadastro',
  VIEW_PROGRAMS: 'listar_programas',
  VIEW_DOCUMENTS: 'listar_documentos',
  VIEW_TEMPLATES: 'listar_modelos',
  VIEW_ORGS: 'listar_organizacoes',
  VIEW_AREAS: 'listar_areas',
  VIEW_PEOPLE: 'listar_pessoas',
  ADD_PROJECTS: 'adicionar_projetos',
  REMOVE_PROJECTS: 'remover_projetos',
  ADD_PROPOSALS: 'adicionar_propostas',
  CHANGE_PROJECT_CONFIG: 'alterar_config_projeto',
  EDIT_PROJECT: 'editar_projeto',
  MANAGE_PROGRAMS: 'gerenciar_programas',
  MANAGE_PLANS: 'gerenciar_planos',
  MANAGE_SCORING: 'gerenciar_pontuacao',
  MANAGE_FOLDERS: 'gerenciar_pastas',
  MANAGE_PUBLIC_DOCS: 'gerenciar_docs_publicos',
  MANAGE_PEOPLE: 'gerenciar_pessoas',
  MANAGE_REGISTERS: 'gerenciar_cadastros',
  MANAGE_FLOWS: 'gerenciar_fluxos',
  MANAGE_VIEWS: 'gerenciar_visoes',
  ADMIN_SYSTEM: 'admin_sistema',
} as const

export type PermissionKey = keyof typeof PERMISSIONS

// Buscar permissões do usuário pelo ID
export async function getUserPermissions(userId: string): Promise<Record<string, boolean>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roleId: true
      }
    })

    if (!user || !user.roleId) {
      return {}
    }

    // Buscar role separadamente
    const role = await prisma.role.findUnique({
      where: { id: user.roleId }
    })

    if (!role) {
      return {}
    }

    const permissions = role.permissions as Record<string, boolean> | null
    return permissions || {}
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return {}
  }
}

// Verificar se usuário tem uma permissão específica
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  
  // Admin do sistema tem todas as permissões
  if (permissions[PERMISSIONS.ADMIN_SYSTEM]) {
    return true
  }
  
  return permissions[permission] === true
}

// Verificar múltiplas permissões (retorna true se tiver QUALQUER uma)
export async function hasAnyPermission(userId: string, permissionList: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  
  if (permissions[PERMISSIONS.ADMIN_SYSTEM]) {
    return true
  }
  
  return permissionList.some(p => permissions[p] === true)
}

// Verificar múltiplas permissões (retorna true se tiver TODAS)
export async function hasAllPermissions(userId: string, permissionList: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  
  if (permissions[PERMISSIONS.ADMIN_SYSTEM]) {
    return true
  }
  
  return permissionList.every(p => permissions[p] === true)
}

// Helper para uso em Server Actions
export async function checkPermission(userId: string, permission: string): Promise<{ allowed: boolean; error?: string }> {
  const allowed = await hasPermission(userId, permission)
  
  if (!allowed) {
    return { allowed: false, error: 'Você não tem permissão para realizar esta ação.' }
  }
  
  return { allowed: true }
}
