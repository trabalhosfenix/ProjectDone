import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import { getCutoverTasks, getCutoverStats } from '@/app/actions/cutover-tasks'
import { CutoverPageClient } from './client'

export default async function CutoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const [tasksResult, statsResult] = await Promise.all([
    getCutoverTasks(projectId),
    getCutoverStats(projectId)
  ])
  
  const tasks = tasksResult.data || []
  const stats = statsResult.data || {
    total: 0,
    completed: 0,
    inProgress: 0,
    delayed: 0,
    pending: 0,
    completedPercent: 0,
    inProgressPercent: 0,
    delayedPercent: 0
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-[1600px]">
        <ProjectPageHeader 
          title="Plano de Cutover"
          description="Gerencie as atividades de transição e go-live do projeto."
          projectId={projectId}
        />

        <CutoverPageClient 
          projectId={projectId} 
          initialTasks={tasks} 
          initialStats={stats} 
        />
      </div>
    </div>
  )
}

