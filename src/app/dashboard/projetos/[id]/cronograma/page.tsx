import { getProjectDetails } from '@/app/actions/project-details'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectTable } from '@/components/project/project-table'
import { ResourceAllocationTable } from '@/components/project/resource-allocation-table'
import { prisma } from '@/lib/prisma'
import { getMppTasks } from '@/lib/mpp-api'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileSpreadsheet, Users } from 'lucide-react'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function CronogramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const items = await getMppTasks(id)

  // Buscar membros para cruzar informações de cargo/função
  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: true }
  })
  
  const project = (await getProjectDetails(id)).data

  if (!project) notFound()



// ...

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 p-6">
        <ProjectPageHeader 
             title="Cronograma"
             description="Visualização detalhada das tarefas e alocação"
             projectId={id}
        >
           <div className="text-sm text-gray-500">
            {items.length} tarefas listadas
           </div>
        </ProjectPageHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-200 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cronograma Vazio</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Este projeto ainda não possui tarefas cadastradas. Importe uma planilha ou use o MS Project para começar.
            </p>
            <div className="flex gap-3">
              <Link href={`/dashboard/projetos/${id}/importar?type=excel`}>
                <Button>Importar Excel</Button>
              </Link>
              <Link href={`/dashboard/projetos/${id}/importar?type=msproject`}>
                <Button variant="outline">Importar XML</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Lista de Tarefas
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Alocação de Recursos
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
                <ProjectTable items={items} members={members} />
            </TabsContent>
            
            <TabsContent value="resources">
                <ResourceAllocationTable items={items} members={members} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
