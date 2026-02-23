import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user } = await requireProjectAccess(id)

    const project = await prisma.project.findFirst({
      where: {
        id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      include: {
        items: {
          orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        risks: {
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projeto não encontrado' }, { status: 404 })
    }

    const metadata = (project.metadata as Record<string, unknown> | null) || {}
    const lessons = Array.isArray(metadata.lessons) ? metadata.lessons : []

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          type: project.type,
          description: project.description,
          justification: project.justification,
          objective: project.objective,
          assumptions: project.assumptions,
          constraints: project.constraints,
          progress: project.progress || 0,
          budget: project.budget || 0,
          actualCost: project.actualCost || 0,
          startDate: project.startDate,
          endDate: project.endDate,
          realStartDate: project.realStartDate,
          realEndDate: project.realEndDate,
          managerName: project.managerName,
          client: project.client,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        items: project.items,
        members: project.members,
        risks: project.risks,
        lessons,
      },
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao carregar contexto de relatorios:', error)
    return NextResponse.json({ success: false, error: 'Falha ao carregar contexto de relatorios' }, { status: 500 })
  }
}
