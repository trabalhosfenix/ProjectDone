'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateEndDate, isWorkingDay, WorkCalendarConfig } from '@/lib/calendar-engine'

type ItemState = {
  start: Date
  end: Date
  duration: number
}

type PredecessorRef = {
  ref: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lag: number
}

const DEFAULT_CONFIG: WorkCalendarConfig = {
  type: 'BUSINESS_DAYS',
  holidays: [],
  workHoursPerDay: 8,
}

function parsePredecessors(raw: unknown): PredecessorRef[] {
  if (!raw || typeof raw !== 'string') return []

  return raw
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => {
      const m = token.match(/^([\w.\-]+)\s*(FS|SS|FF|SF)?\s*([+\-]\d+)?\s*[dD]?$/)
      if (!m) return { ref: token, type: 'FS' as const, lag: 0 }

      return {
        ref: m[1],
        type: (m[2] as 'FS' | 'SS' | 'FF' | 'SF') || 'FS',
        lag: m[3] ? Number(m[3]) : 0,
      }
    })
}

function addWorkingDays(date: Date, days: number, config: WorkCalendarConfig): Date {
  const cursor = new Date(date)

  if (days === 0) return cursor

  const step = days > 0 ? 1 : -1
  let remaining = Math.abs(days)

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + step)
    if (isWorkingDay(cursor, config)) {
      remaining -= 1
    }
  }

  return cursor
}

function normalizeStart(date: Date, config: WorkCalendarConfig): Date {
  const cursor = new Date(date)
  while (!isWorkingDay(cursor, config)) {
    cursor.setDate(cursor.getDate() + 1)
  }
  return cursor
}

type SchedItem = {
  id: string
  wbs: string | null
  status: string | null
  weight: number | null
  duration: number | null
  datePlanned: Date | null
  datePlannedEnd: Date | null
  createdAt: Date
  metadata: unknown
}

function extractProgress(item: SchedItem): number {
  const meta = (item.metadata as Record<string, unknown>) || {}
  const raw = meta.progress
  const value = typeof raw === 'number' ? raw : Number(raw || 0)
  if (Number.isNaN(value)) return 0
  return value > 1 ? value / 100 : value
}

function consolidateParentProgress(items: SchedItem[]): Map<string, number> {
  const result = new Map<string, number>()

  for (const parent of items) {
    if (!parent.wbs) continue

    const children = items.filter((candidate) => {
      if (!candidate.wbs || candidate.id === parent.id) return false
      return candidate.wbs.startsWith(`${parent.wbs}.`)
    })

    if (children.length === 0) continue

    let weightSum = 0
    let progressSum = 0

    for (const child of children) {
      const weight = typeof child.weight === 'number' && child.weight > 0 ? child.weight : 1
      weightSum += weight
      progressSum += extractProgress(child) * weight
    }

    if (weightSum > 0) {
      result.set(parent.id, Number((progressSum / weightSum).toFixed(4)))
    }
  }

  return result
}

type ProjectWithCalendar = {
  workCalendar: {
    type: string
    workHoursPerDay: number
    holidays: { date: Date; recurring: boolean }[]
  } | null
}

function getCalendarConfig(project: ProjectWithCalendar | null): WorkCalendarConfig {
  const calendar = project.workCalendar

  if (!calendar) return DEFAULT_CONFIG

  return {
    type: (calendar.type as 'BUSINESS_DAYS' | 'RUNNING_DAYS') || 'BUSINESS_DAYS',
    holidays: (calendar.holidays || []).map((h) => ({
      date: h.date,
      isRecurring: Boolean(h.recurring),
    })),
    workHoursPerDay: calendar.workHoursPerDay || 8,
  }
}

