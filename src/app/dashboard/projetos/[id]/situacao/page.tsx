import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import { getProjectSituationStats } from '@/app/actions/project-details'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Users, AlertTriangle } from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

export default async function SituacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProjectSituationStats(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const project = result.data
  const progress = project.calculatedProgress ?? (project.progress || 0)

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'concluido':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'andamento':
      case 'em andamento':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'parado':
      case 'atrasado':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const getProgressColor = (value: number) => {
    if (value >= 100) return 'bg-green-600'
    if (value >= 75) return 'bg-blue-600'
    if (value >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return 'Não definida'
    return dateFormatter.format(new Date(value))
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
          <ProjectPageHeader
            title="Situação do Projeto"
            description="Visão consolidada do estado atual."
            projectId={id}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <p className="text-gray-500 text-sm break-all mr-4">{project.description || 'Sem descrição'}</p>
              </div>
              <Badge className={getStatusBadgeClass(project.status || 'Não iniciado')}>
                {project.status || 'Não iniciado'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Realizado (Calculado)</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" indicatorClassName={getProgressColor(progress)} />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tarefas concluídas</span>
                  <span>{project.completedTasks || 0}/{project.totalTasks || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
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
                    <p className="text-xs text-gray-500 mt-1">Riscos: {project.risksCount || 0} • Questões: {project.issuesCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                <div>
                  <p className="text-sm text-gray-500">Início Real</p>
                  <p className="font-medium">{formatDate(project.realStartDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fim Real</p>
                  <p className="font-medium">{formatDate(project.realEndDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
