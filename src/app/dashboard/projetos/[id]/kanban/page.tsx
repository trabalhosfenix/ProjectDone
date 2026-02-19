import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { KanbanBoard } from '@/components/dashboard/kanban-board'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Trello } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const items = await prisma.projectItem.findMany({
    where: { projectId: id },
    include: {
      _count: {
        select: { comments: true },
      },
    },
    orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />

      <div className="flex-1 container mx-auto p-6 max-w-[1400px]">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/dashboard/projetos/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trello className="w-6 h-6 text-blue-500" />
              Quadro Kanban
            </h1>
            <p className="text-gray-500">Gerencie, ajuste e mova tarefas importadas e manuais no fluxo ágil.</p>
          </div>
        </div>

        <KanbanBoard initialItems={items} projectId={id} />
      </div>
    </div>
  )
}
