import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { TestScenariosList } from '@/components/tests/test-scenarios-list'
import { getTestScenarios } from '@/app/actions/project-tests'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TestCenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: scenarios } = await getTestScenarios(id)

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
       <ProjectDetailTabs projectId={id} />
       <ProjectHorizontalMenu projectId={id} />
       
       <div className="flex-1 container mx-auto p-6 max-w-6xl">
           <ProjectPageHeader 
              title="Testes Consolidados"
              description="Gestão dos cenários de testes integrados e acompanhamento."
              projectId={id}
           />

           {/* Sub-menu Navigation simulating Tabs */}
           <div className="mb-6">
               <Tabs defaultValue="cenarios">
                  <TabsList>
                     <Link href={`/dashboard/projetos/${id}/testes/cenarios`}>
                        <TabsTrigger value="cenarios">Cenários de Testes</TabsTrigger>
                     </Link>
                     <Link href={`/dashboard/projetos/${id}/testes/status`}>
                        <TabsTrigger value="status">Status</TabsTrigger>
                     </Link>
                  </TabsList>
               </Tabs>
           </div>

           <TestScenariosList projectId={id} scenarios={scenarios || []} />
       </div>
    </div>
  )
}

