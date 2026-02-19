import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectGoalsList } from '@/components/project/project-goals-list'
import { getProjectGoals } from '@/app/actions/project-quality'
import { getProjectGoalTypes } from '@/app/actions/project-goal-types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MetasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [goalsRes, typesRes] = await Promise.all([
     getProjectGoals(id),
     getProjectGoalTypes(id)
  ])
  
  const goals = goalsRes.success ? goalsRes.data : []
  const types = typesRes.success ? typesRes.data : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/dashboard/projetos/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
            <p className="text-gray-500">Acompanhe os objetivos estratégicos e resultados esperados do projeto.</p>
          </div>
        </div>

        <ProjectGoalsList projectId={id} goals={goals || []} goalTypes={types || []} />
      </div>
    </div>
  )
}
