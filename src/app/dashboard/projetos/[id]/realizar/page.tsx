'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, CheckCircle2, Clock, User } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProjectPageHeader } from '@/components/project/project-page-header'

// Este é um componente cliente, então precisamos buscar dados via fetch
export default function RealizarPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/items`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.data || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const markComplete = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/items/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'Concluído' : 'A Fazer',
          metadata: { progress: completed ? 1 : 0 }
        })
      })
      
      if (res.ok) {
        toast.success(completed ? 'Tarefa concluída!' : 'Tarefa reaberta')
        loadTasks()
      }
    } catch (e) {
      toast.error('Erro ao atualizar')
    }
  }

  const filteredTasks = tasks.filter(t => {
    const progress = (t.metadata as any)?.progress || 0
    const isComplete = progress >= 1 || t.status === 'Concluído'
    
    if (filter === 'pending') return !isComplete
    if (filter === 'done') return isComplete
    return true
  })

  const completedCount = tasks.filter(t => {
    const progress = (t.metadata as any)?.progress || 0
    return progress >= 1 || t.status === 'Concluído'
  }).length

  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader 
             title="Realizar Atividades"
             description="Marque as atividades conforme forem sendo executadas."
             projectId={projectId}
        />

        {/* Progresso Geral */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Progresso Geral</span>
              <span className="font-bold">{completedCount} / {tasks.length} tarefas</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-center mt-2 text-2xl font-bold text-blue-600">{progressPercent}%</p>
          </CardContent>
        </Card>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes ({tasks.length - completedCount})
          </Button>
          <Button 
            variant={filter === 'done' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('done')}
          >
            Concluídas ({completedCount})
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({tasks.length})
          </Button>
        </div>

        {/* Lista de Tarefas */}
        <Card>
          <CardContent className="pt-4">
            {loading ? (
              <p className="text-center py-8 text-gray-500">Carregando...</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhuma tarefa encontrada.</p>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const progress = (task.metadata as any)?.progress || 0
                  const isComplete = progress >= 1 || task.status === 'Concluído'
                  
                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                        ${isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      <Checkbox 
                        checked={isComplete}
                        onCheckedChange={(checked) => markComplete(task.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${isComplete ? 'line-through text-gray-500' : ''}`}>
                          {task.task}
                        </p>
                        {task.responsible && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 font-medium">
                            <User className="w-3 h-3" /> {task.responsible}
                          </p>
                        )}
                      </div>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
