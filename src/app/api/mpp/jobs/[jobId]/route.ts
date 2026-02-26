import { NextResponse } from 'next/server'
import { getMppJob } from '@/lib/mpp-api'
import { AccessError, requireAuth } from '@/lib/access-control'

function extractProjectId(payload: Record<string, unknown>) {
  const direct = payload.project_id || payload.projectId
  if (direct) return String(direct)

  const nested = payload.result || payload.data
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>
    const nestedId = nestedRecord.project_id || nestedRecord.projectId
    if (nestedId) return String(nestedId)
  }

  return undefined
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { jobId } = await params
    const headerTenantId = request.headers.get('x-tenant-id') || undefined
    if (currentUser.tenantId && headerTenantId && currentUser.tenantId !== headerTenantId) {
      throw new AccessError('Tenant inválido', 403)
    }
    const tenantId = currentUser.tenantId || headerTenantId || undefined
    const job = await getMppJob(jobId, { tenantId })
    const payload = job && typeof job === 'object' ? (job as Record<string, unknown>) : {}

    return NextResponse.json({
      ...payload,
      job_id: String(payload.job_id || payload.jobId || jobId),
      project_id: extractProjectId(payload),
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao buscar job MPP:', error)
    return NextResponse.json({ error: 'Falha ao consultar status da importação' }, { status: 500 })
  }
}
