import { notFound } from 'next/navigation'
import { getProjectDetails } from '@/app/actions/project-details'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectRecords } from '@/components/project/project-records'
import { ProjectPageHeader } from '@/components/project/project-page-header'

interface RecordsPageProps {
  params: {
    id: string
  }
}

export default async function RecordsPage({ params }: RecordsPageProps) {
  const { id } = await params
  
  const result = await getProjectDetails(id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const project = result.data

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Abas de Navegação */}
      <ProjectDetailTabs projectId={id} />
      
      {/* Menu Horizontal */}
      <ProjectHorizontalMenu projectId={id} />
      
      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto bg-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <ProjectPageHeader 
             title="Registros do Projeto"
             description="Histórico completo de apontamentos e observações."
             projectId={id}
          />

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <ProjectRecords 
              projectId={id}
              initialRecords={project.records || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
