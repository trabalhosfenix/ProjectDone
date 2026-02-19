import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getIssueStatuses } from '@/app/actions/issues'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { IssueForm } from '@/components/issues/issue-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function NovaQuestaoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id: projectId } = await params

  if (!session?.user) {
    return <div>Não autorizado</div>
  }

  const statuses = await getIssueStatuses()



// ...

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader 
            title="Nova Questão"
            description="Preencha os dados da nova questão"
            projectId={projectId}
            backLink={`/dashboard/projetos/${projectId}/questoes`}
        />

        {/* Formulário */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <IssueForm
            projectId={projectId}
            userId={session.user.id!}
            statuses={statuses}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}
