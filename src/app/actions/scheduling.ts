'use server'

import { prisma } from '@/lib/prisma'
import { addBusinessDays, isWeekendDay } from '@/lib/date-utils'
import { revalidatePath } from 'next/cache'

export async function recalculateProjectSchedule(projectId: string) {
  try {
    // 1. Fetch all items ordered by WBS (Logical Order)
    const items = await prisma.projectItem.findMany({
      where: { projectId },
      orderBy: [
        { wbs: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    if (items.length === 0) return { success: true }

    // 2. Map items to "Row IDs" (1-based index) for Excel-like referencing
    // Map ID -> Index
    // Map Index -> Item
    const itemMap = new Map<string, any>()
    const indexMap = new Map<number, any>()
    
    items.forEach((item, idx) => {
        itemMap.set(item.id, item)
        indexMap.set(idx + 1, item) // 1-based index
    })

    // 3. Dependency Graph & Date Calculation
    // Since we need to propagate dates, we can't just iterate once if dependencies point forward (rare but possible).
    // However, usually dependencies point backward (Predecessors).
    // Start with the first task.
    
    // We will do a topological sort approach implicitly by iterating?
    // Or just "Change propagation".
    // Let's build a graph of successors to propagate changes efficiently?
    // Or simpler: Iterate multiple times until convergence or max iterations (to avoid cycles).
    
    const updates: Map<string, { start: Date, end: Date, duration: number }> = new Map()
    
    // Initialize dates from DB
    const state = new Map<string, { start: Date, end: Date, duration: number }>()
    items.forEach(item => {
        state.set(item.id, {
            start: item.datePlanned || new Date(),
            end: item.datePlannedEnd || item.datePlanned || new Date(),
            duration: (item.metadata as any)?.duration ? parseFloat((item.metadata as any).duration) : 1
        })
    })

    let changed = true
    let iterations = 0
    const MAX_ITERATIONS = items.length + 5 // Safety break

    while (changed && iterations < MAX_ITERATIONS) {
        changed = false
        iterations++

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const meta = item.metadata as any || {}
            const predString = meta.predecessors as string // e.g. "2, 3"

            if (!predString) continue

            // Parse predecessors
            const preds = predString.split(/[;,]/).map(s => s.trim()).filter(Boolean)
            
            // Calculate Constraint Date (Max(Predecessor.End))
            // Default start is Project Start (or keep current if no preds)
            // But if dependencies exist, they drive the start date.
            
            let maxPredEnd: Date | null = null
            
            for (const p of preds) {
                // Try to parse number
                const rowId = parseInt(p)
                if (!isNaN(rowId)) {
                    const predItem = indexMap.get(rowId)
                    if (predItem) {
                        const predState = state.get(predItem.id)
                        if (predState) {
                             if (!maxPredEnd || predState.end > maxPredEnd) {
                                 maxPredEnd = new Date(predState.end)
                             }
                        }
                    }
                }
            }

            if (maxPredEnd) {
                // Determine new Start Date = Next Business Day after MaxPredEnd?
                // Or same day? 
                // FS (Finish to Start): Start = Finish + 1 day (roughly).
                // Or strict time: Finish 5pm -> Start next day 8am.
                // date-utils `addBusinessDays(maxPredEnd, 1)`?
                // If maxPredEnd is Friday, Start is Monday.
                
                // Let's assume FS with 0 lag means "Start Next Working Day".
                const newStart = addBusinessDays(maxPredEnd, 1) 
                
                // Compare with current state
                const currentState = state.get(item.id)!
                if (newStart.getTime() !== currentState.start.getTime()) {
                    // Update Start
                    currentState.start = newStart
                    // Recalculate End based on Duration
                    // End = Start + Duration
                    // But `addBusinessDays` logic:
                    // If Duration = 1 day, Start=Mon, End=Mon?
                    // Let's assume standard: End = Start + DurationDays - 1 (Inclusive)?
                    // Or pure add: End = Start + Duration (Exclusive).
                    // If Duration is stored as "days", usually 1 day = 8h work.
                    // Let's use `addBusinessDays(start, duration)` which effectively adds days.
                    // If Start=Mon, Duration=1 -> End=Tue? 
                    // Let's try to match User Expectation: "Inicio: 29/01, Termino: 10/04".
                    // Let's use `addBusinessDays(start, duration)`.
                    
                    currentState.end = addBusinessDays(newStart, currentState.duration)
                    
                    state.set(item.id, currentState)
                    updates.set(item.id, currentState)
                    changed = true
                }
            }
        }
    }

    // 4. Batch Update DB
    if (updates.size > 0) {
        const promises = Array.from(updates.entries()).map(([id, data]) => {
            return prisma.projectItem.update({
                where: { id },
                data: {
                    datePlanned: data.start,
                    datePlannedEnd: data.end,
                    // Note: We update 'planned' dates. 'Actual' dates are user input for tracking.
                    // But if this is a Plan, we update Planned.
                }
            })
        })
        
        await Promise.all(promises)
        
        // Find Project ID to revalidate
        revalidatePath(`/dashboard/projetos/${projectId}/cronograma`)
    }

    return { success: true, updates: updates.size }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao recalcular cronograma' }
  }
}
