export type FrappeTemplateDensity = 'compact' | 'comfortable'
export type FrappeViewMode = 'Day' | 'Week' | 'Month' | 'Year'

export interface FrappeTemplateConfig {
  barHeight: number
  padding: number
  columnWidth: Record<FrappeViewMode, number>
  shellClassName: string
}

export const FRAPPE_DENSITY_OPTIONS: Array<{ value: FrappeTemplateDensity; label: string }> = [
  { value: 'compact', label: 'Compacto' },
  { value: 'comfortable', label: 'Confortável' },
]

const baseShell = 'gantt-shell h-full'
const baseColumnWidth: Record<FrappeViewMode, number> = { Day: 36, Week: 88, Month: 120, Year: 220 }

const byDensity: Record<FrappeTemplateDensity, Pick<FrappeTemplateConfig, 'barHeight' | 'padding'>> = {
  compact: {
    barHeight: 18,
    padding: 14,
  },
  comfortable: {
    barHeight: 20,
    padding: 18,
  },
}

export function getFrappeGanttTemplate(density: FrappeTemplateDensity): FrappeTemplateConfig {
  return {
    columnWidth: baseColumnWidth,
    shellClassName: baseShell,
    ...byDensity[density],
  }
}
