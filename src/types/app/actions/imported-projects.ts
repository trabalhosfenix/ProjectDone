'use server';

import { api } from '@/lib/api/server-client'; // Versão server-side do cliente
import { cache } from 'react';
import { ImportedProject, TaskListItem } from '@/lib/api/types';

// Cache com revalidação
export const getImportedProjects = cache(async ({ 
  limit = 10, 
  page = 1,
  status 
}: { 
  limit?: number; 
  page?: number;
  status?: string;
}) => {
  try {
    const response = await api.get('/imported-projects', {
      page,
      pageSize: limit,
      status
    });
    
    return {
      projects: response.projects || [],
      total: response.total || 0,
      page: response.page || 1
    };
  } catch (error) {
    console.error('Erro ao buscar projetos importados:', error);
    return { projects: [], total: 0, page: 1 };
  }
});

export const getImportedTasksSummary = cache(async () => {
  try {
    // Buscar todos os projetos ativos
    const projects = await api.get('/imported-projects', { 
      status: 'active',
      pageSize: 100 
    });
    
    let totalTasks = 0;
    let criticalTasks = 0;
    let delayedTasks = 0;
    let completedTasks = 0;
    let timelineData: any[] = [];
    
    // Para cada projeto, buscar resumo de tarefas
    for (const project of projects.projects || []) {
      const summary = await api.get(`/imported-projects/${project.id}/summary`);
      
      totalTasks += summary.totalTasks || 0;
      criticalTasks += summary.criticalTasks || 0;
      delayedTasks += summary.delayedTasks || 0;
      completedTasks += summary.completedTasks || 0;
      
      // Acumular dados para timeline (Curva S)
      if (summary.timeline) {
        timelineData = mergeTimelineData(timelineData, summary.timeline);
      }
    }
    
    return {
      totalTasks,
      criticalTasks,
      delayedTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      timelineData
    };
  } catch (error) {
    console.error('Erro ao buscar resumo de tarefas:', error);
    return {
      totalTasks: 0,
      criticalTasks: 0,
      delayedTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      timelineData: []
    };
  }
});

export const getImportedProjectDetails = cache(async (projectId: string) => {
  try {
    const [project, tasks, gantt] = await Promise.all([
      api.get(`/imported-projects/${projectId}`),
      api.get(`/imported-projects/${projectId}/tasks`, { pageSize: 1000 }),
      api.get(`/imported-projects/${projectId}/gantt`)
    ]);
    
    return {
      ...project,
      tasks: tasks.tasks || [],
      ganttData: gantt,
      totalTasks: tasks.total || 0
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    return null;
  }
});

export const syncProjectWithLocal = async (projectId: string) => {
  'use server';
  
  try {
    // Buscar dados do projeto importado
    const project = await api.get(`/imported-projects/${projectId}/full`);
    
    // Sincronizar com modelo local (se necessário)
    // Esta é a ponte entre o módulo importado e as regras locais
    const syncResult = await api.post(`/projects/${projectId}/sync`, {
      createIssues: true,
      createRisks: true,
      updateProgress: true
    });
    
    return { success: true, result: syncResult };
  } catch (error) {
    console.error('Erro ao sincronizar projeto:', error);
    return { success: false, error: String(error) };
  }
};

// Helper para merge de timelines
function mergeTimelineData(existing: any[], newData: any[]) {
  const merged = [...existing];
  
  newData.forEach(item => {
    const existingIndex = merged.findIndex(e => e.date === item.date);
    if (existingIndex >= 0) {
      merged[existingIndex].planned += item.planned || 0;
      merged[existingIndex].actual += item.actual || 0;
    } else {
      merged.push(item);
    }
  });
  
  return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}