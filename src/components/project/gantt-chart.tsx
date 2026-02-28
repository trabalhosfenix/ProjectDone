'use client'

import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import Gantt from 'frappe-gantt'
import { getFrappeGanttTemplate, type FrappeTemplateDensity, type FrappeTemplateMode } from './frappe-gantt-template'

interface GanttTask {
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

interface GanttChartProps {
  tasks: GanttTask[]
  onTaskClick?: (task: GanttTask) => void
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void
  onProgressChange?: (task: GanttTask, progress: number) => void
  onScrollTopChange?: (scrollTop: number) => void
  syncedScrollTop?: number
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year'
  theme?: 'light' | 'dark'
  barHeight?: number
  padding?: number
  templateMode?: FrappeTemplateMode
  density?: FrappeTemplateDensity
}

export function GanttChart({
  tasks,
  onTaskClick,
  onDateChange,
  onProgressChange,
  onScrollTopChange,
  syncedScrollTop,
  viewMode = 'Week',
  theme = 'light',
  barHeight,
  padding,
  templateMode = 'default',
  density = 'comfortable',
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  const normalizeDependencies = (value: GanttTask['dependencies']) => {
    if (!value) return ''
    if (Array.isArray(value)) return value.filter(Boolean).join(',')
    return typeof value === 'string' ? value : ''
  }

  const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime())
  const formatDateBR = (value: Date) => value.toLocaleDateString('pt-BR')

  const getDurationDays = (start: Date, end: Date) => {
    const dayMs = 24 * 60 * 60 * 1000
    const diff = Math.round((end.getTime() - start.getTime()) / dayMs) + 1
    return Math.max(1, diff)
  }

  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const formattedTasks = useMemo(
    () =>
      tasks
        .filter((task) => isValidDate(task.start) && isValidDate(task.end))
        .map((task) => ({
          id: task.id,
          name: task.name,
          start: task.start,
          end: task.end,
          progress: task.progress || 0,
          dependencies: normalizeDependencies(task.dependencies),
          wbs: task.wbs || '',
          responsible: task.responsible || '',
          statusLabel: task.statusLabel || '',
        })),
    [tasks]
  )

  const template = useMemo(() => getFrappeGanttTemplate(templateMode, density), [templateMode, density])

  const resolvedBarHeight = barHeight ?? template.barHeight
  const resolvedPadding = padding ?? template.padding

  const columnWidth = useMemo(() => template.columnWidth[viewMode] ?? template.columnWidth.Week, [template, viewMode])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    containerRef.current.innerHTML = ''

    if (formattedTasks.length === 0) return

    try {
      ganttRef.current = new Gantt(containerRef.current, formattedTasks, {
        bar_height: resolvedBarHeight,
        padding: resolvedPadding,
        column_width: columnWidth,
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        language: 'pt-br',
        infinite_padding: false,
        scroll_to: 'start',
        lines: 'both',
        on_click: (task: any) => onTaskClick?.(task),
        on_date_change: (task: any, start: Date, end: Date) => onDateChange?.(task, start, end),
        on_progress_change: (task: any, progress: number) => onProgressChange?.(task, progress),
        custom_popup_html: (task: any) => `
          <div class="gantt-popup bg-white shadow-lg rounded-lg p-3 border">
            <h5 class="font-semibold text-gray-900">${escapeHtml(task.name)}</h5>
            <div class="text-xs text-gray-700 mt-2 space-y-1">
              <p><strong>EAP:</strong> ${escapeHtml(task.wbs || '-')}</p>
              <p><strong>Responsável:</strong> ${escapeHtml(task.responsible || '-')}</p>
              <p><strong>Status:</strong> ${escapeHtml(task.statusLabel || '-')}</p>
              <p><strong>Período:</strong> ${formatDateBR(new Date(task._start))} - ${formatDateBR(new Date(task._end))}</p>
              <p><strong>Duração:</strong> ${getDurationDays(new Date(task._start), new Date(task._end))} dia(s)</p>
              <p><strong>Progresso:</strong> ${Math.round(Number(task.progress || 0))}%</p>
              <p><strong>Dependências:</strong> ${escapeHtml(task.dependencies || '-')}</p>
            </div>
            <p class="text-[11px] text-gray-500 mt-2">Arraste a barra para alterar datas</p>
          </div>
        `,
      })
    } catch (error) {
      console.error('Erro ao criar Gantt:', error)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [isClient, formattedTasks, viewMode, resolvedBarHeight, resolvedPadding, columnWidth, onTaskClick, onDateChange, onProgressChange])

  useEffect(() => {
    if (ganttRef.current && viewMode) {
      try {
        ganttRef.current.change_view_mode(viewMode)
      } catch (error) {
        console.error('Erro ao mudar view mode:', error)
      }
    }
  }, [viewMode])

  useEffect(() => {
    if (!scrollRef.current || typeof syncedScrollTop !== 'number') return
    const currentTop = scrollRef.current.scrollTop
    if (Math.abs(currentTop - syncedScrollTop) <= 1) return
    scrollRef.current.scrollTop = syncedScrollTop
  }, [syncedScrollTop])

  const startDragToScroll = (event: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return

    const target = event.target as HTMLElement
    const isGanttInteractiveTarget = Boolean(
      target.closest('.bar-wrapper') ||
      target.closest('.handle') ||
      target.closest('.popup-wrapper') ||
      target.closest('.arrow')
    )

    // Mantém o clique esquerdo livre para drag/resize das barras do Gantt.
    // Pan da área: botão do meio, ou Shift + clique esquerdo.
    const isPanGesture = event.button === 1 || (event.button === 0 && event.shiftKey)
    if (!isPanGesture || isGanttInteractiveTarget) return

    dragState.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    }

    event.currentTarget.style.cursor = 'grabbing'
    event.preventDefault()
  }