export async function recalculateProjectSchedule(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workCalendar: {
          include: { holidays: true },
        },
      },
    })

    const config = getCalendarConfig(project)

    const items = await prisma.projectItem.findMany({
      where: { projectId },
      orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
    })

    if (items.length === 0) return { success: true, updates: 0, progressUpdates: 0 }

    const byId = new Map(items.map((item) => [item.id, item]))
    const byWbs = new Map(items.filter((item) => item.wbs).map((item) => [item.wbs as string, item]))
    const byIndex = new Map(items.map((item, index) => [String(index + 1), item]))

    const state = new Map<string, ItemState>()
    for (const item of items) {
      const rawDuration = Number(item.duration || (item.metadata as Record<string, unknown> | null)?.duration || 1)
      const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.ceil(rawDuration) : 1
      const start = normalizeStart(new Date(item.datePlanned || item.createdAt), config)
      const end = calculateEndDate(start, duration, config)
      state.set(item.id, { start, end, duration })
    }

    let changed = true
    let iterations = 0
    const MAX_ITERATIONS = items.length * 3

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false
      iterations += 1

      for (const item of items) {
        const current = state.get(item.id)
        if (!current) continue

        const predecessors = parsePredecessors((item.metadata as Record<string, unknown> | null)?.predecessors)
        if (predecessors.length === 0) continue

        let constrainedStart: Date | null = null

        for (const pred of predecessors) {
          const predecessorItem = byId.get(pred.ref) || byWbs.get(pred.ref) || byIndex.get(pred.ref)
          if (!predecessorItem) continue
          const predecessorState = state.get(predecessorItem.id)
          if (!predecessorState) continue

          let candidateStart: Date
          switch (pred.type) {
            case 'SS':
              candidateStart = addWorkingDays(predecessorState.start, pred.lag, config)
              break
            case 'FF': {
              const finishTarget = addWorkingDays(predecessorState.end, pred.lag, config)
              candidateStart = addWorkingDays(finishTarget, -(current.duration - 1), config)
              break
            }
            case 'SF': {
              const finishTarget = addWorkingDays(predecessorState.start, pred.lag, config)
              candidateStart = addWorkingDays(finishTarget, -(current.duration - 1), config)
              break
            }
            case 'FS':
            default:
              candidateStart = addWorkingDays(predecessorState.end, 1 + pred.lag, config)
              break
          }

          candidateStart = normalizeStart(candidateStart, config)

          if (!constrainedStart || candidateStart > constrainedStart) {
            constrainedStart = candidateStart
          }
        }

        if (!constrainedStart) continue

        const nextEnd = calculateEndDate(constrainedStart, current.duration, config)

        if (
          constrainedStart.getTime() !== current.start.getTime() ||
          nextEnd.getTime() !== current.end.getTime()
        ) {
          state.set(item.id, { ...current, start: constrainedStart, end: nextEnd })
          changed = true
        }
      }
    }

    const scheduleUpdates = Array.from(state.entries()).filter(([id, next]) => {
      const item = byId.get(id)
      if (!item) return false
      const currentStart = item.datePlanned ? new Date(item.datePlanned).getTime() : null
      const currentEnd = item.datePlannedEnd ? new Date(item.datePlannedEnd).getTime() : null
      return currentStart !== next.start.getTime() || currentEnd !== next.end.getTime()
    })

    if (scheduleUpdates.length > 0) {
      await Promise.all(
        scheduleUpdates.map(([id, next]) =>
          prisma.projectItem.update({
            where: { id },
            data: {
              datePlanned: next.start,
              datePlannedEnd: next.end,
              duration: next.duration,
            },
          })
        )
      )
    }

    const progressMap = consolidateParentProgress(items)
    const progressUpdates = Array.from(progressMap.entries())

    if (progressUpdates.length > 0) {
      await Promise.all(
        progressUpdates.map(async ([id, progress]) => {
          const item = byId.get(id)
          if (!item) return
          const metadata = ((item.metadata as Record<string, unknown>) || {}) as Record<string, unknown>

          await prisma.projectItem.update({
            where: { id },
            data: {
              status: progress >= 1 ? 'Concluído' : item.status,
              metadata: {
                ...metadata,
                progress,
              },
            },
          })
        })
      )
    }

    revalidatePath(`/dashboard/projetos/${projectId}/cronograma`)
    revalidatePath(`/dashboard/projetos/${projectId}/gantt`)
    revalidatePath(`/dashboard/projetos/${projectId}/kanban`)
    revalidatePath(`/dashboard/projetos/${projectId}/acompanhamento/kanban`)

    return {
      success: true,
      updates: scheduleUpdates.length,
      progressUpdates: progressUpdates.length,
      iterations,
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao recalcular cronograma' }
  }
}
