import type { PriorityLevel } from '@prisma/client'

const PRIORITY_VALUES: PriorityLevel[] = ['BAIXA', 'MEDIA', 'ALTA']

function normalizeInput(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function toProjectItemPriorityLevel(value?: string | PriorityLevel | null): PriorityLevel {
  if (!value) return 'MEDIA'

  const raw = String(value).trim().toUpperCase()
  if ((PRIORITY_VALUES as readonly string[]).includes(raw)) {
    return raw as PriorityLevel
  }

  const normalized = normalizeInput(String(value))
  if (['baixa', 'low'].includes(normalized)) return 'BAIXA'
  if (['alta', 'high', 'critica', 'critical', 'urgente'].includes(normalized)) return 'ALTA'
  return 'MEDIA'
}

export function fromProjectItemPriorityLevel(value?: string | PriorityLevel | null): string {
  const normalized = toProjectItemPriorityLevel(value)
  if (normalized === 'ALTA') return 'Alta'
  if (normalized === 'BAIXA') return 'Baixa'
  return 'Média'
}