  const moveDragToScroll = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.active || !scrollRef.current) return

    const dx = event.clientX - dragState.current.startX
    const dy = event.clientY - dragState.current.startY

    scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx
    scrollRef.current.scrollTop = dragState.current.scrollTop - dy
  }

  const endDragToScroll = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return
    dragState.current.active = false
    event.currentTarget.style.cursor = 'grab'
  }

  if (!isClient) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Carregando gráfico...</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma tarefa para exibir no Gantt.</p>
          <p className="text-sm text-gray-400 mt-1">Importe ou crie tarefas no cronograma.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${template.shellClassName} ${theme === 'dark' ? 'gantt-theme-dark bg-[#0f1115]' : 'bg-white'}`}>
      <div
        ref={scrollRef}
        className="gantt-container h-full overflow-auto cursor-grab"
        onScroll={(event) => onScrollTopChange?.(event.currentTarget.scrollTop)}
        onMouseDown={startDragToScroll}
        onMouseMove={moveDragToScroll}
        onMouseUp={endDragToScroll}
        onMouseLeave={endDragToScroll}
        onMouseOut={endDragToScroll}
      >
        <div ref={containerRef} className="min-h-[520px] min-w-full" />
      </div>

      {/* <style jsx global>{`
        .gantt-shell .gantt-container {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #e2e8f0;
        }

        .gantt-shell svg.gantt {
          background: #ffffff;
          border-radius: 0;
        }

        .gantt-shell .gantt .grid-header,
        .gantt-shell .gantt .grid-background {
          fill: none;
        }

        .gantt-shell .gantt .grid-row {
          fill: #ffffff;
        }

        .gantt-shell .gantt .grid-row:nth-child(even) {
          fill: #f8fafc;
        }

        .gantt-shell .gantt .row-line,
        .gantt-shell .gantt .tick {
          stroke: #e2e8f0;
        }

        .gantt-shell .gantt .today-highlight {
          fill: #fef3c7;
          opacity: 0.55;
        }

        .gantt-shell .gantt .bar-wrapper {
          cursor: pointer;
        }

        .gantt-shell .gantt .bar {
          fill: #2563eb;
          stroke: #1d4ed8;
          stroke-width: 0.8;
          filter: drop-shadow(0 1px 1px rgba(37, 99, 235, 0.22));
        }

        .gantt-shell .gantt .bar-progress {
          fill: #1e40af;
        }

        .gantt-shell .gantt .bar-label {
              fill: #090909;
              font-size: 12px;
              stroke: none;
              font-weight: 600;
        }

        .gantt-shell .gantt .arrow {
          stroke: #64748b;
          stroke-width: 1.6;
        }

        .gantt-popup {
          min-width: 220px;
          border-radius: 12px;
        }
      `}</style> */}
    </div>
  )
}
