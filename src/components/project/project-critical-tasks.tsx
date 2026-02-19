'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { toggleProjectItemCritical } from '@/app/actions/project-items'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProjectCriticalTasksProps {
  items: any[]
  delayedCount: number
  criticalCount: number
}

export function ProjectCriticalTasks({ items, delayedCount, criticalCount }: ProjectCriticalTasksProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleCritical = async (id: string, current: boolean) => {
    setLoadingId(id)
    try {
      const res = await toggleProjectItemCritical(id, !current)
      if (res.success) {
        toast.success(current ? 'Removido de tarefas críticas' : 'Marcado como crítico')
        router.refresh()
      } else {
        toast.error('Erro ao atualizar')
      }
    } catch (error) {
       toast.error('Erro de conexão')
    } finally {
       setLoadingId(null)
    }
  }

  const calculateDelay = (datePlannedEnd: string | Date | null) => {
      if (!datePlannedEnd) return 0
      const end = new Date(datePlannedEnd)
      const now = new Date()
      now.setHours(0,0,0,0)
      end.setHours(0,0,0,0)
      
      if (end >= now) return 0
      return differenceInDays(now, end)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
         <AlertTriangle className="w-5 h-5 text-orange-500" />
         <div>
            <h2 className="text-lg font-bold text-gray-900">Tarefas em Atraso e Críticas</h2>
            <p className="text-sm text-gray-500">Tarefas que impactam diretamente o prazo do projeto.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-red-600">{delayedCount}</span>
            <span className="text-sm font-medium text-red-800">Atrasadas</span>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-orange-600">{criticalCount}</span>
            <span className="text-sm font-medium text-orange-800">Críticas</span>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <span className="text-3xl font-bold text-blue-600">{items.length}</span>
            <span className="text-sm font-medium text-blue-800">Total listado</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarefas por Urgência</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma tarefa crítica ou atrasada encontrada.
                    </div>
                ) : (
                    items.map((item) => {
                        const delay = calculateDelay(item.datePlannedEnd)
                        const isLate = delay > 0 && !['Concluído', 'Completed', 'Done'].includes(item.status)

                        return (
                            <div key={item.id} className={`flex items-center p-4 gap-4 ${isLate ? 'bg-red-50/50' : ''}`}>
                                <div className="flex-shrink-0">
                                   <Clock className={`w-5 h-5 ${isLate ? 'text-red-500' : 'text-gray-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium ${isLate ? 'text-red-900' : 'text-gray-900'}`}>{item.task}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {item.responsible || 'Sem responsável'} 
                                        {item.datePlannedEnd && ` • Previsto: ${format(new Date(item.datePlannedEnd), 'dd/MM/yyyy')}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {isLate && (
                                        <Badge variant="destructive" className="mb-1 pointer-events-none">
                                            {delay} dias atrasado
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pl-4 border-l">
                                    <Checkbox 
                                        id={`crit-${item.id}`} 
                                        checked={item.isCritical}
                                        onCheckedChange={() => handleToggleCritical(item.id, item.isCritical)}
                                        disabled={loadingId === item.id}
                                    />
                                    <label 
                                        htmlFor={`crit-${item.id}`} 
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        Crítica
                                    </label>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
