export const KANBAN_STATUS = ['A iniciar', 'Em andamento', 'Em espera', 'Concluído'] as const

export type KanbanStatus = (typeof KANBAN_STATUS)[number]

const STATUS_ALIASES: Record<string, KanbanStatus> = {
  'a iniciar': 'A iniciar',
  'a fazer': 'A iniciar',
  'nao iniciado': 'A iniciar',
  'não iniciado': 'A iniciar',
  'to do': 'A iniciar',
  'open': 'A iniciar',

  'em andamento': 'Em andamento',
  andamento: 'Em andamento',
  doing: 'Em andamento',
  'in progress': 'Em andamento',
  progress: 'Em andamento',

  'em espera': 'Em espera',
  blocked: 'Em espera',
  wait: 'Em espera',
  waiting: 'Em espera',
  atraso: 'Em espera',
  atrasado: 'Em espera',
  delay: 'Em espera',
  pausado: 'Em espera',

  'concluído': 'Concluído',
  concluido: 'Concluído',
  done: 'Concluído',
  completed: 'Concluído',
  success: 'Concluído',
}

export function normalizeTaskStatus(raw?: string | null): KanbanStatus {
  const value = String(raw || '').trim().toLowerCase()
  if (!value) return 'A iniciar'

  if (STATUS_ALIASES[value]) return STATUS_ALIASES[value]

  if (value.includes('concl') || value.includes('done') || value.includes('completed')) return 'Concluído'
  if (value.includes('andamento') || value.includes('progress') || value.includes('doing')) return 'Em andamento'
  if (value.includes('wait') || value.includes('atras') || value.includes('delay') || value.includes('block')) return 'Em espera'

  return 'A iniciar'
}

export function isDoneStatus(raw?: string | null): boolean {
  return normalizeTaskStatus(raw) === 'Concluído'
}
