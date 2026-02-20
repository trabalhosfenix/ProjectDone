'use client'

import { useEffect, useRef, useState } from 'react'
import Gantt from 'frappe-gantt'

interface GanttTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  onTaskClick?: (task: GanttTask) => void
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void
  onProgressChange?: (task: GanttTask, progress: number) => void
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year'
  barHeight?: number
  padding?: number
}

export function GanttChart({ 
  tasks, 
  onTaskClick, 
  onDateChange,
  onProgressChange,
  viewMode = 'Week',
  barHeight = 20,
  padding = 18
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  const normalizeDependencies = (value: GanttTask['dependencies']) => {
    if (!value) return ''
    return typeof value === 'string' ? value : ''
  }

  const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime())

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current || tasks.length === 0) return

    // Limpar container
    containerRef.current.innerHTML = ''

    // Criar elemento SVG para o Gantt
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'gantt-chart'
    containerRef.current.appendChild(svg)

    // Formatar tarefas para o Frappe Gantt
    const formattedTasks = tasks
      .filter((task) => isValidDate(task.start) && isValidDate(task.end))
      .map(task => ({
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        progress: task.progress || 0,
        dependencies: normalizeDependencies(task.dependencies)
      }))

    if (formattedTasks.length === 0) {
      return
    }

    try {
      ganttRef.current = new Gantt('#gantt-chart', formattedTasks, {
        bar_height: barHeight,
        padding: padding,
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        language: 'pt-br',
        infinite_padding: false,
        on_click: (task: any) => {
          if (onTaskClick) {
            onTaskClick(task)
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          if (onDateChange) {
            onDateChange(task, start, end)
          }
        },
        on_progress_change: (task: any, progress: number) => {
          if (onProgressChange) {
            onProgressChange(task, progress)
          }
        },
        custom_popup_html: (task: any) => {
          return `
            <div class="gantt-popup bg-white shadow-lg rounded-lg p-3 border">
              <h5 class="font-semibold text-gray-900">${task.name}</h5>
              <p class="text-sm text-gray-600 mt-1">
                ${new Date(task._start).toLocaleDateString('pt-BR')} - ${new Date(task._end).toLocaleDateString('pt-BR')}
              </p>
              <p class="text-sm mt-1">
                <span class="font-medium">Progresso:</span> ${task.progress}%
              </p>
            </div>
          `
        }
      })
    } catch (error) {
      console.error('Erro ao criar Gantt:', error)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [isClient, tasks, viewMode, onTaskClick, onDateChange, onProgressChange])

  // Atualizar view mode
  useEffect(() => {
    if (ganttRef.current && viewMode) {
      try {
        ganttRef.current.change_view_mode(viewMode)
      } catch (e) {
        console.error('Erro ao mudar view mode:', e)
      }
    }
  }, [viewMode])

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
    <div className="gantt-container overflow-x-auto bg-white rounded-lg border border-slate-200">
      <div ref={containerRef} className="min-h-[400px]" />
      <style jsx global>{`
        .gantt .bar-wrapper {
          cursor: pointer;
        }
        .gantt .bar {
          fill: #2563eb;
          filter: drop-shadow(0 1px 1px rgba(37,99,235,.25));
        }
        .gantt .bar-progress {
          fill: #1e40af;
        }
        .gantt .bar-label {
          fill: #fff;
          font-weight: 600;
          font-size: 12px;
        }
        .gantt .grid-header {
          fill: #f8fafc;
        }
        .gantt .grid-row {
          fill: #fff;
        }
        .gantt .grid-row:nth-child(even) {
          fill: #f9fafb;
        }
        .gantt .tick {
          stroke: #e2e8f0;
        }
        .gantt .today-highlight {
          fill: #fef9c3;
        }
        .gantt-popup {
          min-width: 220px;
          border-radius: 12px;
        }
      `}</style>
    </div>
  )
}
