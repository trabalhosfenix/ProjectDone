import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import { getProjectSituationStats } from '@/app/actions/project-details'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Clock, Users, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SituacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProjectSituationStats(id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const project = result.data
  // Priorizar o calculado se existir
  const progress = project.calculatedProgress ?? (project.progress || 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-500'
      case 'Andamento': return 'bg-blue-500'
      case 'Parado': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Cor da barra de progresso baseada no %
  const getProgressColor = (val: number) => {
      if (val >= 100) return 'bg-green-600'
      if (val > 50) return 'bg-blue-600'
      return 'bg-blue-600'
  }



// ...

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-5xl">
          <ProjectPageHeader 
            title="Situação do Projeto" 
            description="Visão consolidada do estado atual."
            projectId={id}
          />

        {/* Status Principal */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <p className="text-gray-500 text-sm break-all mr-4">{project.description || 'Sem descrição'}</p>
            </div>
            <Badge className={getStatusColor(project.status || 'Não iniciado')}>{project.status || 'Não iniciado'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso Realizado (Calculado)</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" indicatorClassName={getProgressColor(progress)} />
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3 mb-6"> {/* Alterado de 4 para 3 colunas pois removemos Orçamento (ou mantemos 4 e espalhamos?) - Usuário pediu remover orçamento. Vou deixar 3 cols ou ajustar. */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duração Real</p>
                  <p className="text-xl font-bold">{project.realDuration || 0} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Orçamento REMOVIDO */}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Equipe (Alocada)</p>
                  <p className="text-xl font-bold">{project.teamCount || 0} pessoas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Riscos e Questões</p>
                  <p className="text-xl font-bold">{project.risksIssuesCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Gerente */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Gerente</p>
                <p className="font-medium">{project.managerName || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{project.client || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium">{project.area || 'Não definida'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prioridade</p>
                <p className="font-medium">{project.priority || 'Média'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
