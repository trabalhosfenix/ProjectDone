"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

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
  const where = status ? { project: { status } } : undefined
  const skip = (page - 1) * limit

  const [projects, total] = await Promise.all([
    prisma.importedProject.findMany({
      where,
      include: {
        project: {
          include: {
            _count: { select: { items: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.importedProject.count({ where }),
  ])

  return {
    projects: projects.map((item) => ({
      id: item.project?.id || item.id,
      importedProjectId: item.id,
      externalUid: item.externalUid,
      name: item.project?.name || item.name || 'Projeto importado',
      status: item.project?.status || 'A iniciar',
      sourceFormat: item.source || 'mpp',
      syncMode: item.syncMode,
      syncStatus: item.syncStatus,
      lastSyncAt: item.lastSyncAt?.toISOString(),
      importedAt: item.createdAt.toISOString(),
      createdAt: item.project?.createdAt?.toISOString(),
      totalItems: item.project?._count.items || 0,
    })),
    total,
    page,
    status,
    pageSize: limit,
  }
}

export async function getImportedTasksSummary() {
  const [totalTasks, criticalTasks, completedTasks] = await Promise.all([
    prisma.projectItem.count({ where: { originSheet: 'CRONOGRAMA_IMPORT' } }),
    prisma.projectItem.count({ where: { originSheet: 'CRONOGRAMA_IMPORT', isCritical: true } }),
    prisma.projectItem.count({ where: { originSheet: 'CRONOGRAMA_IMPORT', status: { in: ['Concluído', 'completed', 'done'] } } }),
  ])

  return {
    totalTasks,
    criticalTasks,
    delayedTasks: 0,
    completedTasks,
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    timelineData: [],
  }
}

export async function getImportedProjectDetails(projectId: string) {
  if (!projectId) return null

  const imported = await prisma.importedProject.findFirst({
    where: {
      OR: [{ id: projectId }, { projectId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      project: {
        include: {
          items: {
            where: { originSheet: 'CRONOGRAMA_IMPORT' },
            orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
      resources: true,
    },
  })

  if (!imported) return null

  const project = imported.project
  const tasks = project?.items || []

  return {
    id: project?.id || imported.id,
    importedProjectId: imported.id,
    externalUid: imported.externalUid,
    syncMode: imported.syncMode,
    syncStatus: imported.syncStatus,
    lastSyncAt: imported.lastSyncAt?.toISOString(),
    name: project?.name || imported.name || 'Projeto importado',
    code: project?.code || '',
    importedAt: imported.createdAt.toISOString(),
    progress: project?.progress || 0,
    totalTasks: tasks.length,
    delayedTasks: 0,
    criticalTasks: tasks.filter((task) => task.isCritical).length,
    tasks,
    ganttData: {
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.task,
        wbs: task.wbs,
        start: task.datePlanned,
        finish: task.datePlannedEnd,
        percent_complete: Number((task.metadata as any)?.progress || 0) * 100,
      })),
      dependencies: [],
      baseline: null,
    },
    resources: imported.resources,
    risks: [],
  }
}

export async function syncProjectWithLocal(projectId: string) {
  if (!projectId) {
    return { success: false, error: "ID inválido" }
  }

  const imported = await prisma.importedProject.findFirst({
    where: {
      OR: [{ id: projectId }, { projectId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: { project: true },
  })

  if (!imported?.project) {
    return { success: false, error: 'Projeto importado não encontrado' }
  }

  revalidatePath(`/dashboard/projetos/${imported.project.id}`)
  revalidatePath(`/dashboard`)
  return { success: true, projectId: imported.project.id }
}
