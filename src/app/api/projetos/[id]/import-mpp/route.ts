import { NextRequest, NextResponse } from 'next/server'
import { MPP_API_BASE_URL } from '@/lib/mpp-api'

export const maxDuration = 300

/**
 * Endpoint legado mantido para compatibilidade com telas antigas:
 * POST /api/projetos/:id/import-mpp
 *
 * Agora delega 100% para a MPP Platform API (FastAPI + worker + MPXJ sidecar)
 * e não executa Java localmente no Next.js.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: legacyProjectId } = await params
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    // Encaminha para API SaaS de ingestão.
    // Incluímos legacyProjectId como contexto opcional para rastreabilidade,
    // sem acoplar o parser ao schema local do Next.js.
    const upstreamFormData = new FormData()
    upstreamFormData.append('file', file)
    upstreamFormData.append('legacy_project_id', legacyProjectId)

    const upstreamResponse = await fetch(`${MPP_API_BASE_URL}/v1/projects/import/mpp`, {
      method: 'POST',
      body: upstreamFormData,
      cache: 'no-store',
    })

    const body = await upstreamResponse.json()

    // Normaliza contrato para clientes antigos e novos.
    return NextResponse.json(
      {
        success: upstreamResponse.ok,
        ...body,
        job_id: body.job_id || body.jobId,
        project_id: body.project_id || body.projectId,
      },
      { status: upstreamResponse.status }
    )
  } catch (error) {
    console.error('Erro na integração de importação MPP:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao integrar com a MPP Platform API.',
      },
      { status: 500 }
    )
  }
}
