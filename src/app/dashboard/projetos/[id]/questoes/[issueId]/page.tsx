import { getIssueDetails } from '@/app/actions/issues'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { IssueComments } from '@/components/issues/issue-comments'
import { IssueMemberCard } from '@/components/issues/issue-member-card'
import { Button } from '@/components/ui/button'
import { Calendar, Trash2, Edit, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default async function IssueDetailsPage({ params }: { params: Promise<{ id: string; issueId: string }> }) {
  const session = await getServerSession(authOptions)
  const { id: projectId, issueId } = await params

  const issue = await getIssueDetails(issueId)

  if (!issue) {
    notFound()
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/projetos/${projectId}/questoes`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para lista
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Conteúdo Principal - 8 colunas */}
          <div className="col-span-8 space-y-6">
            {/* Título e Ações */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {issue.code && (
                    <span className="text-sm text-gray-500 font-mono">{issue.code}</span>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 mt-1">{issue.title}</h1>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/projetos/${projectId}/questoes/${issueId}/editar`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <span className="text-sm text-gray-500">Tipo</span>
                  <p className="font-medium mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        issue.type === 'EXTERNAL'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.type === 'EXTERNAL' ? 'Externa' : 'Interna'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Situação</span>
                  <p className="font-medium mt-1">
                    {issue.status ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: issue.status.color }}
                        />
                        <span>{issue.status.label}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Prioridade</span>
                  <p className="font-medium mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        issue.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : issue.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : issue.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {issue.priority === 'CRITICAL'
                        ? 'Crítica'
                        : issue.priority === 'HIGH'
                        ? 'Alta'
                        : issue.priority === 'MEDIUM'
                        ? 'Média'
                        : 'Baixa'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Criado por</span>
                  <p className="font-medium mt-1">{issue.createdBy.name}</p>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4">Datas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Início Previsto
                  </span>
                  <p className="font-medium mt-1">
                    {issue.plannedStart
                      ? format(new Date(issue.plannedStart), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fim Previsto
                  </span>
                  <p className="font-medium mt-1">
                    {issue.plannedEnd
                      ? format(new Date(issue.plannedEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Início Real
                  </span>
                  <p className="font-medium mt-1">
                    {issue.actualStart
                      ? format(new Date(issue.actualStart), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fim Real
                  </span>
                  <p className="font-medium mt-1">
                    {issue.actualEnd
                      ? format(new Date(issue.actualEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {issue.description && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="font-semibold text-gray-900 mb-4">Descrição</h2>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {issue.description}
                </div>
              </div>
            )}

            {/* Comentários */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <IssueComments
                issueId={issueId}
                projectId={projectId}
                userId={session?.user?.id || ''}
                comments={issue.comments}
              />
            </div>
          </div>

          {/* Sidebar - 4 colunas */}
          <div className="col-span-4 space-y-6">
            {/* Projeto */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Projeto</h3>
              <Link
                href={`/dashboard/projetos/${projectId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {issue.project.name}
              </Link>
            </div>

            {/* Envolvidos */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Envolvidos</h3>
              <div className="space-y-2">
                {issue.members.map((member) => (
                  <IssueMemberCard
                    key={member.id}
                    member={member}
                    projectId={projectId}
                    issueId={issueId}
                    canRemove={session?.user?.id === issue.createdById}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
