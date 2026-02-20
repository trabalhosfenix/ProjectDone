import { NextResponse } from 'next/server'
import { getMppJob } from '@/lib/mpp-api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const tenantId = request.headers.get('x-tenant-id') || undefined
    const job = await getMppJob(jobId, { tenantId })
    const payload = job && typeof job === 'object' ? (job as Record<string, unknown>) : {}

    return NextResponse.json({
      ...payload,
      job_id: String(payload.job_id || payload.jobId || jobId),
      project_id: payload.project_id || payload.projectId,
    })
  } catch (error) {
    console.error('Erro ao buscar job MPP:', error)
    return NextResponse.json({ error: 'Falha ao consultar status da importação' }, { status: 500 })
  }
}
