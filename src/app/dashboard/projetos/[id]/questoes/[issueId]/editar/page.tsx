import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getIssueDetails, getIssueStatuses } from '@/app/actions/issues'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { IssueForm } from '@/components/issues/issue-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function EditarQuestaoPage({ params }: { params: Promise<{ id: string; issueId: string }> }) {
  const session = await getServerSession(authOptions)
  const { id: projectId, issueId } = await params

  if (!session?.user) {
    return <div>Não autorizado</div>
  }

  const [issue, statuses] = await Promise.all([
    getIssueDetails(issueId),
    getIssueStatuses(),
  ])

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/projetos/${projectId}/questoes/${issueId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para detalhes
            </Button>
          </Link>
        </div>

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Editar Questão</h1>
          <p className="text-gray-600 mt-1">{issue.title}</p>
        </div>

        {/* Formulário */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <IssueForm
            projectId={projectId}
            userId={session.user.id!}
            statuses={statuses}
            issue={issue}
            mode="edit"
          />
        </div>
      </div>
    </div>
  )
}
