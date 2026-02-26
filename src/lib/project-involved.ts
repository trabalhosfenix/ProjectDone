import { prisma } from '@/lib/prisma'

function normalizePersonLabel(value?: string | null): string {
  return String(value || '').trim()
}

export async function getProjectInvolvedOptions(projectId: string, tenantId?: string | null) {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { user: { name: 'asc' } },
      { user: { email: 'asc' } },
    ],
  })

  return Array.from(new Set(
    members
      .map((member) => normalizePersonLabel(member.user?.name || member.user?.email))
      .filter(Boolean)
  ))
}

export function isResponsibleAllowed(responsible: string | null | undefined, options: string[]) {
  if (responsible === undefined || responsible === null || String(responsible).trim() === '') {
    return true
  }

  const normalizedResponsible = normalizePersonLabel(responsible)
  return options.includes(normalizedResponsible)
}
