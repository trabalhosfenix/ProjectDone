import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireAuth } from '@/lib/access-control'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/v1'

function normalizeStatus(status: string) {
  const value = status.toLowerCase()
  if (['completed', 'success', 'done', 'synced'].includes(value)) return 'completed'
  if (['error', 'failed', 'canceled'].includes(value)) return 'error'
  if (['pending'].includes(value)) return 'pending'
  return 'processing'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { jobId } = await params

    const localJob = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        importedProject: {
          select: {
            tenantId: true,
            projectId: true,
            externalProjectId: true,
          },
        },
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (localJob) {
      if (currentUser.tenantId && localJob.importedProject.tenantId && currentUser.tenantId !== localJob.importedProject.tenantId) {
        throw new AccessError('Acesso negado ao job', 403)
      }

      const latestLog = localJob.syncLogs[0]
      const payload = (latestLog?.payload || {}) as Record<string, unknown>
      const progressFromLog = Number(payload.progress)
      const fallbackProgress = normalizeStatus(localJob.status) === 'completed' ? 100 : normalizeStatus(localJob.status) === 'error' ? 100 : 10
      const progress = Number.isFinite(progressFromLog) ? Math.max(0, Math.min(100, progressFromLog)) : fallbackProgress

      return NextResponse.json({
        status: normalizeStatus(localJob.status),
        progress,
        message: localJob.message || latestLog?.message || 'Processando sincronização...',
        projectId: localJob.importedProject.projectId,
        mppProjectId: localJob.importedProject.externalProjectId,
        logs: localJob.syncLogs
          .slice()
          .reverse()
          .map((log) => ({
            level: log.level,
            message: log.message,
            createdAt: log.createdAt,
            payload: log.payload,
          })),
      })
    }

    const tenantId = currentUser.tenantId || request.headers.get('x-tenant-id') || undefined

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      },
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Erro ${response.status}`)
    }

    return NextResponse.json({
      status: normalizeStatus(String(data.status || 'processing')),
      progress: data.progress || 0,
      message: data.message || 'Processando...',
      projectId: data.projectId,
    })
  } catch (error: unknown) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        { error: error.message, status: 'error' },
        { status: error.status }
      )
    }

    console.error('Erro ao verificar job:', error)

    const message = error instanceof Error ? error.message : 'Erro ao verificar status'
    return NextResponse.json(
      {
        error: message,
        status: 'error',
      },
      { status: 500 }
    )
  }
}
