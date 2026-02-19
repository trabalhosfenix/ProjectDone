import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { GitBranch, Box, Calendar, DollarSign, Target, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function PlanejarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const planningTools = [
    {
      title: 'Estrutura Analítica (EAP)',
      description: 'Decomposição hierárquica do escopo do projeto em entregas gerenciáveis.',
      icon: GitBranch,
      href: `/dashboard/projetos/${projectId}/escopo/dicionario`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Cronograma',
      description: 'Sequenciamento de atividades, definição de datas e caminho crítico.',
      icon: Calendar,
      href: `/dashboard/projetos/${projectId}/cronograma`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Canvas do Projeto',
      description: 'Definição visual de alto nível dos componentes do projeto.',
      icon: Box,
      href: `/dashboard/projetos/${projectId}/escopo/canvas`,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Alocação de Recursos',
      description: 'Planejamento de equipe, custos e esforço estimado.',
      icon: DollarSign,
      href: `/dashboard/projetos/${projectId}/alocacao`,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Planos de Qualidade',
      description: 'Definição de metas de qualidade e critérios de aceite.',
      icon: Target,
      href: `/dashboard/projetos/${projectId}/metas`,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Riscos',
      description: 'Identificação e análise de riscos potenciais.',
      icon: FileText,
      href: `/dashboard/projetos/${projectId}/riscos`,
      color: 'bg-orange-100 text-orange-600'
    }
  ]

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
             title="Planejamento do Projeto"
             description="Ferramentas essenciais para a fase de planejamento."
             projectId={projectId}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planningTools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full"> 
                <CardHeader className="flex flex-row items-center gap-4">
                   <div className={`p-3 rounded-lg ${tool.color}`}>
                     <tool.icon className="w-6 h-6" />
                   </div>
                   <div className="flex-1">
                     <CardTitle className="text-lg">{tool.title}</CardTitle>
                   </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{tool.description}</CardDescription>
                  <div className="flex items-center text-sm font-medium text-blue-600">
                    Acessar <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
