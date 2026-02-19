import AdminPanel from "@/components/admin/admin-panel";
import { getProjectItems, getStatusOptions } from "@/app/actions/items";
import { getRecentActivities } from "@/app/actions/dashboard";
import { getImportedProjects, getImportedTasksSummary } from "@/app/actions/imported-projects";
import { calculateDashboardStats, calculateCurvaS, calculateMultiProjectMetrics } from "@/lib/dashboard-calculations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Buscar dados locais E importados em paralelo
  const [
    localItems, 
    recentActivities, 
    statusOptionsData,
    importedProjectsResult,
    importedTasksSummary
  ] = await Promise.all([
    getProjectItems(),                    // Dados locais
    getRecentActivities(),                 // Atividades recentes
    getStatusOptions(),                    // Status options
    getImportedProjects({ limit: 5 }),     // Últimos projetos importados
    getImportedTasksSummary()              // Resumo das tarefas importadas
  ]);

  const importedProjects = (importedProjectsResult as any)?.projects ?? [];

  // Estatísticas combinadas (local + importado)
  const localStats = calculateDashboardStats(localItems);
  const combinedStats = {
    ...localStats,
    // Adicionar métricas de projetos importados
    importedProjects: importedProjects.length,
    importedTasks: importedTasksSummary.totalTasks,
    criticalTasks: importedTasksSummary.criticalTasks,
    delayedTasks: importedTasksSummary.delayedTasks,
    // Métricas consolidadas
    ...{}
  };

  // Curva S combinada (se necessário)
  const curvaSData = calculateCurvaS(localItems, importedTasksSummary.timelineData);
  
  // Multi-project metrics
  const multiProjectMetrics = calculateMultiProjectMetrics(importedProjects);
  
  const statusOptions = statusOptionsData.map(opt => opt.label);
  
  return (
    <div className="h-screen">
      <AdminPanel 
        initialItems={localItems}
        stats={combinedStats}
        curvaSData={curvaSData}
        recentActivities={recentActivities}
        statusOptions={statusOptions.length > 0 ? statusOptions : [
          "Keyuser - Pendente",
          "Keyuser - Concluído",
          "Keyuser - Com problemas"
        ]}
      />
    </div>
  );
}
