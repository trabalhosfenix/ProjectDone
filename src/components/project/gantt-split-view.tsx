'use client'

import { format } from 'date-fns'
import { GanttChart } from './gantt-chart'

export interface GanttSplitTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string
  wbs?: string
  responsible?: string
  statusLabel?: string
}

interface GanttSplitViewProps {
  tasks: GanttSplitTask[]
  onTaskClick?: (task: GanttSplitTask) => void
  onDateChange?: (task: GanttSplitTask, start: Date, end: Date) => void
  onProgressChange?: (task: GanttSplitTask, progress: number) => void
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year'
}

export function GanttSplitView({
  tasks,
  onTaskClick,
  onDateChange,
  onProgressChange,
  viewMode = 'Week',
}: GanttSplitViewProps) {
  const safeDate = (value: string) => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const formatDate = (value: string) => {
    const date = safeDate(value)
    return date ? format(date, 'dd/MM/yy') : '--/--/--'
  }

  const taskDepth = (wbs?: string) => {
    if (!wbs) return 0
    return Math.max(0, wbs.split('.').filter(Boolean).length - 1)
  }

  const rowStatus = (task: GanttSplitTask) => {
    const now = new Date()
    const start = safeDate(task.start)
    const end = safeDate(task.end)

    if (task.progress >= 100) {
      return { label: 'Concluído', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    }

    if (end && end < now) {
      return { label: 'Atrasado', classes: 'bg-rose-100 text-rose-700 border-rose-200' }
    }

    if (start && end && start <= now && end >= now) {
      return { label: 'Em andamento', classes: 'bg-blue-100 text-blue-700 border-blue-200' }
    }

    return { label: 'Não iniciado', classes: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  return (
    <div className="flex h-full min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <aside className="flex w-[560px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="grid h-[54px] grid-cols-[72px_minmax(0,1fr)_124px_84px_84px_56px_116px] items-center border-b border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          <span className="px-2">EAP</span>
          <span className="px-2">Atividade</span>
          <span className="px-2">Responsável</span>
          <span className="px-1 text-center">Início</span>
          <span className="px-1 text-center">Fim</span>
          <span className="px-1 text-center">%</span>
          <span className="px-1 text-center">Status</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tasks.map((task, idx) => {
            const depth = taskDepth(task.wbs)
            const status = rowStatus(task)

            return (
              <button
                key={task.id}
                type="button"
                className="grid h-[38px] w-full grid-cols-[72px_minmax(0,1fr)_124px_84px_84px_56px_116px] items-center border-b border-slate-100 px-2 text-left text-sm hover:bg-slate-50"
                onClick={() => onTaskClick?.(task)}
              >
                <span className="truncate px-2 font-mono text-xs text-slate-500">{task.wbs || idx + 1}</span>
                <span className="truncate px-2 font-medium text-slate-800" style={{ paddingLeft: `${8 + depth * 14}px` }} title={task.name}>
                  {depth > 0 ? '└ ' : ''}
                  {task.name}
                </span>
                <span className="truncate px-2 text-xs text-slate-600" title={task.responsible || ''}>
                  {task.responsible ? task.responsible.split(' ')[0] : '-'}
                </span>
                <span className="px-1 text-center text-xs text-slate-500">{formatDate(task.start)}</span>
                <span className="px-1 text-center text-xs text-slate-500">{formatDate(task.end)}</span>
                <span className="px-1 text-center text-xs font-semibold text-slate-700">{task.progress}%</span>
                <span className="px-1 text-center">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.classes}`}>
                    {status.label}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="h-full min-h-[620px]">
          <GanttChart
            tasks={tasks}
            viewMode={viewMode}
            onTaskClick={onTaskClick}
            onDateChange={onDateChange}
            onProgressChange={onProgressChange}
            barHeight={20}
            padding={18}
          />
        </div>
      </section>
    </div>
  )
}
