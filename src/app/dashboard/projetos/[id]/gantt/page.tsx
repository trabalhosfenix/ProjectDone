'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GanttSplitView, GanttSplitTask } from '@/components/project/gantt-split-view'
import {
  FRAPPE_DENSITY_OPTIONS,
  type FrappeTemplateDensity,
  type FrappeViewMode,
} from '@/components/project/frappe-gantt-template'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Calendar, Filter, Search, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectPageHeader } from "@/components/project/project-page-header"
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskEntitySheet } from '@/components/project/task-entity-sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { MppSyncButton } from '@/components/project/mpp-sync-button'

export default function GanttPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [tasks, setTasks] = useState<GanttSplitTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<FrappeViewMode>('Week')
  const [ganttTheme, setGanttTheme] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<FrappeTemplateDensity>('comfortable')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [hideSummary, setHideSummary] = useState(false)
  const [pageSize, setPageSize] = useState<'50' | '100' | '200' | 'all'>('100')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/gantt`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status} - ${body}`)
      }
      const data = await res.json()
      const payload = Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data?.data) ? data.data : []
      setTasks(payload as GanttSplitTask[])
    } catch (e) {
      console.error('Erro ao carregar tarefas:', e)
      toast.error('Erro ao carregar cronograma')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const statusOf = (task: GanttSplitTask) => {
    if (task.progress >= 100) return 'completed'
    const now = new Date()
    const end = new Date(task.end)
    const start = new Date(task.start)
    if (end < now) return 'late'
    if (start <= now && end >= now) return 'in_progress'
    return 'not_started'
  }

  const responsibleOptions = useMemo(() => {
    const values = Array.from(new Set(tasks.map((task) => task.responsible).filter(Boolean) as string[]))
    return values.sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (hideSummary && task.is_summary) {
        return false
      }

      if (search && !task.name.toLowerCase().includes(search.toLowerCase()) && !(task.wbs || '').toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      if (responsibleFilter !== 'all' && (task.responsible || '') !== responsibleFilter) {
        return false
      }

      if (statusFilter !== 'all' && statusOf(task) !== statusFilter) {
        return false
      }

      return true
    })
  }, [tasks, hideSummary, search, responsibleFilter, statusFilter])

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1
    const size = Number(pageSize)
    if (!Number.isFinite(size) || size <= 0) return 1
    return Math.max(1, Math.ceil(filteredTasks.length / size))
  }, [filteredTasks.length, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const visibleTasks = useMemo(() => {
    if (pageSize === 'all') return filteredTasks
    const size = Number(pageSize)
    if (!Number.isFinite(size) || size <= 0) return filteredTasks
    const start = (currentPage - 1) * size
    return filteredTasks.slice(start, start + size)
  }, [filteredTasks, pageSize, currentPage])

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskSheetOpen(true)
  }

  const parseGanttDate = (value: unknown) => {
    if (value instanceof Date) return value
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    return null
  }

  const handleDateChange = async (task: any, start: unknown, end: unknown) => {
    const previousTask = tasks.find((currentTask) => String(currentTask.id) === String(task.id))

    try {
      const parsedStart = parseGanttDate(start)
      const parsedEnd = parseGanttDate(end)
      if (!parsedStart || !parsedEnd) {
        throw new Error('Datas inválidas recebidas do gráfico')
      }

      setTasks((prev) =>
        prev.map((currentTask) =>
          String(currentTask.id) === String(task.id)
            ? {
                ...currentTask,
                start: parsedStart.toISOString(),
                end: parsedEnd.toISOString(),
              }
            : currentTask
        )
      )

      const res = await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datePlanned: parsedStart.toISOString(),
          datePlannedEnd: parsedEnd.toISOString()
        })
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status} - ${body}`)
      }

      toast.success('Datas atualizadas!')
    } catch (e) {
      if (previousTask) {
        setTasks((prev) =>
          prev.map((currentTask) =>
            String(currentTask.id) === String(previousTask.id) ? previousTask : currentTask
          )
        )
      }
      toast.error('Erro ao atualizar datas')
    }
  }

  const handleProgressChange = async (task: any, progress: number) => {
    const previousTask = tasks.find((currentTask) => String(currentTask.id) === String(task.id))

    try {
      setTasks((prev) =>
        prev.map((currentTask) =>
          String(currentTask.id) === String(task.id)
            ? {
                ...currentTask,
                progress: Math.max(0, Math.min(100, Math.round(progress))),
              }
            : currentTask
        )
      )

      const res = await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: { progress: progress / 100 },
          status: progress >= 100 ? 'Concluído' : undefined,
        })
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status} - ${body}`)
      }

      toast.success('Progresso atualizado!')
    } catch (e) {
      if (previousTask) {
        setTasks((prev) =>
          prev.map((currentTask) =>
            String(currentTask.id) === String(previousTask.id) ? previousTask : currentTask
          )
        )
      }
      toast.error('Erro ao atualizar progresso')
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 container mx-auto p-6">
        <ProjectPageHeader 
             title="Gráfico de Gantt"
             description="Visualização visual do cronograma do projeto."
             projectId={projectId}
        >
          <MppSyncButton localProjectId={projectId} onSynced={loadTasks} label="Sincronizar" />
        </ProjectPageHeader>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Visualizacao
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Select value={viewMode} onValueChange={(v: FrappeViewMode) => setViewMode(v)}>
                <SelectTrigger size="sm" className="w-full min-w-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Dia</SelectItem>
                  <SelectItem value="Week">Semana</SelectItem>
                  <SelectItem value="Month">Mês</SelectItem>
                  <SelectItem value="Year">Ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ganttTheme} onValueChange={(v: 'light' | 'dark') => setGanttTheme(v)}>
                <SelectTrigger size="sm" className="w-full min-w-0">
                  <Palette className="w-3.5 h-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Tema Claro</SelectItem>
                  <SelectItem value="dark">Tema Escuro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={density} onValueChange={(v: FrappeTemplateDensity) => setDensity(v)}>
                <SelectTrigger size="sm" className="w-full min-w-0">
                  <SelectValue placeholder="Densidade" />
                </SelectTrigger>
                <SelectContent>
                  {FRAPPE_DENSITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedTask(null)
                  setIsTaskSheetOpen(true)
                }}
              >
                Nova tarefa
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative sm:col-span-2 xl:col-span-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou EAP"
                  className="h-8 pl-8 text-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="w-full min-w-0">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="not_started">Não iniciado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="late">Atrasado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger size="sm" className="w-full min-w-0">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos responsáveis</SelectItem>
                  {responsibleOptions.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card className="shadow-sm border-0 ring-1 ring-gray-200/80">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Cronograma Visual
                <Badge variant="secondary">{visibleTasks.length} de {filteredTasks.length} tarefas</Badge>
              </CardTitle>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr 1fr 1fr] xl:grid-cols-[1fr 1fr 1fr]">
                <Select
                  value={pageSize}
                  onValueChange={(value: '50' | '100' | '200' | 'all') => {
                    setPageSize(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="w-full min-w-0">
                    <SelectValue placeholder="Linhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 por página</SelectItem>
                    <SelectItem value="100">100 por página</SelectItem>
                    <SelectItem value="200">200 por página</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex h-8 items-center rounded-md border border-gray-200 px-3 text-xs text-gray-600">
                  <Checkbox id="hide-summary" checked={hideSummary} onCheckedChange={(value) => setHideSummary(Boolean(value))} />
                  <label htmlFor="hide-summary" className="ml-2 cursor-pointer whitespace-nowrap">
                    Ocultar resumo
                  </label>
                </div>

                {pageSize !== 'all' && filteredTasks.length > 0 && (
                  <div className="flex h-8 items-center justify-between rounded-md border border-gray-200 px-2.5 text-xs text-gray-500">
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Carregando...</p>
              </div>
            ) : (
              <GanttSplitView
                tasks={visibleTasks}
                viewMode={viewMode}
                theme={ganttTheme}
                onTaskEdit={handleTaskClick}
                onDateChange={handleDateChange}
                onProgressChange={handleProgressChange}
                density={density}
              />
            )}
          </CardContent>
        </Card>
        {pageSize !== 'all' && filteredTasks.length > visibleTasks.length && (
          <div className="mt-2 text-xs text-amber-700">
            Exibindo apenas {visibleTasks.length} tarefas. Ajuste o filtro de linhas para ver todas.
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          Dica: use botão do meio do mouse ou Shift + arraste para mover a área horizontalmente.
        </div>
      </div>

      <TaskEntitySheet
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        projectId={projectId}
        task={selectedTask}
        responsibleOptions={responsibleOptions}
        onSaved={loadTasks}
      />
    </div>
  )
}
