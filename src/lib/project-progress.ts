import { prisma } from '@/lib/prisma'

const DONE_STATUSES = new Set(['concluído', 'concluido', 'completed', 'done', 'sucesso', 'passou'])

const clampProgress = (value: number) => {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').replace(',', '.').trim())
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

export function normalizeItemProgress(status: string | null | undefined, metadata: unknown): number {
  const rawProgress = toNumber((metadata as { progress?: unknown } | null)?.progress)

  if (rawProgress !== null) {
    return clampProgress(rawProgress <= 1 ? rawProgress * 100 : rawProgress)
  }

  if (status && DONE_STATUSES.has(status.trim().toLowerCase())) {
    return 100
  }

  return 0
}

export async function syncProjectProgress(projectId: string) {
  const items = await prisma.projectItem.findMany({
    where: { projectId },
    select: { status: true, metadata: true },
  })

  const progress =
    items.length > 0
      ? Number(
          (
            items.reduce((sum, item) => sum + normalizeItemProgress(item.status, item.metadata), 0) /
            items.length
          ).toFixed(2)
        )
      : 0

  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  })

  return progress
}
