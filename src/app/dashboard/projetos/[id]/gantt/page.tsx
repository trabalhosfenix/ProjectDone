'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GanttSplitView, GanttSplitTask } from '@/components/project/gantt-split-view'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Calendar, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectPageHeader } from "@/components/project/project-page-header"
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProjectMppContext } from '@/components/project/project-mpp-context'

interface RawGanttTask {
  id?: string
  uid?: string | number
  task?: string
  name?: string
  wbs?: string
  start?: string | null
  finish?: string | null
  end?: string | null
  datePlanned?: string | null
  datePlannedEnd?: string | null
  percent_complete?: number
  metadata?: { progress?: number }
  dependencies?: unknown
  responsible?: string
  status?: string
  outline_level?: number
  is_summary?: boolean
}

const toIsoDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

const normalizeDependencies = (value: unknown) => {
  if (!value) return ''
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    const depIds = value
      .map((dep) => {
        if (typeof dep === 'string' || typeof dep === 'number') return String(dep)
        if (dep && typeof dep === 'object') {
          const maybe = dep as Record<string, unknown>
          return String(maybe.id || maybe.predecessor_id || maybe.predecessorId || '').trim()
        }
        return ''
      })
      .filter(Boolean)

    return depIds.join(',')
  }

  return ''
}

export default function GanttPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const searchParamsKey = searchParams.toString()
  
  const [tasks, setTasks] = useState<GanttSplitTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [hideSummary, setHideSummary] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [projectId, searchParamsKey])
  

  const loadTasks = async () => {
    try {
      const mppProjectIdFromQuery = searchParams.get('mppProjectId')
      const contextMppProjectId = await (async () => {
        try {
          const contextResponse = await fetch(`/api/mpp/project-context/${projectId}`, { cache: 'no-store' })
          if (!contextResponse.ok) return undefined
          const context = await contextResponse.json()
          const mppId = context?.mppProjectId ? String(context.mppProjectId) : undefined
          return mppId
        } catch {
          return undefined
        }
      })()

      const mappedMppProjectId = (() => {
        try {
          const map = JSON.parse(sessionStorage.getItem('mppProjectMap') || '{}')
          return map?.[projectId] as string | undefined
        } catch {
          return undefined
        }
      })()

      const candidateProjectIds = Array.from(
        new Set([
          mppProjectIdFromQuery,
          contextMppProjectId,
          mappedMppProjectId,
          projectId,
        ].filter(Boolean) as string[])
      )

      let data: any = null
      let lastError: Error | null = null

      for (const candidateId of candidateProjectIds) {
        try {
          const res = await fetch(`/api/mpp/projects/${candidateId}/gantt`, { cache: 'no-store' })
          if (!res.ok) {
            const body = await res.text()
            throw new Error(`HTTP ${res.status} - ${body}`)
          }
          data = await res.json()
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
        }
      }

      if (!data) {
        throw lastError || new Error('Não foi possível buscar dados de Gantt')
      }

      const sourceTasks: RawGanttTask[] = data?.data || data?.items || data?.tasks || []

      const normalized = sourceTasks.map((item, index) => {
        const start = toIsoDate(item.datePlanned || item.start)
        const end = toIsoDate(item.datePlannedEnd || item.finish || item.end)
        const progress = item.metadata?.progress ?? item.percent_complete ?? 0

        return {
          id: String(item.id || item.uid || `task-${index}`),
          name: item.task || item.name || 'Sem nome',
          wbs: item.wbs,
          start,
          end,
          progress: typeof progress === 'number' ? (progress > 1 ? progress : progress * 100) : 0,
          dependencies: normalizeDependencies(item.dependencies),
          responsible: item.responsible,
          statusLabel: item.status,
          outline_level: item.outline_level,
          is_summary: item.is_summary,
        }
      })

      const datedTasks = normalized.filter((item) => item.start && item.end)
      const datedStarts = datedTasks.map((task) => new Date(task.start as string).getTime())
      const datedEnds = datedTasks.map((task) => new Date(task.end as string).getTime())

      const fallbackStart =
        datedStarts.length > 0 ? new Date(Math.min(...datedStarts)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      const fallbackEnd =
        datedEnds.length > 0 ? new Date(Math.max(...datedEnds)).toISOString().slice(0, 10) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const ganttTasks = normalized
        .map((item, index) => {
          const syntheticStart = new Date(new Date(fallbackStart).getTime() + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          const syntheticEnd = new Date(new Date(syntheticStart).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

          const start = item.start || item.end || syntheticStart
          const end = item.end || item.start || syntheticEnd

          if (!start || !end) {
            return null
          }

          return {
            id: item.id,
            name: item.name,
            start,
            end,
            progress: Math.max(0, Math.min(100, item.progress)),
            dependencies: item.dependencies,
            wbs: item.wbs,
            responsible: item.responsible,
            statusLabel: item.statusLabel,
          }
        })
        .filter((item): item is GanttSplitTask => Boolean(item))

      setTasks(ganttTasks)
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

  const handleTaskClick = (task: any) => {
    toast.info(`Tarefa: ${task.name}`)
  }

  const handleDateChange = async (task: any, start: Date, end: Date) => {
    try {
      await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datePlanned: start.toISOString(),
          datePlannedEnd: end.toISOString()
        })
      })
      toast.success('Datas atualizadas!')
    } catch (e) {
      toast.error('Erro ao atualizar datas')
    }
  }

  const handleProgressChange = async (task: any, progress: number) => {
    try {
      await fetch(`/api/projects/${projectId}/items/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
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
          <div className="flex items-center gap-4">
            <ProjectMppContext projectId={projectId} compact onSynced={loadTasks} />
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-[150px]">
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
          </div>
        </ProjectPageHeader>

        <Card className="shadow-sm border-0 ring-1 ring-gray-200/80">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Cronograma Visual
                <Badge variant="secondary">{filteredTasks.length} tarefas</Badge>
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
                tasks={filteredTasks}
                viewMode={viewMode}
                onTaskClick={handleTaskClick}
                onDateChange={handleDateChange}
                onProgressChange={handleProgressChange}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <input id="hide-summary" type="checkbox" checked={hideSummary} onChange={(e) => setHideSummary(e.target.checked)} />
          <label htmlFor="hide-summary">Ocultar tarefas de resumo para focar nas entregas executáveis</label>
        </div>
      </div>
    </div>
  )
}
