import { NextResponse } from 'next/server'
import { getMppApiBaseUrls, mppFetchRaw } from '@/lib/mpp-api'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append('file', file)

    if (projectId) {
      upstreamFormData.append('legacy_project_id', String(projectId))
    }

    const response = await mppFetchRaw('/v1/projects/import/mpp', {
      method: 'POST',
      body: upstreamFormData,
    }, {
      timeoutMs: 120_000,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Erro ao importar MPP:', error)

    const message = error instanceof Error ? error.message : 'Falha ao integrar com MPP Platform API'

    return NextResponse.json(
      {
        error: 'Falha ao integrar com MPP Platform API',
        details: message,
        triedBaseUrls: getMppApiBaseUrls(),
      },
      { status: 503 }
    )
  }
}
