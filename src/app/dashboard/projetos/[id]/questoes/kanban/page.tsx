import { prisma } from '@/lib/prisma'
import { getIssues, getIssueStatuses } from '@/app/actions/issues'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IssueKanbanBoard } from '@/components/issues/issue-kanban-board'

// ... existing imports

export default async function IssueKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const [issues, statuses, members] = await Promise.all([
    getIssues({ projectId }),
    getIssueStatuses(),
    prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
    })
  ])

  // Adapter columns and items
  const columns = statuses.map(s => ({
    id: s.id,
    label: s.label,
    color: s.color
  }))


// ...

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-[1600px] h-full flex flex-col">
          <ProjectPageHeader 
             title="Kanban de Questões" 
             description="Gerenciamento visual do workflow de problemas."
             projectId={projectId}
             backLink={`/dashboard/projetos/${projectId}/questoes`}
          />
          
          <div className="flex-1 h-full min-h-[600px]">
             {/* @ts-ignore */}
            <IssueKanbanBoard 
                initialItems={issues} 
                columns={columns} 
                projectId={projectId} 
                members={members}
                statuses={statuses}
            />
          </div>
      </div>
    </div>
  )
}
