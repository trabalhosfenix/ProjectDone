'use client'

import { useRef } from 'react'
import { format } from 'date-fns'
import { SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GanttChart } from './gantt-chart'

export interface GanttSplitTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string | string[]
  wbs?: string
  responsible?: string
  statusLabel?: string
}

interface GanttSplitViewProps {
  tasks: GanttSplitTask[]
  onTaskEdit?: (task: GanttSplitTask) => void
  onDateChange?: (task: GanttSplitTask, start: Date, end: Date) => void
  onProgressChange?: (task: GanttSplitTask, progress: number) => void
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year'
  theme?: 'light' | 'dark'
}

export function GanttSplitView({
  tasks,
  onTaskEdit,
  onDateChange,
  onProgressChange,
  viewMode = 'Week',
  theme = 'light',
}: GanttSplitViewProps) {
  const leftRowsRef = useRef<HTMLDivElement>(null)
  const syncingScrollRef = useRef(false)

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

  const dark = theme === 'dark'

  const syncLeftScroll = (scrollTop: number) => {
    if (!leftRowsRef.current || syncingScrollRef.current) return
    const currentTop = leftRowsRef.current.scrollTop
    if (Math.abs(currentTop - scrollTop) <= 1) return

    syncingScrollRef.current = true
    leftRowsRef.current.scrollTop = scrollTop
    requestAnimationFrame(() => {
      syncingScrollRef.current = false
    })
  }

  return (
    <div className={`flex h-full min-h-[620px] overflow-hidden rounded-xl border shadow-sm ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <aside className={`flex w-[55%] shrink-0 flex-col border-r ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className={`grid h-[58px] grid-cols-[72px_minmax(0,1fr)_124px_84px_84px_56px_116px_54px] items-center border-b px-2 text-[11px] font-semibold uppercase tracking-wide ${dark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          <span className="px-2">EAP</span>
          <span className="px-2">Atividade</span>
          <span className="px-2">Responsável</span>
          <span className="px-1 text-center">Início</span>
          <span className="px-1 text-center">Fim</span>
          <span className="px-1 text-center">%</span>
          <span className="px-1 text-center">Status</span>
          <span className="px-1 text-center">Ações</span>
        </div>

        <div ref={leftRowsRef} className="flex-1 overflow-y-auto">
          {tasks.map((task, idx) => {
            const depth = taskDepth(task.wbs)
            const status = rowStatus(task)

            return (
              <div
                key={task.id}
                className={`grid h-[38px] w-full grid-cols-[72px_minmax(0,1fr)_124px_84px_84px_56px_116px_54px] items-center border-b px-2 text-left text-sm ${dark ? 'border-slate-800 hover:bg-slate-800/70' : 'border-slate-100 hover:bg-slate-50'}`}
              >
                <span className={`truncate px-2 font-mono text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{task.wbs || idx + 1}</span>
                <span className={`truncate px-2 font-medium text-xs ${dark ? 'text-slate-100' : 'text-slate-800'}`} style={{ paddingLeft: `${8 + depth * 14}px` }} title={task.name}>
                  {depth > 0 ? '└ ' : ''}
                  {task.name}
                </span>
                <span className={`truncate px-2 text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`} title={task.responsible || ''}>
                  {task.responsible ? task.responsible.split(' ')[0] : '-'}
                </span>
                <span className={`px-1 text-center text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(task.start)}</span>
                <span className={`px-1 text-center text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(task.end)}</span>
                <span className={`px-1 text-center text-xs font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{task.progress}%</span>
                <span className="px-1 text-center">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.classes}`}>
                    {status.label}
                  </span>
                </span>
                <span className="px-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Editar tarefa ${task.name}`}
                    onClick={() => onTaskEdit?.(task)}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            )
          })}
        </div>
      </aside>

      <section className={`flex min-w-0 flex-1 flex-col ${dark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="h-full min-h-[620px]">
          <GanttChart
            tasks={tasks}
            viewMode={viewMode}
            theme={theme}
            onDateChange={onDateChange}
            onProgressChange={onProgressChange}
            onScrollTopChange={syncLeftScroll}
            barHeight={20}
            padding={18}
          />
        </div>
      </section>
    </div>
  )
}
