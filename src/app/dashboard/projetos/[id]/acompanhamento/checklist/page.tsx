import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { getChecklistItems } from '@/app/actions/checklist'
import { ProjectChecklist } from '@/components/checklist/project-checklist'

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: items } = await getChecklistItems(id)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-4xl">
           <ProjectChecklist projectId={id} initialItems={Array.isArray(items) ? items : [] as any} />
        </div>
      </div>
    </div>
  )
}
