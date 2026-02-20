import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMppTasks, mppFetchRaw } from '@/lib/mpp-api'

function normalizeStatus(raw?: string) {
  const value = String(raw || '').toLowerCase()
  if (!value) return 'A iniciar'
  if (value.includes('done') || value.includes('concl') || value.includes('completed')) return 'Concluído'
  if (value.includes('progress') || value.includes('andamento')) return 'Andamento'
  if (value.includes('delay') || value.includes('atras')) return 'Atraso'
  return 'A iniciar'
}

async function getMppProjectName(projectId: string, tenantId?: string) {
  const response = await mppFetchRaw(`/v1/projects/${projectId}`, undefined, { tenantId })
  if (!response.ok) return `Projeto importado ${projectId.slice(0, 8)}`

  try {
    const body = (await response.json()) as Record<string, unknown>
    return String(body.name || body.project_name || body.title || `Projeto importado ${projectId.slice(0, 8)}`)
  } catch {
    return `Projeto importado ${projectId.slice(0, 8)}`
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || undefined
    const payload = (await request.json()) as { mppProjectId?: string; localProjectId?: string }

    if (!payload.mppProjectId) {
      return NextResponse.json({ success: false, error: 'mppProjectId é obrigatório' }, { status: 400 })
    }

    const mppProjectId = payload.mppProjectId
    const projectName = await getMppProjectName(mppProjectId, tenantId)

    const localProject = payload.localProjectId
      ? await prisma.project.update({
          where: { id: payload.localProjectId },
          data: { name: projectName, status: 'Andamento', type: 'Importado MPP' },
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

    await prisma.importedProject.upsert({
      where: { externalUid: mppProjectId },
      update: {
        name: projectName,
        source: 'MPP',
        projectId: localProject.id,
      },
      create: {
        externalUid: mppProjectId,
        name: projectName,
        source: 'MPP',
        projectId: localProject.id,
      },
    })

    const mppTasks = await getMppTasks(mppProjectId, undefined, { tenantId, timeoutMs: 120_000 })

    for (const task of mppTasks) {
      const externalId = `mpp:${mppProjectId}:${task.id}`
      await prisma.projectItem.upsert({
        where: { externalId },
        update: {
          projectId: localProject.id,
          originSheet: 'CRONOGRAMA_IMPORT',
          task: task.task,
          wbs: task.wbs || undefined,
          responsible: task.responsible || undefined,
          status: normalizeStatus(task.status),
          datePlanned: task.datePlanned ? new Date(task.datePlanned) : null,
          datePlannedEnd: task.datePlannedEnd ? new Date(task.datePlannedEnd) : null,
          metadata: task.metadata as object,
        },
        create: {
          externalId,
          projectId: localProject.id,
          originSheet: 'CRONOGRAMA_IMPORT',
          task: task.task,
          wbs: task.wbs || undefined,
          responsible: task.responsible || undefined,
          status: normalizeStatus(task.status),
          priority: 'Média',
          datePlanned: task.datePlanned ? new Date(task.datePlanned) : null,
          datePlannedEnd: task.datePlannedEnd ? new Date(task.datePlannedEnd) : null,
          metadata: task.metadata as object,
        },
      })
    }

    return NextResponse.json({
      success: true,
      localProjectId: localProject.id,
      mppProjectId,
      importedTasks: mppTasks.length,
    })
  } catch (error) {
    console.error('Erro ao sincronizar projeto importado:', error)
    return NextResponse.json({ success: false, error: 'Falha ao sincronizar projeto importado' }, { status: 500 })
  }
}
