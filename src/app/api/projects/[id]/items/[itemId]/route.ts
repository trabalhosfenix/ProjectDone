import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateEndDate, calculateDuration, WorkCalendarConfig } from '@/lib/calendar-engine'
import { syncProjectProgress } from '@/lib/project-progress'
import { syncStatusAndProgress } from '@/lib/project-item-flow'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const { user } = await requireProjectAccess(id)
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
    if (item.projectId !== id) {
      return NextResponse.json({ success: false, error: 'Item não pertence ao projeto informado' }, { status: 403 })
    }
    if (user.tenantId && item.tenantId && item.tenantId !== user.tenantId) {
      return NextResponse.json({ success: false, error: 'Acesso negado ao tenant' }, { status: 403 })
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

    const shouldSyncFlow = body.status !== undefined || body.metadata !== undefined
    if (shouldSyncFlow) {
      const flow = syncStatusAndProgress({
        currentStatus: item.status,
        currentMetadata: item.metadata,
        patchStatus: body.status,
        patchMetadata: body.metadata,
      })

      dataToUpdate.status = flow.status
      dataToUpdate.metadata = flow.metadata

      if (flow.status === 'Em andamento' && !item.dateActualStart && body.dateActualStart === undefined) {
        dataToUpdate.dateActualStart = new Date()
      }

      if (flow.status === 'Concluído' && !item.dateActual && body.dateActual === undefined) {
        dataToUpdate.dateActual = new Date()
      }

      if (flow.status !== 'Concluído' && item.dateActual && body.dateActual === undefined) {
        dataToUpdate.dateActual = null
      }
    }

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
    
    // Permite atualização direta de duração (manual)
    // Se vier duração, recalcula fim usando start informado ou start atual do item.
    if (body.duration !== undefined) {
         const startSource = body.datePlanned || item.datePlanned
         if (startSource) {
           const start = new Date(startSource)
           const end = calculateEndDate(start, Number(body.duration), config)
           dataToUpdate.duration = Number(body.duration)
           dataToUpdate.datePlanned = start
           dataToUpdate.datePlannedEnd = end
         }
    }

    const updated = await prisma.projectItem.update({
      where: { id: itemId },
      data: dataToUpdate
    })
    await syncProjectProgress(id)

    revalidatePath(`/dashboard/projetos/${id}/cronograma`)
    revalidatePath(`/dashboard/projetos/${id}/gantt`)
    revalidatePath(`/dashboard/projetos/${id}/kanban`)
    revalidatePath(`/dashboard/projetos/${id}/acompanhamento/kanban`)
    revalidatePath(`/dashboard/projetos/${id}/situacao`)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao atualizar item:', error)
    return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
  }
}
