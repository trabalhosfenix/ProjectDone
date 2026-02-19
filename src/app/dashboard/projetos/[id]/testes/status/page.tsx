import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { TestDashboard } from '@/components/tests/test-dashboard'
import { getTestDashboardStats } from '@/app/actions/project-tests'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TestStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: stats } = await getTestDashboardStats(id)

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
       <ProjectDetailTabs projectId={id} />
       <ProjectHorizontalMenu projectId={id} />
       
       <div className="flex-1 container mx-auto p-6 max-w-6xl">
           <div className="mb-6 flex justify-between items-end">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">Testes Consolidados</h1>
                  <p className="text-gray-500">Dashboard e indicadores de status.</p>
              </div>
           </div>

           {/* Sub-menu Navigation simulating Tabs */}
           <div className="mb-6">
               <Tabs defaultValue="status">
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
           
           {stats ? (
               <TestDashboard stats={stats} />
           ) : (
               <div className="text-center py-10">Erro ao carregar dados.</div>
           )}
       </div>
    </div>
  )
}
