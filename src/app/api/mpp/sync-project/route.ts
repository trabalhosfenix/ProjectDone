import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMppTasks, mppFetchRaw } from '@/lib/mpp-api'
import { normalizeTaskStatus } from '@/lib/task-status'
import { AccessError, requireAuth, requireProjectAccess } from '@/lib/access-control'

type SyncMode = 'append' | 'upsert' | 'replace'

type SyncPayload = {
  mppProjectId?: string
  localProjectId?: string
  syncMode?: SyncMode
  projectNameHint?: string
}

type RunSyncContext = {
  importedProjectId: string
  localProjectId: string
  mppProjectId: string
  effectiveSyncMode: SyncMode
  syncTenantId: string
  projectName: string
  jobId: string
}

function normalizeProjectName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function sanitizeProjectNameHint(fileName: string): string | null {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '')
  const normalized = withoutExtension.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : null
}

async function getMppProjectName(projectId: string, tenantId?: string, projectNameHint?: string) {
  const fallbackName = sanitizeProjectNameHint(projectNameHint || '') || `Projeto importado ${projectId.slice(0, 8)}`
  const response = await mppFetchRaw(`/v1/projects/${projectId}`, undefined, { tenantId })
  if (!response.ok) return fallbackName

  try {
    const body = (await response.json()) as Record<string, unknown>
    return (
      normalizeProjectName(body.name) ||
      normalizeProjectName(body.project_name) ||
      normalizeProjectName(body.title) ||
      fallbackName
    )
  } catch {
    return fallbackName
  }
}

function normalizeJobStatus(status: string) {
  const normalized = status.toLowerCase()
  if (['completed', 'synced', 'success', 'done'].includes(normalized)) return 'completed'
  if (['error', 'failed'].includes(normalized)) return 'error'
  if (['pending'].includes(normalized)) return 'pending'
  return 'processing'
}

async function writeJobLog(
  jobId: string,
  importedProjectId: string,
  message: string,
  status: string,
  progress: number,
  payload?: Record<string, unknown>
) {
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status,
      message,
    },
  })

  await prisma.importSyncLog.create({
    data: {
      importedProjectId,
      jobId,
      level: status === 'error' ? 'error' : 'info',
      message,
      payload: {
        progress,
        ...payload,
      },
    },
  })
}

