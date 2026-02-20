export const MPP_API_BASE_URL = process.env.MPP_API_BASE_URL || 'http://localhost:8000'

const DEFAULT_MPP_API_BASE_URLS = [
  'http://mpp-api:8000',
  'http://host.docker.internal:8000',
  'http://localhost:8000',
]

interface MppRawFetchOptions {
  timeoutMs?: number
}

export function getMppApiBaseUrls(): string[] {
  const explicitList = (process.env.MPP_API_BASE_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  const candidates = [
    ...explicitList,
    MPP_API_BASE_URL,
    ...DEFAULT_MPP_API_BASE_URLS,
  ]

  return Array.from(new Set(candidates.map((url) => url.replace(/\/$/, ''))))
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

export async function mppFetchRaw(
  path: string,
  init?: RequestInit,
  options?: MppRawFetchOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? 30_000
  const baseUrls = getMppApiBaseUrls()
  const errors: string[] = []

  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}${path}`
    const { signal, clear } = withTimeoutSignal(timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal,
        cache: 'no-store',
      })
      clear()
      return response
    } catch (error) {
      clear()
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${baseUrl}: ${message}`)
    }
  }

  throw new Error(`MPP API indisponível. Tentativas: ${errors.join(' | ')}`)
}

async function mppFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await mppFetchRaw(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MPP API ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}

export interface MppTask {
  id: string
  uid?: string | number
  name?: string
  task?: string
  wbs?: string
  start?: string
  finish?: string
  datePlanned?: string
  datePlannedEnd?: string
  percent_complete?: number
  status?: string
  responsible?: string
  predecessors?: string
  duration?: number
}

export async function getMppTasks(projectId: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString()
  const data = await mppFetch<{ items?: MppTask[]; data?: MppTask[] }>(
    `/v1/projects/${projectId}/tasks${query ? `?${query}` : ''}`
  )

  const tasks = data.items || data.data || []
  return tasks.map((task) => ({
    id: String(task.id || task.uid || crypto.randomUUID()),
    projectId,
    task: task.task || task.name || 'Sem nome',
    wbs: task.wbs,
    datePlanned: task.datePlanned || task.start,
    datePlannedEnd: task.datePlannedEnd || task.finish,
    status: task.status,
    responsible: task.responsible,
    metadata: {
      progress:
        typeof task.percent_complete === 'number'
          ? task.percent_complete > 1
            ? task.percent_complete / 100
            : task.percent_complete
          : 0,
      predecessors: task.predecessors || '',
      duration: task.duration || undefined,
    },
  }))
}

export async function getMppGantt(projectId: string) {
  return mppFetch<Record<string, unknown>>(`/v1/projects/${projectId}/gantt`)
}

export async function getMppJob(jobId: string) {
  return mppFetch<Record<string, unknown>>(`/v1/jobs/${jobId}`)
}
