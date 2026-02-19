import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectRisksList } from '@/components/project/project-risks-list'
import { getProjectRisks, getProjectRiskDashboard } from '@/app/actions/project-risks'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function RiscosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ data: risks }, { data: dashboard }] = await Promise.all([
    getProjectRisks(id),
    getProjectRiskDashboard(id),
  ])

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
          title="Gestão de Riscos" 
          description="Identifique, analise e planeje respostas aos riscos do projeto."
          projectId={id}
        />

        <ProjectRisksList projectId={id} risks={risks || []} dashboard={dashboard} />
      </div>
    </div>
  )
}
