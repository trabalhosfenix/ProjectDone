import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { getProjectGoalTypes } from '@/app/actions/project-goal-types'
import { GoalTypesConfig } from '@/components/project/goal-types-config'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function GoalTypesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { success, data } = await getProjectGoalTypes(id)
  const types = success ? data : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
         <div className="mb-6 flex items-center gap-4">
             <Button variant="outline" size="icon" asChild>
                 <Link href={`/dashboard/projetos/${id}/metas`}>
                    <ArrowLeft className="w-4 h-4" />
                 </Link>
             </Button>
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuração de Tipos de Meta</h1>
                <p className="text-sm text-gray-500">Defina os tipos de metas disponíveis para este projeto.</p>
             </div>
         </div>

         <GoalTypesConfig projectId={id} types={types || []} />
      </div>
    </div>
  )
}
