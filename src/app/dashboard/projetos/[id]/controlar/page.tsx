import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Activity, TrendingUp, AlertTriangle, BarChart3, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function ControlarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const controlTools = [
    {
      title: 'Monitorar (Dashboard EVA)',
      description: 'Acompanhe indicadores de desempenho SPI, CPI e progresso.',
      icon: TrendingUp,
      href: `/dashboard/projetos/${projectId}/monitorar`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Cronograma',
      description: 'Visualize e atualize o andamento das tarefas.',
      icon: Calendar,
      href: `/dashboard/projetos/${projectId}/cronograma`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Riscos',
      description: 'Monitore riscos identificados e atualize respostas.',
      icon: AlertTriangle,
      href: `/dashboard/projetos/${projectId}/riscos`,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Situação do Projeto',
      description: 'Veja o status geral e próximos marcos.',
      icon: Activity,
      href: `/dashboard/projetos/${projectId}/situacao`,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Relatórios',
      description: 'Acesse relatórios de controle e performance.',
      icon: BarChart3,
      href: `/dashboard/projetos/${projectId}/relatorios`,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ]

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
             title="Controle do Projeto"
             description="Ferramentas para monitorar e controlar o andamento do projeto."
             projectId={projectId}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {controlTools.map((tool) => (
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
