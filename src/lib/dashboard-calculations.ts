/* eslint-disable @typescript-eslint/no-explicit-any */
import { startOfDay, isSameDay, addDays, differenceInDays, min, max, format } from "date-fns";

export function calculateDashboardStats(items: any[]) {
    const total = items.length;
    const completedItems = items.filter((i: any) => i.status === "Keyuser - Concluído");
    const completed = completedItems.length;
    
    // Status Logic mirroring the original action
    const pending = items.filter((i: any) => i.status === "Keyuser - Pendente" || i.status === "Keyuser - Aguardando tarefa precedente").length;
    const blocked = items.filter((i: any) => i.status === "Keyuser - Com problemas").length;
    
    // Financials
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

    const realCompleted = items.filter((i: any) => i.dateActual).length
    const realPercentage = total > 0 ? Math.round((realCompleted / total) * 100) : 0

    const datedItems = items.filter((i: any) => i.datePlanned || i.dateActual)
    const allDates = datedItems.flatMap((i: any) => [i.datePlanned, i.dateActual]).filter(Boolean).map((d: any) => new Date(d))
    const totalDurationDays = allDates.length > 0 ? differenceInDays(max(allDates), min(allDates)) + 1 : 0

    const allocatedResources = new Set(items.map((i: any) => i.responsible).filter(Boolean)).size

    return {
      total,
      completed,
      pending,
      blocked,
      metaDoDia,
      progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      spi: Number(spi.toFixed(2)),
      cpi: Number(cpi.toFixed(2)),
      realPercentage,
      totalDurationDays,
      allocatedResources,
      totalRisks: 0,
      openIssues: 0
    };
}

export function calculateCurvaS(items: any[], _importedTimeline?: any[]) {
    const validItems = items.filter(i => i.datePlanned || i.dateActual);
    if (validItems.length === 0) return [];

    const dates = validItems.flatMap(i => [i.datePlanned, i.dateActual]).filter(Boolean).map(d => new Date(d!));
    if (dates.length === 0) return [];

    const startDate = min(dates);
    const endDate = max(dates);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    
    // O(N) Initialization
    const plannedByDay = new Array(totalDays).fill(0);
    const actualByDay = new Array(totalDays).fill(0);
    const startTs = startOfDay(startDate).getTime();

    // O(M) Pass over Items
    validItems.forEach(item => {
        if (item.datePlanned) {
            const dayIndex = differenceInDays(new Date(item.datePlanned), startDate);
            if (dayIndex >= 0 && dayIndex < totalDays) {
                plannedByDay[dayIndex]++; 
            }
        }
        if (item.dateActual) {
            const dayIndex = differenceInDays(new Date(item.dateActual), startDate);
            if (dayIndex >= 0 && dayIndex < totalDays) {
                actualByDay[dayIndex]++;
            }
        }
    });

    // O(D) Accumulation Pass
    const result = [];
    let runningPlanned = 0;
    let runningActual = 0;
    const totalItems = items.length || 1; // Avoid division by zero

    for (let i = 0; i < totalDays; i++) {
        runningPlanned += plannedByDay[i];
        runningActual += actualByDay[i];

        result.push({
            name: format(addDays(startDate, i), "dd/MM"),
            planejado: Math.round((runningPlanned / totalItems) * 100),
            realizado: Math.round((runningActual / totalItems) * 100)
        });
    }

    return result;
}

export function calculateMultiProjectMetrics(projects: any[]) {
    const total = Array.isArray(projects) ? projects.length : 0

    // Tentativa de mapear alguns campos comuns se existirem
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}

    if (Array.isArray(projects)) {
        for (const p of projects) {
            const status = (p?.status || "Desconhecido") as string
            byStatus[status] = (byStatus[status] || 0) + 1

            const type = (p?.type || "Geral") as string
            byType[type] = (byType[type] || 0) + 1
        }
    }

    return {
        totalProjects: total,
        byStatus,
        byType,
    }
}
