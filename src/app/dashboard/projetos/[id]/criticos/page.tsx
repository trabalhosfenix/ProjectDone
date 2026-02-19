import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function CriticosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Buscar tarefas ordenadas por data de término
  const items = await prisma.projectItem.findMany({
    where: { projectId: id },
    orderBy: { dateActual: 'asc' }
  })

  // Identificar tarefas no caminho crítico (sem folga, dependentes sequenciais)
  // Simplificado: tarefas com prazo mais próximo e não concluídas
  const now = new Date()
  
  const criticalTasks = items

    .filter(item => {
      const progress = (item.metadata as any)?.progress || 0
      return progress < 1
    })
    .map(item => {
      const endDate = item.dateActual || item.datePlanned
      const daysRemaining = endDate 
        ? Math.ceil((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      
      return {
        ...item,
        daysRemaining,
        isCritical: daysRemaining <= 7,
        isOverdue: daysRemaining < 0
      }
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 20)

  const overdueCount = criticalTasks.filter(t => t.isOverdue).length
  const criticalCount = criticalTasks.filter(t => t.isCritical && !t.isOverdue).length

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-5xl">
        <ProjectPageHeader 
             title="Componentes Críticos"
             description="Tarefas que impactam diretamente o prazo do projeto."
             projectId={id}
        />

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-sm text-red-700">Atrasadas</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{criticalCount}</p>
              <p className="text-sm text-orange-700">Críticas (≤7 dias)</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{criticalTasks.length}</p>
              <p className="text-sm text-blue-700">Total Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tarefas Críticas */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas por Urgência</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalTasks.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhuma tarefa pendente.</p>
            ) : (
              <div className="space-y-2">
                {criticalTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border
                      ${task.isOverdue ? 'bg-red-50 border-red-200' : 
                        task.isCritical ? 'bg-orange-50 border-orange-200' : 
                        'bg-white border-gray-200'}`}
                  >
                    <div className={`p-2 rounded-full 
                      ${task.isOverdue ? 'bg-red-100' : task.isCritical ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <Clock className={`w-4 h-4 
                        ${task.isOverdue ? 'text-red-600' : task.isCritical ? 'text-orange-600' : 'text-gray-600'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{task.task}</p>
                      <p className="text-xs text-gray-500">
                        {task.responsible || 'Sem responsável'}
                      </p>
                    </div>
                    
                    <Badge className={
                      task.isOverdue ? 'bg-red-500' : 
                      task.isCritical ? 'bg-orange-500' : 
                      'bg-blue-500'
                    }>
                      {task.isOverdue 
                        ? `${Math.abs(task.daysRemaining)} dias atrasado`
                        : task.daysRemaining === 0 
                        ? 'Hoje'
                        : `${task.daysRemaining} dias`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href={`/dashboard/projetos/${id}/cronograma`}>
            <button className="text-blue-600 hover:underline flex items-center gap-1 mx-auto">
              Ver cronograma completo <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
