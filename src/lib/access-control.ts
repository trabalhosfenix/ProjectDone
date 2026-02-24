import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildProjectScope as buildProjectScopeFromScopes } from '@/lib/access-scopes'

export class AccessError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.status = status
    this.name = 'AccessError'
  }
}

export type CurrentUser = {
  id: string
  role: string
  tenantId: string | null
}

export async function requireAuth(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    throw new AccessError('Não autenticado', 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tenantId: true },
  })

  if (!user) {
    throw new AccessError('Usuário não encontrado', 401)
  }

  return {
    id: user.id,
    role: user.role || 'USER',
    tenantId: user.tenantId || null,
  }
}

export async function requireTenantAccess(): Promise<CurrentUser> {
  const user = await requireAuth()
  if (!user.tenantId) {
    throw new AccessError('Usuário sem tenant associado', 403)
  }
  return user
}

export function buildProjectScope(user: CurrentUser) {
  return buildProjectScopeFromScopes(user)
}

export async function requireProjectAccess(projectId: string, user?: CurrentUser) {
  const currentUser = user || (await requireAuth())
  const where = {
    id: projectId,
    ...buildProjectScope(currentUser),
  }

  const project = await prisma.project.findFirst({
    where,
    select: { id: true, tenantId: true },
  })

  if (!project) {
    throw new AccessError('Acesso negado ao projeto', 403)
  }

  return { project, user: currentUser }
}
