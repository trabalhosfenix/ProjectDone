"use server";

import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireAuth } from "@/lib/access-control";

export async function getResourceAllocation(weekStart: Date = new Date()) {
  try {
    const currentUser = await requireAuth();
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const end = endOfWeek(weekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const items = await prisma.projectItem.findMany({
      where: {
        ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
        responsible: { not: null },
        datePlanned: {
          gte: start,
          lte: end
        }
      }
    });

    // Agrupar por responsável
    const responsibles = Array.from(new Set(items.map(i => i.responsible))).filter(Boolean) as string[];

    const allocationData = responsibles.map(person => {
      const personItems = items.filter(i => i.responsible === person);
      
      const dailyStats = days.slice(0, 5).map(day => {
        const tasksOnDay = personItems.filter(i => i.datePlanned && isSameDay(new Date(i.datePlanned), day));
        
        // Simulação: Cada tarefa ocupa 2 horas ou 25% de um dia de 8h
        const totalHours = tasksOnDay.length * 2;
        const percentage = (totalHours / 8) * 100;

        return {
          day: format(day, "yyyy-MM-dd"),
          label: format(day, "EEEE - dd/MM", { locale: ptBR }),
          tasks: tasksOnDay.map(t => ({ id: t.id, task: t.task })),
          hours: totalHours,
          percentage: percentage
        };
      });

      return {
        responsible: person,
        dailyStats
      };
    });

    return {
      days: days.slice(0, 5).map(d => ({
        date: format(d, "yyyy-MM-dd"),
        label: format(d, "EEEE - dd/MM", { locale: ptBR })
      })),
      allocationData
    };
  } catch (error) {
    console.error("Error fetching resource allocation:", error);
    return { days: [], allocationData: [] };
  }
}
