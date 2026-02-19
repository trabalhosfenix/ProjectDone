import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { getKanbanItems } from '@/app/actions/kanban'
import { ProjectKanbanBoard } from '@/components/kanban/project-kanban-board'

export default async function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: items } = await getKanbanItems(id)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto p-6 h-full flex flex-col max-w-[1600px]">
           <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Quadro Kanban</h1>
              <p className="text-gray-500">Gerenciamento visual de tarefas.</p>
           </div>
           
           <div className="flex-1 min-h-0">
               <ProjectKanbanBoard projectId={id} initialItems={Array.isArray(items) ? items : [] as any} />
           </div>
        </div>
      </div>
    </div>
  )
}
