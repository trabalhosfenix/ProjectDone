export const MPP_API_BASE_URL = process.env.MPP_API_BASE_URL || 'http://localhost:8000'

async function mppFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MPP_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
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
      progress: task.percent_complete ?? 0,
    },
  }))
}

export async function getMppGantt(projectId: string) {
  return mppFetch<Record<string, unknown>>(`/v1/projects/${projectId}/gantt`)
}

export async function getMppJob(jobId: string) {
  return mppFetch<Record<string, unknown>>(`/v1/jobs/${jobId}`)
}
