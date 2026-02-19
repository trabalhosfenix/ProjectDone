"use server"

import { revalidatePath } from "next/cache"

type GetImportedProjectsArgs = {
  limit?: number
  page?: number
  status?: string
}

export async function getImportedProjects({
  limit = 10,
  page = 1,
  status,
}: GetImportedProjectsArgs) {
  return {
    projects: [],
    total: 0,
    page,
    status,
    pageSize: limit,
  }
}

export async function getImportedTasksSummary() {
  return {
    totalTasks: 0,
    criticalTasks: 0,
    delayedTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    timelineData: [],
  }
}

export async function getImportedProjectDetails(projectId: string) {
  if (!projectId) {
    return null
  }

  return {
    id: projectId,
    name: "Projeto importado",
    code: "",
    importedAt: new Date().toISOString(),
    progress: 0,
    totalTasks: 0,
    delayedTasks: 0,
    criticalTasks: 0,
    tasks: [],
    ganttData: {
      tasks: [],
      dependencies: [],
      baseline: null,
    },
    resources: [],
    risks: [],
  }
}

export async function syncProjectWithLocal(projectId: string) {
  if (!projectId) {
    return { success: false, error: "ID inválido" }
  }

  revalidatePath(`/dashboard/projetos-importados/${projectId}`)
  return { success: true }
}

