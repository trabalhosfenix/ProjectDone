import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const imported = await prisma.importedProject.findFirst({
      where: { projectId },
      select: {
        id: true,
        externalUid: true,
        source: true,
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
      mppProjectId: imported.externalUid,
      source: imported.source,
      updatedAt: imported.updatedAt,
    })
  } catch (error) {
    console.error('Erro ao resolver contexto do projeto:', error)
    return NextResponse.json({ success: false, error: 'Falha ao resolver contexto do projeto' }, { status: 500 })
  }
}

