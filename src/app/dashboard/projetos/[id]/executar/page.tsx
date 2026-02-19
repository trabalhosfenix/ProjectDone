import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { PlayCircle, CheckSquare, ClipboardList, MessageSquare, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function ExecutarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const executionTools = [
    {
      title: 'Minhas Tarefas',
      description: 'Visualize e atualize o status das tarefas atribuídas a você.',
      icon: CheckSquare,
      href: `/dashboard/projetos/${projectId}/realizar`,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Kanban do Projeto',
      description: 'Gerencie tarefas em um quadro visual interativo.',
      icon: PlayCircle,
      href: `/dashboard/projetos/${projectId}/kanban`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Registros',
      description: 'Adicione apontamentos e registros de progresso.',
      icon: ClipboardList,
      href: `/dashboard/projetos/${projectId}/registros`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Questões',
      description: 'Gerencie problemas e impedimentos do projeto.',
      icon: MessageSquare,
      href: `/dashboard/projetos/${projectId}/questoes`,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Documentos',
      description: 'Acesse e gerencie documentos de execução.',
      icon: FileText,
      href: `/dashboard/projetos/${projectId}/documentos`,
      color: 'bg-gray-100 text-gray-600'
    }
  ]

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
             title="Execução do Projeto"
             description="Ferramentas para acompanhar e registrar a execução das atividades."
             projectId={projectId}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {executionTools.map((tool) => (
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
