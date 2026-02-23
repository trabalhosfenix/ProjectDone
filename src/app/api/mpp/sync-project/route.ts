import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMppTasks, mppFetchRaw } from '@/lib/mpp-api'
import { normalizeTaskStatus } from '@/lib/task-status'

type SyncMode = 'append' | 'upsert' | 'replace'

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

export async function POST(request: Request) {
  let importedProjectId: string | undefined
  try {
    const tenantId = request.headers.get('x-tenant-id') || undefined
    const payload = (await request.json()) as {
      mppProjectId?: string
      localProjectId?: string
      syncMode?: SyncMode
      projectNameHint?: string
    }

    if (!payload.mppProjectId) {
      return NextResponse.json({ success: false, error: 'mppProjectId é obrigatório' }, { status: 400 })
    }

    const mppProjectId = payload.mppProjectId
    const projectName = await getMppProjectName(mppProjectId, tenantId, payload.projectNameHint)

    const localProject = payload.localProjectId
      ? await prisma.project.findUnique({
          where: { id: payload.localProjectId },
        })
      : await prisma.project.create({
          data: {
            name: projectName,
            code: `MPP-${mppProjectId.slice(0, 8).toUpperCase()}`,
            status: 'Andamento',
            type: 'Importado MPP',
            description: `Projeto sincronizado da MPP Platform. External ID: ${mppProjectId}`,
          },
        })

    if (!localProject) {
      return NextResponse.json({ success: false, error: 'Projeto local não encontrado' }, { status: 404 })
    }

    const existingImported = await prisma.importedProject.findFirst({
      where: {
        source: 'MPP',
        externalUid: mppProjectId,
      },
      select: { id: true, syncMode: true },
    })

    const effectiveSyncMode: SyncMode = payload.syncMode || (existingImported?.syncMode as SyncMode) || 'upsert'

    if (existingImported) {
      importedProjectId = existingImported.id
      await prisma.importedProject.update({
        where: { id: existingImported.id },
        data: {
          name: projectName,
          projectId: localProject.id,
          externalProjectId: mppProjectId,
          syncMode: effectiveSyncMode,
          syncStatus: 'syncing',
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
          syncStatus: 'syncing',
        },
      })
      importedProjectId = createdImported.id
    }

    const mppTasks = await getMppTasks(mppProjectId, undefined, { tenantId, timeoutMs: 120_000 })
    const importedExternalIds = mppTasks.map((task) => `mpp:${mppProjectId}:${String(task.id)}`)
    let createdTasks = 0
    let updatedTasks = 0
    let skippedTasks = 0

    for (const task of mppTasks) {
      const externalId = `mpp:${mppProjectId}:${String(task.id)}`
      const taskData = {
        projectId: localProject.id,
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
            projectId_externalId: {
              projectId: localProject.id,
              externalId,
            },
          },
          select: { id: true },
        })

        if (!existingTask) {
          await prisma.projectItem.create({
            data: {
              externalId,
              priority: 'Média',
              ...taskData,
            },
          })
          createdTasks += 1
        } else {
          skippedTasks += 1
        }
        continue
      }

      const existingTask = await prisma.projectItem.findUnique({
        where: {
          projectId_externalId: {
            projectId: localProject.id,
            externalId,
          },
        },
        select: { id: true },
      })

      await prisma.projectItem.upsert({
        where: {
          projectId_externalId: {
            projectId: localProject.id,
            externalId,
          },
        },
        update: taskData,
        create: {
          externalId,
          priority: 'Média',
          ...taskData,
        },
      })

      if (existingTask) {
        updatedTasks += 1
      } else {
        createdTasks += 1
      }
    }

    const cleanupResult =
      effectiveSyncMode === 'replace'
        ? await prisma.projectItem.deleteMany({
            where: importedExternalIds.length
              ? {
                  projectId: localProject.id,
                  originSheet: 'CRONOGRAMA_IMPORT',
                  externalId: {
                    startsWith: `mpp:${mppProjectId}:`,
                    notIn: importedExternalIds,
                  },
                }
              : {
                  projectId: localProject.id,
                  originSheet: 'CRONOGRAMA_IMPORT',
                  externalId: { startsWith: `mpp:${mppProjectId}:` },
                },
          })
        : { count: 0 }

    if (importedProjectId) {
      await prisma.importedProject.update({
        where: { id: importedProjectId },
        data: {
          syncStatus: 'synced',
          lastSyncAt: new Date(),
          syncMode: effectiveSyncMode,
          name: projectName,
          projectId: localProject.id,
          externalProjectId: mppProjectId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      localProjectId: localProject.id,
      mppProjectId,
      syncMode: effectiveSyncMode,
      importedTasks: mppTasks.length,
      createdTasks,
      updatedTasks,
      skippedTasks,
      removedTasks: cleanupResult.count,
    })
  } catch (error) {
    console.error('Erro ao sincronizar projeto importado:', error)
    if (importedProjectId) {
      await prisma.importedProject
        .update({
          where: { id: importedProjectId },
          data: {
            syncStatus: 'error',
            lastSyncAt: new Date(),
          },
        })
        .catch(() => null)
    }
    return NextResponse.json({ success: false, error: 'Falha ao sincronizar projeto importado' }, { status: 500 })
  }
}
