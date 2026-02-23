"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format, eachDayOfInterval, min, max, isBefore, isSameDay } from "date-fns";
import { buildProjectScope, requireAuth } from "@/lib/access-control";

export async function getDashboardStats() {
  try {
    const currentUser = await requireAuth()
    const isAdmin = currentUser.role === "ADMIN"
    const projectScope = buildProjectScope(currentUser)
    const items = await prisma.projectItem.findMany({
      where: isAdmin
        ? (currentUser.tenantId ? { tenantId: currentUser.tenantId } : undefined)
        : {
            ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
            project: { is: projectScope },
          },
    });
    
    const total = items.length;
    const completedItems = items.filter((i: any) => i.status === "Keyuser - Concluído");
    const completed = completedItems.length;
    const pending = items.filter((i: any) => i.status === "Keyuser - Pendente" || i.status === "Keyuser - Aguardando tarefa precedente").length;
    const blocked = items.filter((i: any) => i.status === "Keyuser - Com problemas").length;
    
    // Cálculos SPI / CPI
    // SPI = EV / PV (Earned Value / Planned Value)
    // CPI = EV / AC (Earned Value / Actual Cost)
    // Simulação simplificada se os campos estiverem vazios: 
    // EV (Earned Value) = Soma do PV das tarefas concluídas
    const totalPV = items.reduce((acc: number, i: any) => acc + (Number(i.plannedValue) || 100), 0);
    const totalEV = items.reduce((acc: number, i: any) => {
      const isDone = i.status === "Keyuser - Concluído";
      return acc + (isDone ? (Number(i.plannedValue) || 100) : 0);
    }, 0);
    const totalAC = items.reduce((acc: number, i: any) => acc + (Number(i.actualCost) || 0), 0);

    const spi = totalPV > 0 ? totalEV / totalPV : 1;
    const cpi = totalAC > 0 ? totalEV / totalAC : 1;

    // Meta do dia
    const today = startOfDay(new Date());
    const metaDoDia = items.filter((i: any) => i.datePlanned && isSameDay(new Date(i.datePlanned), today)).length;

    return {
      total,
      completed,
      pending,
      blocked,
      metaDoDia,
      progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      spi: Number(spi.toFixed(2)),
      cpi: Number(cpi.toFixed(2))
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { total: 0, completed: 0, pending: 0, blocked: 0, metaDoDia: 0, progressPercentage: 0 };
  }
}

export async function getCurvaSData() {
  try {
    const currentUser = await requireAuth()
    const isAdmin = currentUser.role === "ADMIN"
    const projectScope = buildProjectScope(currentUser)
    const items = await prisma.projectItem.findMany({
      where: isAdmin
        ? {
            ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
            OR: [{ datePlanned: { not: null } }, { dateActual: { not: null } }],
          }
        : {
            ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
            project: { is: projectScope },
            OR: [{ datePlanned: { not: null } }, { dateActual: { not: null } }],
          },
      orderBy: { datePlanned: "asc" }
    });

    if (items.length === 0) return [];

    // Encontrar intervalo de datas
    const datesPlanned = items.map((i: any) => i.datePlanned).filter(Boolean) as Date[];
    const startDate = min(datesPlanned);
    const endDate = max(datesPlanned);

    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    
    let cumulativePlanned = 0;
    let cumulativeActual = 0;
    const totalItems = items.length;

    return interval.map(day => {
      const dayStr = format(day, "dd/MM");
      
      // Quantas deveriam estar prontas até hoje?
      const plannedByToday = items.filter((i: any) => i.datePlanned && (isBefore(new Date(i.datePlanned), day) || isSameDay(new Date(i.datePlanned), day))).length;
      
      // Quantas foram concluídas até hoje?
      const actualByToday = items.filter((i: any) => i.dateActual && (isBefore(new Date(i.dateActual), day) || isSameDay(new Date(i.dateActual), day))).length;

      return {
        name: dayStr,
        planejado: Math.round((plannedByToday / totalItems) * 100),
        realizado: Math.round((actualByToday / totalItems) * 100)
      };
    });
  } catch (error) {
    console.error("Error fetching Curva S data:", error);
    return [];
  }
}

export async function getRecentActivities() {
  try {
    const currentUser = await requireAuth()
    const isAdmin = currentUser.role === "ADMIN"
    const projectScope = buildProjectScope(currentUser)
    return await prisma.auditLog.findMany({
      where: isAdmin
        ? (currentUser.tenantId
            ? {
                projectItem: {
                  is: { tenantId: currentUser.tenantId },
                },
              }
            : undefined)
        : {
            projectItem: {
              is: {
                ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
                project: { is: projectScope },
              },
            },
          },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        projectItem: {
          select: { task: true }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}
