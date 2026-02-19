import { NextResponse } from 'next/server'
import { MPP_API_BASE_URL } from '@/lib/mpp-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const response = await fetch(`${MPP_API_BASE_URL}/v1/projects/${projectId}/export/json`, {
      cache: 'no-store',
    })

    const body = await response.text()
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('Erro ao exportar JSON MPP:', error)
    return NextResponse.json({ error: 'Falha ao exportar JSON da MPP API' }, { status: 500 })
  }
}
