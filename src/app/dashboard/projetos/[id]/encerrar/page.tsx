import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { CheckCircle, FileText, BookOpen, Award, ClipboardCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function EncerrarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  
  const closureTools = [
    {
      title: 'Lições Aprendidas',
      description: 'Documente experiências e aprendizados do projeto.',
      icon: BookOpen,
      href: `/dashboard/projetos/${projectId}/licoes-aprendidas`,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Avaliação de Qualidade',
      description: 'Verifique os critérios de aceite e qualidade final.',
      icon: ClipboardCheck,
      href: `/dashboard/projetos/${projectId}/avaliacao`,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Metas',
      description: 'Valide o atingimento das metas definidas.',
      icon: Award,
      href: `/dashboard/projetos/${projectId}/metas`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Documentos de Encerramento',
      description: 'Acesse termos e documentos de finalização.',
      icon: FileText,
      href: `/dashboard/projetos/${projectId}/documentos`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Situação Final',
      description: 'Visualize o status final e closures do projeto.',
      icon: CheckCircle,
      href: `/dashboard/projetos/${projectId}/situacao`,
      color: 'bg-gray-100 text-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
             title="Encerramento do Projeto"
             description="Ferramentas para concluir e documentar o encerramento do projeto."
             projectId={projectId}
        />


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {closureTools.map((tool) => (
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
