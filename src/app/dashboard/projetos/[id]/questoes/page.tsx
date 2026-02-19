import { getIssues, getIssueStatuses } from '@/app/actions/issues'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { IssueFilters } from '@/components/issues/issue-filters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, AlertCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProjectPageHeader } from "@/components/project/project-page-header"

export default async function QuestoesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id: projectId } = await params

  const [issues, statuses] = await Promise.all([
    getIssues({ projectId }),
    getIssueStatuses(),
  ])



// ...

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="container mx-auto p-6">
        <ProjectPageHeader 
          title="Questões" 
          description={`${issues.length} questões encontradas`} 
          projectId={projectId}
        >
          <Link href={`/dashboard/projetos/${projectId}/questoes/nova`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Questão
            </Button>
          </Link>
        </ProjectPageHeader>

        <div className="grid grid-cols-12 gap-6">
          {/* Filtros - 3 colunas */}
         {/* <div className="col-span-3">
            <IssueFilters
              statuses={statuses}
              members={[]}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>*/}

          {/* Lista - 9 colunas */}
          <div className="col-span-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Início Prev.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fim Prev.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Envolvidos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comentários
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">Nenhuma questão encontrada</p>
                        <p className="text-sm mt-1">Comece criando sua primeira questão</p>
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/projetos/${projectId}/questoes/${issue.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {issue.code && <span className="text-gray-500 mr-2">{issue.code}</span>}
                            {issue.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              issue.type === 'EXTERNAL'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {issue.type === 'EXTERNAL' ? 'Externa' : 'Interna'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {issue.status ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: issue.status.color }}
                              />
                              <span className="text-sm">{issue.status.label}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {issue.plannedStart ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {format(new Date(issue.plannedStart), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {issue.plannedEnd ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {format(new Date(issue.plannedEnd), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex -space-x-2">
                            {issue.members.slice(0, 3).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600"
                                title={member.user.name || ''}
                              >
                                {member.user.name?.substring(0, 2).toUpperCase() || 'U'}
                              </div>
                            ))}
                            {issue.members.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                +{issue.members.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {issue._count.comments}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
