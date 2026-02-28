export type FrappeTemplateDensity = 'compact' | 'comfortable'
export type FrappeTemplateMode = 'default' | 'executive' | 'planning'
export type FrappeViewMode = 'Day' | 'Week' | 'Month' | 'Year'

export interface FrappeTemplateConfig {
  barHeight: number
  padding: number
  columnWidth: Record<FrappeViewMode, number>
  shellClassName: string
}

export const FRAPPE_TEMPLATE_OPTIONS: Array<{ value: FrappeTemplateMode; label: string }> = [
  { value: 'default', label: 'Template padrão' },
  { value: 'executive', label: 'Template executivo' },
  { value: 'planning', label: 'Template planejamento' },
]

export const FRAPPE_DENSITY_OPTIONS: Array<{ value: FrappeTemplateDensity; label: string }> = [
  { value: 'compact', label: 'Compacto' },
  { value: 'comfortable', label: 'Confortável' },
]

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
