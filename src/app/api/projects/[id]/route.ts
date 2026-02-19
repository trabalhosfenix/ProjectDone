import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
  }
}
