import { NextResponse } from 'next/server'
import { mppFetchRaw } from '@/lib/mpp-api'

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo não fornecido' }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append('file', file)

    if (projectId) {
      upstreamFormData.append('legacy_project_id', String(projectId))
    }

    const response = await mppFetchRaw(
      '/v1/projects/import/mpp',
      {
        method: 'POST',
        body: upstreamFormData,
      },
      {
        timeoutMs: 120_000,
      }
    )

    const data = await safeJson(response)

    return NextResponse.json(
      {
        success: response.ok,
        ...(data && typeof data === 'object' ? data : {}),
      },
      { status: response.status }
    )
  } catch (error) {
    console.error('Erro ao importar MPP:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao integrar com MPP Platform API',
      },
      { status: 503 }
    )
  }
}
