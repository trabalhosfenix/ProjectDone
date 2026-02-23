export const MPP_API_BASE_URL = process.env.MPP_API_BASE_URL || 'http://localhost:8000'
export const MPP_TENANT_ID = process.env.MPP_TENANT_ID || ''
export const MPP_GANTT_TIMEOUT_MS = Number(process.env.MPP_GANTT_TIMEOUT_MS || '120000')

const DEFAULT_MPP_API_BASE_URLS = [
  'http://mpp-api:8000',
  'http://host.docker.internal:8000',
  'http://localhost:8000',
]

interface MppRawFetchOptions {
  timeoutMs?: number
}

interface MppRequestOptions extends MppRawFetchOptions {
  tenantId?: string
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

function withMppHeaders(headersInit?: HeadersInit, tenantId?: string) {
  const headers = new Headers(headersInit)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const resolvedTenantId = tenantId || MPP_TENANT_ID
  if (!headers.has('x-tenant-id') && resolvedTenantId) {
    headers.set('x-tenant-id', resolvedTenantId)
  }

  return headers
}

export async function mppFetchRaw(
  path: string,
  init?: RequestInit,
  options?: MppRequestOptions
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
        headers: withMppHeaders(init?.headers, options?.tenantId),
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

async function mppFetch<T>(path: string, init?: RequestInit, options?: MppRequestOptions): Promise<T> {
  const response = await mppFetchRaw(path, init, options)

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

type MppTasksResponse = {
  items?: MppTask[]
  data?: MppTask[]
  total?: number
  count?: number
  page?: number
  pageSize?: number
  page_size?: number
  per_page?: number
  hasNext?: boolean
  has_next?: boolean
  nextPage?: number | null
  next_page?: number | null
  next?: string | null
}

function normalizeMppTasks(data: MppTask[], projectId: string) {
  return data.map((task) => ({
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

function hasExplicitPagination(searchParams?: URLSearchParams) {
  if (!searchParams) return false
  return ['page', 'pageSize', 'page_size', 'per_page', 'limit', 'offset', 'cursor'].some((key) => searchParams.has(key))
}

export async function getMppTasks(
  projectId: string,
  searchParams?: URLSearchParams,
  options?: MppRequestOptions
) {
  const baseParams = new URLSearchParams(searchParams?.toString() || '')
  const explicitPagination = hasExplicitPagination(searchParams)

  if (explicitPagination) {
    const query = baseParams.toString()
    const data = await mppFetch<MppTasksResponse>(
      `/v1/projects/${projectId}/tasks${query ? `?${query}` : ''}`,
      undefined,
      options
    )
    return normalizeMppTasks(data.items || data.data || [], projectId)
  }

  const pageSize = Number(baseParams.get('pageSize') || baseParams.get('page_size') || baseParams.get('per_page') || baseParams.get('limit') || '200')
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 1000) : 200

  const tasksById = new Map<string, MppTask>()
  const seenPageSignatures = new Set<string>()
  const maxPages = 200

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams(baseParams.toString())
    params.set('page', String(page))
    params.set('pageSize', String(safePageSize))
    params.set('page_size', String(safePageSize))
    params.set('per_page', String(safePageSize))

    const data = await mppFetch<MppTasksResponse>(`/v1/projects/${projectId}/tasks?${params.toString()}`, undefined, options)
    const pageTasks = data.items || data.data || []

    const signature = `${pageTasks.length}:${String(pageTasks[0]?.id || pageTasks[0]?.uid || '')}:${String(pageTasks[pageTasks.length - 1]?.id || pageTasks[pageTasks.length - 1]?.uid || '')}`
    if (seenPageSignatures.has(signature) && page > 1) {
      break
    }
    seenPageSignatures.add(signature)

    for (const task of pageTasks) {
      const key = String(task.id || task.uid || crypto.randomUUID())
      if (!tasksById.has(key)) tasksById.set(key, task)
    }

    const totalFromApi = Number(data.total ?? data.count)
    const totalKnown = Number.isFinite(totalFromApi) && totalFromApi > 0 ? totalFromApi : undefined
    const hasNext = Boolean(data.hasNext || data.has_next || data.nextPage || data.next_page || data.next)

    if (hasNext) continue
    if (totalKnown && tasksById.size >= totalKnown) break
    if (pageTasks.length < safePageSize) break
  }

  return normalizeMppTasks(Array.from(tasksById.values()), projectId)
}

export async function getMppGantt(projectId: string, options?: MppRequestOptions) {
  return mppFetch<Record<string, unknown>>(
    `/v1/projects/${projectId}/gantt`,
    undefined,
    { ...options, timeoutMs: options?.timeoutMs ?? MPP_GANTT_TIMEOUT_MS }
  )
}

export async function getMppJob(jobId: string, options?: MppRequestOptions) {
  return mppFetch<Record<string, unknown>>(`/v1/jobs/${jobId}`, undefined, options)
}
