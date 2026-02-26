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

const ONE_DAY_MS = 24 * 60 * 60 * 1000

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

    const normalized = sourceTasks.map((item) => ({
      id: item.id,
      name: item.task || 'Sem nome',
      wbs: item.wbs || undefined,
      start: toIsoDate(item.datePlanned || item.dateActualStart),
      end: toIsoDate(item.datePlannedEnd || item.dateActual),
      progress: getProgress(item),
      responsible: item.responsible || undefined,
      statusLabel: item.status || undefined,
      dependencies: '',
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
          progress: item.progress,
          dependencies: item.dependencies,
          wbs: item.wbs,
          responsible: item.responsible,
          statusLabel: item.statusLabel,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
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
