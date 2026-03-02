import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

type RawTask = {
  id: string
  task: string | null
  wbs: string | null
  datePlanned: Date | null
  datePlannedEnd: Date | null
  dateActualStart: Date | null
  dateActual: Date | null
  metadata: unknown
  status: string | null
  responsible: string | null
}

type RawDependency = {
  predecessorItemId: string
  successorItemId: string
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

type ParsedPredecessor = {
  ref: string
}

const toIsoDate = (value?: Date | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function getProgress(task: RawTask) {
  const metadata = task.metadata && typeof task.metadata === 'object' ? (task.metadata as Record<string, unknown>) : {}
  const metadataProgress = Number(metadata.progress ?? 0)
  const normalizedProgress = Number.isFinite(metadataProgress)
    ? metadataProgress > 1
      ? metadataProgress
      : metadataProgress * 100
    : 0

  const statusText = String(task.status || '').toLowerCase()
  const isDoneByStatus = statusText.includes('concl') || statusText.includes('done') || statusText.includes('completed')
  const progress = isDoneByStatus ? 100 : normalizedProgress
  return Math.max(0, Math.min(100, progress))
}

function parsePredecessors(raw: unknown): ParsedPredecessor[] {
  if (!raw || typeof raw !== 'string') return []

  return raw
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => {
      const match = token.match(/^([\w.\-]+)/)
      return { ref: match?.[1] || token }
    })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user } = await requireProjectAccess(id)

    const sourceTasks = await prisma.projectItem.findMany({
      where: {
        projectId: id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        task: true,
        wbs: true,
        datePlanned: true,
        datePlannedEnd: true,
        dateActualStart: true,
        dateActual: true,
        metadata: true,
        status: true,
        responsible: true,
      },
    })

    const links = await prisma.projectItemDependency.findMany({
      where: {
        projectId: id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      select: {
        predecessorItemId: true,
        successorItemId: true,
      },
    })

    const predecessorsBySuccessor = links.reduce<Map<string, Set<string>>>((acc, link: RawDependency) => {
      const current = acc.get(link.successorItemId) || new Set<string>()
      current.add(link.predecessorItemId)
      acc.set(link.successorItemId, current)
      return acc
    }, new Map())

    const itemById = new Map(sourceTasks.map((item) => [item.id, item]))
    const itemByWbs = new Map(
      sourceTasks
        .filter((item) => item.wbs)
        .map((item) => [item.wbs as string, item])
    )
    const itemByIndex = new Map(sourceTasks.map((item, index) => [String(index + 1), item]))

    sourceTasks.forEach((item) => {
      const metadata = item.metadata && typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : {}
      const manualPredecessors = parsePredecessors(metadata.predecessors)

      if (manualPredecessors.length === 0) return

      const current = predecessorsBySuccessor.get(item.id) || new Set<string>()

      manualPredecessors.forEach((predecessor) => {
        const resolved =
          itemById.get(predecessor.ref) ||
          itemByWbs.get(predecessor.ref) ||
          itemByIndex.get(predecessor.ref)

        if (resolved?.id && resolved.id !== item.id) {
          current.add(resolved.id)
        }
      })

      predecessorsBySuccessor.set(item.id, current)
    })

    const normalized = sourceTasks.map((item) => ({
      id: item.id,
      name: item.task || 'Sem nome',
      wbs: item.wbs || undefined,
      start: toIsoDate(item.datePlanned || item.dateActualStart),
      end: toIsoDate(item.datePlannedEnd || item.dateActual),
      progress: getProgress(item),
      finish: toIsoDate(item.datePlannedEnd || item.dateActual),
      percent_complete: getProgress(item),
      is_summary: Boolean(item.wbs && item.wbs.split('.').length <= 1),
      responsible: item.responsible || undefined,
      statusLabel: item.status || undefined,
      dependencies: Array.from(predecessorsBySuccessor.get(item.id) || []),
    }))

    const datedTasks = normalized.filter((item) => item.start && item.end)
    const datedStarts = datedTasks.map((task) => new Date(task.start as string).getTime())
    const datedEnds = datedTasks.map((task) => new Date(task.end as string).getTime())
    const fallbackStart =
      datedStarts.length > 0 ? new Date(Math.min(...datedStarts)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    const fallbackEnd =
      datedEnds.length > 0 ? new Date(Math.max(...datedEnds)).toISOString().slice(0, 10) : new Date(Date.now() + ONE_DAY_MS).toISOString().slice(0, 10)

    const tasks = normalized
      .map((item, index) => {
        const syntheticStart = new Date(new Date(fallbackStart).getTime() + index * ONE_DAY_MS).toISOString().slice(0, 10)
        const syntheticEnd = new Date(new Date(syntheticStart).getTime() + ONE_DAY_MS).toISOString().slice(0, 10)

        const start = item.start || item.end || syntheticStart
        const end = item.end || item.start || syntheticEnd

        if (!start || !end) return null

        return {
          id: item.id,
          name: item.name,
          start,
          end,
          finish: end,
          progress: item.progress,
          percent_complete: item.progress,
          dependencies: item.dependencies,
          wbs: item.wbs,
          is_summary: item.is_summary,
          responsible: item.responsible,
          statusLabel: item.statusLabel,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      project_id: id,
      tasks,
      data: tasks,
      summary: {
        total: tasks.length,
      },
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao montar dados de Gantt do projeto:', error)
    return NextResponse.json({ success: false, error: 'Falha ao buscar dados de Gantt local' }, { status: 500 })
  }
}
