'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/access-control'
import { recalculateProjectSchedule } from '@/app/actions/scheduling'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

async function canManageCalendars() {
  const user = await requireAuth()
  const allowed = user.role === 'ADMIN' || await hasPermission(user.id, PERMISSIONS.MANAGE_REGISTERS)
  return { user, allowed }
}

async function recalculateProjectsUsingCalendar(calendarId: string, tenantId: string | null) {
  const projects = await prisma.project.findMany({
    where: {
      workCalendarId: calendarId,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  })

  await Promise.all(projects.map((project) => recalculateProjectSchedule(project.id)))
  return projects.length
}

// --- Calendários ---

export async function getCalendars() {
  try {
    await requireAuth()
    const calendars = await prisma.workCalendar.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { holidays: true, projects: true }
        }
      }
    })
    return { success: true, data: calendars }
  } catch (error) {
    console.error('Erro ao buscar calendários:', error)
    return { success: false, error: 'Erro ao buscar calendários' }
  }
}

export async function getCalendar(id: string) {
  try {
    await requireAuth()
    const calendar = await prisma.workCalendar.findUnique({
      where: { id },
      include: {
        holidays: {
          orderBy: { date: 'asc' }
        }
      }
    })
    return { success: true, data: calendar }
  } catch (error) {
    console.error('Erro ao buscar calendário:', error)
    return { success: false, error: 'Erro ao buscar calendário' }
  }
}

export async function createCalendar(data: {
  name: string
  type: string
  workHoursPerDay: number
  description?: string
}) {
  try {
    const { allowed } = await canManageCalendars()
    if (!allowed) return { success: false, error: 'Sem permissão para criar calendário' }
    const calendar = await prisma.workCalendar.create({
      data
    })
    revalidatePath('/dashboard/sistema/calendarios')
    return { success: true, data: calendar }
  } catch (error) {
    console.error('Erro ao criar calendário:', error)
    return { success: false, error: 'Erro ao criar calendário' }
  }
}

export async function updateCalendar(id: string, data: {
  name?: string
  type?: string
  workHoursPerDay?: number
  description?: string
  isDefault?: boolean
}) {
  try {
    const { user, allowed } = await canManageCalendars()
    if (!allowed) return { success: false, error: 'Sem permissão para atualizar calendário' }
    // Se for marcar como default, desmarcar outros
    if (data.isDefault) {
      await prisma.workCalendar.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false }
      })
    }

    const calendar = await prisma.workCalendar.update({
      where: { id },
      data
    })
    const recalculated = await recalculateProjectsUsingCalendar(id, user.tenantId)
    revalidatePath('/dashboard/sistema/calendarios')
    return { success: true, data: calendar, recalculated }
  } catch (error) {
    console.error('Erro ao atualizar calendário:', error)
    return { success: false, error: 'Erro ao atualizar calendário' }
  }
}

export async function deleteCalendar(id: string) {
  try {
    const { user, allowed } = await canManageCalendars()
    if (!allowed) return { success: false, error: 'Sem permissão para excluir calendário' }

    const linkedProjects = await prisma.project.count({
      where: {
        workCalendarId: id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
    })

    if (linkedProjects > 0) {
      return { success: false, error: `Não é possível excluir calendário vinculado a ${linkedProjects} projeto(s)` }
    }

    await prisma.workCalendar.delete({
      where: { id }
    })
    revalidatePath('/dashboard/sistema/calendarios')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar calendário:', error)
    return { success: false, error: 'Erro ao deletar calendário' }
  }
}

// --- Feriados ---

export async function addHoliday(calendarId: string, data: {
  name: string
  date: Date
  recurring?: boolean
}) {
  try {
    const { user, allowed } = await canManageCalendars()
    if (!allowed) return { success: false, error: 'Sem permissão para adicionar feriado' }
    const holiday = await prisma.calendarHoliday.create({
      data: {
        calendarId,
        ...data
      }
    })
    const recalculated = await recalculateProjectsUsingCalendar(calendarId, user.tenantId)
    revalidatePath(`/dashboard/sistema/calendarios/${calendarId}`)
    return { success: true, data: holiday, recalculated }
  } catch (error) {
    console.error('Erro ao adicionar feriado:', error)
    return { success: false, error: 'Erro ao adicionar feriado' }
  }
}

export async function deleteHoliday(id: string) {
  try {
    const { user, allowed } = await canManageCalendars()
    if (!allowed) return { success: false, error: 'Sem permissão para remover feriado' }
    // Buscar calendarId para revalidate
    const holiday = await prisma.calendarHoliday.findUnique({
      where: { id },
      select: { calendarId: true }
    })

    await prisma.calendarHoliday.delete({
      where: { id }
    })
    
    if (holiday) {
        const recalculated = await recalculateProjectsUsingCalendar(holiday.calendarId, user.tenantId)
        revalidatePath(`/dashboard/sistema/calendarios/${holiday.calendarId}`)
        return { success: true, recalculated }
    }
    return { success: true, recalculated: 0 }
  } catch (error) {
    console.error('Erro ao remover feriado:', error)
    return { success: false, error: 'Erro ao remover feriado' }
  }
}
