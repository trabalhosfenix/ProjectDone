import { normalizeTaskStatus, type KanbanStatus } from '@/lib/task-status'

type JsonObject = Record<string, unknown>

export function toMetadataObject(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonObject
}

export function normalizeProgressValue(value: unknown): number | null {
  if (value === null || value === undefined) return null

  let numeric: number
  if (typeof value === 'number') {
    numeric = value
  } else if (typeof value === 'string') {
    const cleaned = value.replace('%', '').replace(',', '.').trim()
    numeric = Number(cleaned)
  } else {
    return null
  }

  if (!Number.isFinite(numeric)) return null
  if (numeric > 1) numeric = numeric / 100
  return Math.max(0, Math.min(1, numeric))
}

function hasOwnProgress(metadata: JsonObject): boolean {
  return Object.prototype.hasOwnProperty.call(metadata, 'progress')
}

export function syncStatusAndProgress(input: {
  currentStatus: string | null | undefined
  currentMetadata: unknown
  patchStatus?: string | null
  patchMetadata?: unknown
}) {
  const currentStatus = normalizeTaskStatus(input.currentStatus)
  const baseMetadata = toMetadataObject(input.currentMetadata)
  const patchMetadata = toMetadataObject(input.patchMetadata)
  const mergedMetadata: JsonObject = {
    ...baseMetadata,
    ...patchMetadata,
  }

  const explicitStatus = input.patchStatus === undefined ? undefined : normalizeTaskStatus(input.patchStatus)
  const progressProvided = hasOwnProgress(patchMetadata)
  const currentProgress = normalizeProgressValue(baseMetadata.progress)
  let nextProgress = normalizeProgressValue(mergedMetadata.progress)
  let nextStatus: KanbanStatus = explicitStatus ?? currentStatus

  if (explicitStatus !== undefined) {
    if (explicitStatus === 'Concluído') {
      nextProgress = 1
    } else if (!progressProvided) {
      if (explicitStatus === 'A iniciar') {
        nextProgress = 0
      } else if (currentProgress !== null && currentProgress >= 1) {
        nextProgress = 0
      }
    }
  } else if (progressProvided && nextProgress !== null) {
    if (nextProgress >= 1) {
      nextStatus = 'Concluído'
    } else if (nextProgress <= 0) {
      nextStatus = currentStatus === 'Concluído' ? 'A iniciar' : currentStatus
    } else if (currentStatus === 'A iniciar' || currentStatus === 'Concluído') {
      nextStatus = 'Em andamento'
    }
  }

  if (nextStatus === 'Concluído') {
    nextProgress = 1
  } else if (nextProgress !== null && nextProgress >= 1) {
    nextProgress = progressProvided ? 0.99 : 0
  }

  if (nextProgress !== null) {
    mergedMetadata.progress = nextProgress
  }

  return {
    status: nextStatus,
    metadata: mergedMetadata,
    progress: nextProgress,
  }
}
