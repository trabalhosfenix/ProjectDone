import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { user } = await requireProjectAccess(projectId)

    const imported = await prisma.importedProject.findFirst({
      where: {
        projectId,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
        source: 'MPP',
      },
      select: {
        id: true,
        externalUid: true,
        externalProjectId: true,
        source: true,
        syncMode: true,
        syncStatus: true,
        lastSyncAt: true,
        projectId: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!imported) {
      return NextResponse.json({
        success: true,
        linked: false,
        localProjectId: projectId,
      })
    }

    return NextResponse.json({
      success: true,
      linked: true,
      localProjectId: projectId,
      importedProjectId: imported.id,
      mppProjectId: imported.externalProjectId || imported.externalUid,
      source: imported.source,
      syncMode: imported.syncMode,
      syncStatus: imported.syncStatus,
      lastSyncAt: imported.lastSyncAt,
      updatedAt: imported.updatedAt,
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao resolver contexto do projeto:', error)
    return NextResponse.json({ success: false, error: 'Falha ao resolver contexto do projeto' }, { status: 500 })
  }
}

