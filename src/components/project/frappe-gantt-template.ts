export type FrappeTemplateDensity = 'compact' | 'comfortable'
export type FrappeTemplateMode = 'default' | 'executive' | 'planning'

export interface FrappeTemplateConfig {
  barHeight: number
  padding: number
  columnWidth: Record<'Day' | 'Week' | 'Month' | 'Year', number>
  shellClassName: string
}

const baseShell = 'gantt-shell h-full'

const byMode: Record<FrappeTemplateMode, Omit<FrappeTemplateConfig, 'barHeight' | 'padding'>> = {
  default: {
    columnWidth: { Day: 36, Week: 48, Month: 120, Year: 220 },
    shellClassName: `${baseShell} gantt-template-default`,
  },
  executive: {
    columnWidth: { Day: 40, Week: 56, Month: 132, Year: 240 },
    shellClassName: `${baseShell} gantt-template-executive`,
  },
  planning: {
    columnWidth: { Day: 34, Week: 46, Month: 116, Year: 210 },
    shellClassName: `${baseShell} gantt-template-planning`,
  },
}

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

export function getFrappeGanttTemplate(mode: FrappeTemplateMode, density: FrappeTemplateDensity): FrappeTemplateConfig {
  return {
    ...byMode[mode],
    ...byDensity[density],
  }
}