async function runSyncProject(context: RunSyncContext) {
  const {
    importedProjectId,
    localProjectId,
    mppProjectId,
    effectiveSyncMode,
    syncTenantId,
    projectName,
    jobId,
  } = context

  try {
    await writeJobLog(jobId, importedProjectId, 'Buscando tarefas no projeto importado...', 'processing', 15, {
      stage: 'fetching_tasks',
    })

    const mppTasks = await getMppTasks(mppProjectId, undefined, { tenantId: syncTenantId, timeoutMs: 120_000 })

    await writeJobLog(
      jobId,
      importedProjectId,
      `Iniciando sincronização de ${mppTasks.length} tarefa(s)...`,
      'processing',
      30,
      {
        stage: 'syncing_tasks',
        totalTasks: mppTasks.length,
      }
    )

    const importedExternalIds = mppTasks.map((task) => `mpp:${mppProjectId}:${String(task.id)}`)
    let createdTasks = 0
    let updatedTasks = 0
    let skippedTasks = 0

    const progressBase = 30
    const progressRange = 60

    for (let index = 0; index < mppTasks.length; index++) {
      const task = mppTasks[index]
      const externalId = `mpp:${mppProjectId}:${String(task.id)}`
      const taskData = {
        projectId: localProjectId,
        tenantId: syncTenantId,
        originSheet: 'CRONOGRAMA_IMPORT',
        task: task.task,
        wbs: task.wbs || undefined,
        responsible: task.responsible || undefined,
        status: normalizeTaskStatus(task.status),
        datePlanned: task.datePlanned ? new Date(task.datePlanned) : null,
        datePlannedEnd: task.datePlannedEnd ? new Date(task.datePlannedEnd) : null,
        metadata: task.metadata as object,
      }

      if (effectiveSyncMode === 'append') {
        const existingTask = await prisma.projectItem.findUnique({
          where: {
            tenantId_projectId_externalId: {
              tenantId: syncTenantId,
              projectId: localProjectId,
              externalId,
            },
          },
          select: { id: true },
        })

        if (!existingTask) {
          await prisma.projectItem.create({
            data: {
              externalId,
              priority: 'MEDIA',
              ...taskData,
            },
          })
          createdTasks += 1
        } else {
          skippedTasks += 1
        }
      } else {
        const existingTask = await prisma.projectItem.findUnique({
          where: {
            tenantId_projectId_externalId: {
              tenantId: syncTenantId,
              projectId: localProjectId,
              externalId,
            },
          },
          select: { id: true },
        })

        await prisma.projectItem.upsert({
          where: {
            tenantId_projectId_externalId: {
              tenantId: syncTenantId,
              projectId: localProjectId,
              externalId,
            },
          },
          update: taskData,
          create: {
            externalId,
            priority: 'MEDIA',
            ...taskData,
          },
        })

        if (existingTask) updatedTasks += 1
        else createdTasks += 1
      }

      const processed = index + 1
      if (processed % 25 === 0 || processed === mppTasks.length) {
        const ratio = mppTasks.length > 0 ? processed / mppTasks.length : 1
        const progress = Math.min(95, Math.round(progressBase + ratio * progressRange))
        await writeJobLog(
          jobId,
          importedProjectId,
          `Sincronizando tarefas (${processed}/${mppTasks.length})...`,
          'processing',
          progress,
          {
            stage: 'syncing_tasks',
            totalTasks: mppTasks.length,
            processedTasks: processed,
            createdTasks,
            updatedTasks,
            skippedTasks,
          }
        )
      }
    }

    const cleanupResult =
      effectiveSyncMode === 'replace'
        ? await prisma.projectItem.deleteMany({
            where: importedExternalIds.length
              ? {
                  projectId: localProjectId,
                  originSheet: 'CRONOGRAMA_IMPORT',
                  externalId: {
                    startsWith: `mpp:${mppProjectId}:`,
                    notIn: importedExternalIds,
                  },
                }
              : {
                  projectId: localProjectId,
                  originSheet: 'CRONOGRAMA_IMPORT',
                  externalId: { startsWith: `mpp:${mppProjectId}:` },
                },
          })
        : { count: 0 }

    await prisma.importedProject.update({
      where: { id: importedProjectId },
      data: {
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
        syncMode: effectiveSyncMode,
        name: projectName,
        projectId: localProjectId,
        externalProjectId: mppProjectId,
      },
    })

    await writeJobLog(jobId, importedProjectId, 'Sincronização concluída com sucesso.', 'completed', 100, {
      stage: 'completed',
      importedTasks: mppTasks.length,
      createdTasks,
      updatedTasks,
      skippedTasks,
      removedTasks: cleanupResult.count,
      localProjectId,
      mppProjectId,
      syncMode: effectiveSyncMode,
    })
  } catch (error) {
    console.error('Erro ao sincronizar projeto importado:', error)

    await prisma.importedProject
      .update({
        where: { id: importedProjectId },
        data: {
          syncStatus: 'ERROR',
          lastSyncAt: new Date(),
        },
      })
      .catch(() => null)

    await prisma.importJob
      .update({
        where: { id: jobId },
        data: {
          status: 'error',
          message: 'Falha ao sincronizar projeto importado',
        },
      })
      .catch(() => null)

    await prisma.importSyncLog
      .create({
        data: {
          importedProjectId,
          jobId,
          level: 'error',
          message: 'Falha ao sincronizar projeto importado',
          payload: {
            progress: 100,
            stage: 'error',
          },
        },
      })
      .catch(() => null)
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth()
    const headerTenantId = request.headers.get('x-tenant-id') || undefined
    if (currentUser.tenantId && headerTenantId && currentUser.tenantId !== headerTenantId) {
      throw new AccessError('Tenant inválido', 403)
    }
    const tenantId = currentUser.tenantId || headerTenantId || undefined
    const payload = (await request.json()) as SyncPayload

    if (!payload.mppProjectId) {
      return NextResponse.json({ success: false, error: 'mppProjectId é obrigatório' }, { status: 400 })
    }

    const mppProjectId = payload.mppProjectId
    const projectName = await getMppProjectName(mppProjectId, tenantId, payload.projectNameHint)

    let localProject
    if (payload.localProjectId) {
      await requireProjectAccess(payload.localProjectId, currentUser)
      localProject = await prisma.project.findUnique({
        where: { id: payload.localProjectId },
      })
    } else {
      localProject = await prisma.project.create({
        data: {
          name: projectName,
          code: `MPP-${mppProjectId.slice(0, 8).toUpperCase()}`,
          status: 'EM_ANDAMENTO',
          type: 'MPP',
          description: `Projeto sincronizado da MPP Platform. External ID: ${mppProjectId}`,
          createdById: currentUser.id,
          tenantId: currentUser.tenantId || undefined,
        },
      })
    }

    if (!localProject) {
      return NextResponse.json({ success: false, error: 'Projeto local não encontrado' }, { status: 404 })
    }

    const existingImported = await prisma.importedProject.findFirst({
      where: {
        ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
        source: 'MPP',
        externalUid: mppProjectId,
      },
      select: { id: true, syncMode: true },
    })

    const effectiveSyncMode: SyncMode = payload.syncMode || (existingImported?.syncMode as SyncMode) || 'upsert'

    let importedProjectId: string
    if (existingImported) {
      importedProjectId = existingImported.id
      await prisma.importedProject.update({
        where: { id: existingImported.id },
        data: {
          name: projectName,
          projectId: localProject.id,
          externalProjectId: mppProjectId,
          syncMode: effectiveSyncMode,
          syncStatus: 'SYNCING',
          tenantId: currentUser.tenantId || undefined,
        },
      })
    } else {
      const createdImported = await prisma.importedProject.create({
        data: {
          externalUid: mppProjectId,
          name: projectName,
          source: 'MPP',
          projectId: localProject.id,
          externalProjectId: mppProjectId,
          syncMode: effectiveSyncMode,
          syncStatus: 'SYNCING',
          tenantId: currentUser.tenantId || undefined,
          importedById: currentUser.id,
        },
      })
      importedProjectId = createdImported.id
    }

    const job = await prisma.importJob.create({
      data: {
        importedProjectId,
        requestedById: currentUser.id,
        status: 'processing',
        message: 'Preparando sincronização com projeto local...',
      },
    })

    await prisma.importSyncLog.create({
      data: {
        importedProjectId,
        jobId: job.id,
        level: 'info',
        message: 'Job de sincronização criado. Iniciando processamento...',
        payload: { progress: 5, stage: 'starting' },
      },
    })

    const syncTenantId = currentUser.tenantId ?? localProject.tenantId

    void runSyncProject({
      importedProjectId,
      localProjectId: localProject.id,
      mppProjectId,
      effectiveSyncMode,
      syncTenantId,
      projectName,
      jobId: job.id,
    })

    return NextResponse.json({
      success: true,
      accepted: true,
      syncJobId: job.id,
      importedProjectId,
      localProjectId: localProject.id,
      mppProjectId,
      syncMode: effectiveSyncMode,
      status: normalizeJobStatus(job.status),
      message: job.message,
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }

    console.error('Erro ao sincronizar projeto importado:', error)
    return NextResponse.json({ success: false, error: 'Falha ao sincronizar projeto importado' }, { status: 500 })
  }
}
