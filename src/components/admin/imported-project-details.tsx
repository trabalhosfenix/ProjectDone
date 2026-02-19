// src/components/admin/imported-project-details.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  BarChart3,
  Download,
  FileText,
  GitBranch,
  Users,
  Link,
  RefreshCw
} from 'lucide-react';
import { getImportedProjectDetails, syncProjectWithLocal } from '@/app/actions/imported-projects';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { TasksTable } from '@/components/tasks/tasks-table';
import { ResourcesView } from '@/components/resources/resources-view';
import { RisksList } from '@/components/risks/risks-list';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

export function ImportedProjectDetails() {
  const params = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const data = await getImportedProjectDetails(projectId);
      setProject(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o projeto',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncProjectWithLocal(projectId);
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Projeto sincronizado com sucesso'
        });
        await loadProject();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!project) {
    return <div>Projeto não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#094160]">{project.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Código: {project.code || 'N/A'}</span>
            <span>•</span>
            <span>Importado em: {format(new Date(project.importedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Progresso</p>
                <p className="text-2xl font-bold">{project.progress || 0}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tarefas</p>
                <p className="text-2xl font-bold">{project.totalTasks || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm">
              <span className="text-red-500">{project.delayedTasks || 0} atrasadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Caminho Crítico</p>
                <p className="text-2xl font-bold">{project.criticalTasks || 0}</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recursos</p>
                <p className="text-2xl font-bold">{project.totalResources || 0}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="gantt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
          <TabsTrigger value="baselines">Linhas de Base</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="border rounded-lg p-4 bg-white">
          <GanttChart 
            tasks={project.ganttData?.tasks || []}
            dependencies={project.ganttData?.dependencies || []}
            baseline={project.ganttData?.baseline}
            height={500}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTable tasks={project.tasks || []} />
        </TabsContent>

        <TabsContent value="resources">
          <ResourcesView resources={project.resources || []} />
        </TabsContent>

        <TabsContent value="risks">
          <RisksList risks={project.risks || []} />
        </TabsContent>

        <TabsContent value="baselines">
          {/* Componente de baselines */}
        </TabsContent>
      </Tabs>
    </div>
  );
}