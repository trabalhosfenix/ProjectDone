'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// --- Calendários ---

export async function getCalendars() {
  try {
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
    revalidatePath('/dashboard/sistema/calendarios')
    return { success: true, data: calendar }
  } catch (error) {
    console.error('Erro ao atualizar calendário:', error)
    return { success: false, error: 'Erro ao atualizar calendário' }
  }
}

export async function deleteCalendar(id: string) {
  try {
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
    const holiday = await prisma.calendarHoliday.create({
      data: {
        calendarId,
        ...data
      }
    })
    revalidatePath(`/dashboard/sistema/calendarios/${calendarId}`)
    return { success: true, data: holiday }
  } catch (error) {
    console.error('Erro ao adicionar feriado:', error)
    return { success: false, error: 'Erro ao adicionar feriado' }
  }
}

export async function deleteHoliday(id: string) {
  try {
    // Buscar calendarId para revalidate
    const holiday = await prisma.calendarHoliday.findUnique({
      where: { id },
      select: { calendarId: true }
    })

    await prisma.calendarHoliday.delete({
      where: { id }
    })
    
    if (holiday) {
        revalidatePath(`/dashboard/sistema/calendarios/${holiday.calendarId}`)
    }
    return { success: true }
  } catch (error) {
    console.error('Erro ao remover feriado:', error)
    return { success: false, error: 'Erro ao remover feriado' }
  }
}
