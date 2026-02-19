'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GanttSplitView, GanttSplitTask } from '@/components/project/gantt-split-view'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { BarChart3, Calendar, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
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
  
  // ... (keeping loadTasks and handlers as is, they are below this block usually but I need to be careful not to replace them if they are in the range)
  // Logic skipped for brevity in replacement, but I must match exact content if I replace.
  // Actually, I can just fix the import at the top and the header usage in the return.
  // Let's do 2 chunks if possible or 1 big chunk if files interact.
  // `replace_file_content` supports single chunk.
  
  // I will fix the IMPORT first (top of file).
  // Then fix the RETURN (bottom).
  // Wait, I can't do multiple chunks with `replace_file_content` unless I use `multi_replace`.
  // I will use `replace_file_content` to fix the Import first.
  // Then another call/chunk for the JSX.
  // Actually, `replace_file_content` only allows one block.
  // I will use `multi_replace_file_content`? No, simpler to just run 2 tools or 1 wide tool?
  // Let's use `multi_replace_file_content` since I made a mess in 2 places (top and bottom)? 
  // No, previous edit inserted import in the middle of the file (line 90ish).
  // So I need to delete that bad import AND add it to top AND fix the JSX.
  // This is complex for a single replace.
  
  // Strategy:
  // 1. MultiReplace to:
  //    a) Add import at top.
  //    b) Remove bad import at line 90.
  //    c) Fix JSX at line 97.
  
  // Let's try `multi_replace_file_content`.

  const loadTasks = async () => {
    try {
      // Buscar tarefas do projeto
      const res = await fetch(`/api/projects/${projectId}/items`)
      const data = await res.json()
      
      if (data.success && data.data) {
        // Converter para formato do Gantt Split
        const ganttTasks = data.data
          .filter((item: any) => item.datePlanned && item.datePlannedEnd)
          .map((item: any) => ({
            id: item.id,
            name: item.task || 'Sem nome',
            start: new Date(item.datePlanned).toISOString().split('T')[0],
            end: new Date(item.datePlannedEnd).toISOString().split('T')[0],
            progress: item.metadata?.progress || 0,
            dependencies: '',
            wbs: item.wbs,
            responsible: item.responsible,
            statusLabel: item.status
          }))
        
        setTasks(ganttTasks)
      }
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
