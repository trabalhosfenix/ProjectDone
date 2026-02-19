import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateEndDate, calculateDuration, WorkCalendarConfig } from '@/lib/calendar-engine'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body = await request.json()

    // 1. Buscar item existente e configuração do calendário
    const item = await prisma.projectItem.findUnique({
      where: { id: itemId },
      include: {
        project: {
          include: {
            workCalendar: {
              include: { holidays: true }
            }
          }
        }
      }
    })

    if (!item) {
        return NextResponse.json({ success: false, error: 'Item não encontrado' }, { status: 404 })
    }

    // Configuração do motor
    const calendar = item.project?.workCalendar
    const config: WorkCalendarConfig = {
        type: (calendar?.type as any) || 'BUSINESS_DAYS',
        holidays: calendar?.holidays || [],
        workHoursPerDay: calendar?.workHoursPerDay || 8
    }

    // Dados a atualizar
    const dataToUpdate: any = {}
    
    // Merge metadata
    const existingMetadata = (item.metadata as any) || {}
    if (body.metadata) {
        dataToUpdate.metadata = { ...existingMetadata, ...body.metadata }
    }

    if (body.status !== undefined) dataToUpdate.status = body.status
    if (body.responsible !== undefined) dataToUpdate.responsible = body.responsible
    if (body.dateActual) dataToUpdate.dateActual = new Date(body.dateActual)
    if (body.dateActualStart) dataToUpdate.dateActualStart = new Date(body.dateActualStart)

    // Lógica de Datas Planejadas
    if (body.datePlanned || body.datePlannedEnd) {
        const newStart = body.datePlanned ? new Date(body.datePlanned) : item.datePlanned
        const newEnd = body.datePlannedEnd ? new Date(body.datePlannedEnd) : item.datePlannedEnd

        if (newStart && newEnd) {
            dataToUpdate.datePlanned = newStart
            dataToUpdate.datePlannedEnd = newEnd
            
            // Recalcular duração baseada nas novas datas e calendário
            const newDuration = calculateDuration(newStart, newEnd, config)
            dataToUpdate.duration = newDuration
        }
    }
    
    // Permite atualização direta de duração (se passar via body, ex: input manual)
    // Se passar duration e start, calcula end.
    if (body.duration !== undefined && body.datePlanned) {
         const start = new Date(body.datePlanned)
         const end = calculateEndDate(start, Number(body.duration), config)
         dataToUpdate.duration = Number(body.duration)
         dataToUpdate.datePlanned = start
         dataToUpdate.datePlannedEnd = end
    }

    const updated = await prisma.projectItem.update({
      where: { id: itemId },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
  }
}
