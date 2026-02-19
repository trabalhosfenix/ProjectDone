import { calculateProjectMetrics, getProjectCriticalItems } from '@/app/actions/project-details'
import { ProjectCriticalTasks } from '@/components/project/project-critical-tasks'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { PerformanceDashboard } from '@/components/dashboard/performance-dashboard'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default async function MonitorarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const result = await calculateProjectMetrics(id)
  const criticalResult = await getProjectCriticalItems(id)
  
  const metrics = result.success ? result.data : null
  const criticalData = criticalResult.success ? criticalResult.data : { all: [], delayed: [], critical: [], totalDelayed: 0, totalCritical: 0 }

  // Serializar itens com robustez e mapear campos necessários (progress)
  const plainItems = JSON.parse(JSON.stringify(criticalData.all || []))
  
  const serializedItems = plainItems.map((item: any) => ({
    ...item,
    progress: item.metadata?.progress || 0
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-[1400px] space-y-8">
        <ProjectPageHeader 
             title="Monitoramento e Controle"
             description="Dashboard de performance (EVA) e indicadores de progresso."
             projectId={id}
        />
        
        {/* Performance Dashboard */}
        <div>
            <PerformanceDashboard items={serializedItems} projectId={id} metrics={metrics} />
        </div>

        {/* Tarefas Críticas e Atrasadas */}
        <div>
             <ProjectCriticalTasks 
                items={serializedItems} 
                delayedCount={criticalData.totalDelayed} 
                criticalCount={criticalData.totalCritical} 
             />
        </div>
      </div>
    </div>
  )
}
