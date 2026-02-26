import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireProjectAccess(id)
    const body = await request.json()

    const updated = await prisma.project.update({
      where: { id },
      data: {
        budget: body.budget !== undefined ? body.budget : undefined,
        actualCost: body.actualCost !== undefined ? body.actualCost : undefined,
        startDate: body.startDate !== undefined ? body.startDate : undefined,
        endDate: body.endDate !== undefined ? body.endDate : undefined,
        realStartDate: body.realStartDate !== undefined ? body.realStartDate : undefined,
        realEndDate: body.realEndDate !== undefined ? body.realEndDate : undefined,
        calendar: body.calendar !== undefined ? body.calendar : undefined,
        duration: body.duration !== undefined ? body.duration : undefined,
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao atualizar projeto:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user } = await requireProjectAccess(id)
    const project = await prisma.project.findFirst({
      where: {
        id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
  }
}
