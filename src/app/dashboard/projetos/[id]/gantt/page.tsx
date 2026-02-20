'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GanttSplitView, GanttSplitTask } from '@/components/project/gantt-split-view'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectPageHeader } from "@/components/project/project-page-header"

export default function GanttPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [tasks, setTasks] = useState<GanttSplitTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week')

  useEffect(() => {
    loadTasks()
  }, [])
  

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/mpp/projects/${projectId}/gantt`)
      const data = await res.json()

      const sourceTasks = data?.data || data?.items || data?.tasks || []
      const ganttTasks = sourceTasks
        .filter((item: any) => (item.datePlanned || item.start) && (item.datePlannedEnd || item.finish || item.end))
        .map((item: any) => ({
          id: String(item.id || item.uid),
          name: item.task || item.name || 'Sem nome',
          start: new Date(item.datePlanned || item.start).toISOString().split('T')[0],
          end: new Date(item.datePlannedEnd || item.finish || item.end).toISOString().split('T')[0],
          progress: item.metadata?.progress ?? item.percent_complete ?? 0,
          dependencies: item.dependencies || '',
          wbs: item.wbs,
          responsible: item.responsible,
          statusLabel: item.status
        }))

      setTasks(ganttTasks)
    } catch (e) {
      console.error('Erro ao carregar tarefas:', e)
      toast.error('Erro ao carregar cronograma')
    } finally {
      setLoading(false)
    }
  }

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Cronograma Visual
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({tasks.length} tarefas)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Carregando...</p>
              </div>
            ) : (
              <GanttSplitView
                tasks={tasks}
                viewMode={viewMode}
                onTaskClick={handleTaskClick}
                onDateChange={handleDateChange}
                onProgressChange={handleProgressChange}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Dica:</strong> Arraste as barras para alterar datas. Clique em uma tarefa para ver detalhes.</p>
        </div>
      </div>
    </div>
  )
}
