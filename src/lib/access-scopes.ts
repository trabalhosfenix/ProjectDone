export type ScopedUser = {
  id: string
  role: string
  tenantId: string | null
}

export function buildProjectScope(user: ScopedUser) {
  const isAdmin = user.role === "ADMIN"

  if (isAdmin) {
    if (user.tenantId) {
      return { tenantId: user.tenantId }
    }
    return {}
  }

  if (user.tenantId) {
    return {
      tenantId: user.tenantId,
      OR: [
        { createdById: user.id },
        { members: { some: { userId: user.id } } },
      ],
    }
  }

  return {
    OR: [
      { createdById: user.id },
      { members: { some: { userId: user.id } } },
    ],
  }
}

export function buildProjectItemScope(user: ScopedUser) {
  const isAdmin = user.role === "ADMIN"
  const projectScope = buildProjectScope(user)

  if (isAdmin) {
    return user.tenantId ? { tenantId: user.tenantId } : undefined
  }

  return {
    ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    project: { is: projectScope },
  }
}

export function canAccessFeature(
  userRole: string | null | undefined,
  permissions: Record<string, unknown> | null | undefined,
  featureId: string
) {
  if (userRole === "ADMIN") return true
  return permissions?.[featureId] === true
}
