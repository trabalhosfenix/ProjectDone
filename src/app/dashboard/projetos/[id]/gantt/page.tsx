'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GanttSplitView, GanttSplitTask } from '@/components/project/gantt-split-view'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Calendar, Filter, Search, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectPageHeader } from "@/components/project/project-page-header"
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProjectMppContext } from '@/components/project/project-mpp-context'
import { Button } from '@/components/ui/button'
import { TaskEntitySheet } from '@/components/project/task-entity-sheet'
import { Checkbox } from '@/components/ui/checkbox'

export default function GanttPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [tasks, setTasks] = useState<GanttSplitTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week')
  const [ganttTheme, setGanttTheme] = useState<'light' | 'dark'>('light')
  const [templateMode, setTemplateMode] = useState<'default' | 'executive' | 'planning'>('default')
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [hideSummary, setHideSummary] = useState(false)
  const [pageSize, setPageSize] = useState<'50' | '100' | '200' | 'all'>('100')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [projectId])
  

  const loadTasks = async () => {
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
  }

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
      if (hideSummary && (task.wbs === '0' || task.name.toLowerCase().includes('cronograma'))) {
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

      await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datePlanned: parsedStart.toISOString(),
          datePlannedEnd: parsedEnd.toISOString()
        })
      })
      toast.success('Datas atualizadas!')
    } catch (e) {
      toast.error('Erro ao atualizar datas')
    }
  }

  const handleProgressChange = async (task: any, progress: number) => {
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

      await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: { progress: progress / 100 },
          status: progress >= 100 ? 'Concluído' : undefined,
        })
      })
      toast.success('Progresso atualizado!')
    } catch (e) {
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
          <div className="flex flex-wrap items-center gap-2">
            <ProjectMppContext projectId={projectId} compact onSynced={loadTasks} />
            <div className="flex items-center gap-2 rounded-lg border bg-white p-1">
              <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <SelectTrigger className="w-[150px] border-0 shadow-none">
                  <Calendar className="w-4 h-4 mr-2" />
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
                <SelectTrigger className="w-[150px] border-0 shadow-none">
                  <Palette className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Tema Claro</SelectItem>
                  <SelectItem value="dark">Tema Escuro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={templateMode} onValueChange={(v: 'default' | 'executive' | 'planning') => setTemplateMode(v)}>
                <SelectTrigger className="w-[150px] border-0 shadow-none">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Template padrão</SelectItem>
                  <SelectItem value="executive">Template executivo</SelectItem>
                  <SelectItem value="planning">Template planejamento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={density} onValueChange={(v: 'compact' | 'comfortable') => setDensity(v)}>
                <SelectTrigger className="w-[130px] border-0 shadow-none">
                  <SelectValue placeholder="Densidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="comfortable">Confortável</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setSelectedTask(null); setIsTaskSheetOpen(true) }}>Nova tarefa</Button>
            </div>
          </div>
        </ProjectPageHeader>

        <Card className="shadow-sm border-0 ring-1 ring-gray-200/80">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Cronograma Visual
                <Badge variant="secondary">{visibleTasks.length} de {filteredTasks.length} tarefas</Badge>
              </CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full lg:w-auto">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou EAP"
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos responsáveis</SelectItem>
                    {responsibleOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={pageSize}
                  onValueChange={(value: '50' | '100' | '200' | 'all') => {
                    setPageSize(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Linhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 por página</SelectItem>
                    <SelectItem value="100">100 por página</SelectItem>
                    <SelectItem value="200">200 por página</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
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
                templateMode={templateMode}
                density={density}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <Checkbox id="hide-summary" checked={hideSummary} onCheckedChange={(value) => setHideSummary(Boolean(value))} />
          <label htmlFor="hide-summary">Ocultar tarefas de resumo para focar nas entregas executáveis</label>
        </div>
        {pageSize !== 'all' && filteredTasks.length > 0 && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
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
      />
    </div>
  )
}
