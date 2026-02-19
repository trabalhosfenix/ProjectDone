import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ResourceAllocationTable } from '@/components/project/resource-allocation-table'
import { getProjectMembers } from '@/app/actions/project-members'
import { prisma } from '@/lib/prisma'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function AlocacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Buscar membros do projeto (para mapear Função)
  const { data: members } = await getProjectMembers(id)
  
  // Buscar itens do cronograma (atividades com responsável)
  const items = await prisma.projectItem.findMany({
    where: { 
      projectId: id,
      responsible: { not: null }
    },
    orderBy: { datePlanned: 'asc' }
  })

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-7xl">
        <ProjectPageHeader 
          title="Alocação de Recursos" 
          description="Visualize os recursos alocados às atividades do cronograma."
          projectId={id}
        />

        <ResourceAllocationTable items={items} members={members || []} />
      </div>
    </div>
  )
}

