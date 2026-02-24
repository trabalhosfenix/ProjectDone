import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectDetails } from '@/app/actions/project-details'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectInfoPanel } from '@/components/project/project-info-panel'
import { ProjectControlPanel } from '@/components/project/project-control-panel'
import { ProjectControlInfo } from '@/components/project/project-control-info'
import { ProjectRecords } from '@/components/project/project-records'
import { ProjectSetup } from '@/components/project/project-setup'
import { CurvaSChart } from '@/components/dashboard/curva-s'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { calculateCurvaS } from '@/lib/dashboard-calculations'
import { prisma } from '@/lib/prisma'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  
  const result = await getProjectDetails(id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const project = result.data

  // Verificar se o projeto está vazio (sem itens e sem questões)
  const itemsCount = await prisma.projectItem.count({ where: { projectId: id } })
  const issuesCount = await prisma.issue.count({ where: { projectId: id } })

  // Se o projeto não tiver itens, mostrar onboarding
  if (itemsCount === 0 && issuesCount === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <ProjectDetailTabs projectId={id} />
        <ProjectHorizontalMenu projectId={id} />
        <ProjectSetup projectId={id} />
      </div>
    )
  }

  const curvaItems = await prisma.projectItem.findMany({
    where: { projectId: id },
    select: {
      datePlanned: true,
      dateActual: true,
    },
  })

  const curvaSData = calculateCurvaS(curvaItems)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Abas de Navegação */}
      <ProjectDetailTabs projectId={id} />
      
      {/* Menu Horizontal */}
      <ProjectHorizontalMenu projectId={id} />

      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-end">
        <Link href={`/dashboard/projetos/${id}/monitorar`}>
          <Button variant="outline" className="gap-2">
            <Activity className="w-4 h-4" />
            Monitorar
          </Button>
        </Link>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna Central - Informações do Projeto */}
        <div className="flex-1 overflow-y-auto">
          <ProjectInfoPanel 
            project={project}
            members={[]} // TODO: Implementar membros do projeto
          />

          <div className="border-t border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Curva S do Projeto</h3>
            <p className="text-sm text-gray-500 mb-4">
              Evolução acumulada do planejado versus realizado.
            </p>

            {curvaSData.length > 0 ? (
              <CurvaSChart data={curvaSData} />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                Sem dados de datas para representar a Curva S.
              </div>
            )}
          </div>
          
          {/* Registros do Projeto */}
          <div className="border-t border-gray-200 bg-white p-6">
            <ProjectRecords 
              projectId={id}
              initialRecords={project.records || []}
            />
          </div>
        </div>
        
        {/* Coluna Direita - Painel de Controle */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Painel de Controle EVA/PB */}
            <ProjectControlPanel 
              projectId={id}
              project={project}
            />
            
            {/* Informações de Controle Detalhadas */}
            <ProjectControlInfo project={project} />
          </div>
        </div>
      </div>
    </div>
  )
}
