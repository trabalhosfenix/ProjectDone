import { NextResponse } from 'next/server'
import { mppFetchRaw } from '@/lib/mpp-api'
import { AccessError, requireAuth, requireProjectAccess } from '@/lib/access-control'

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')
    const headerTenantId = request.headers.get('x-tenant-id') || undefined
    if (currentUser.tenantId && headerTenantId && currentUser.tenantId !== headerTenantId) {
      throw new AccessError('Tenant inválido', 403)
    }
    const tenantId = currentUser.tenantId || headerTenantId || undefined

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo não fornecido' }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append('file', file)

    if (projectId) {
      await requireProjectAccess(String(projectId), currentUser)
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
        tenantId,
      }
    )

    const data = await safeJson(response)

    return NextResponse.json(
      {
        success: response.ok,
        ...(data && typeof data === 'object' ? data : {}),
        job_id:
          data && typeof data === 'object'
            ? String((data as Record<string, unknown>).job_id || (data as Record<string, unknown>).jobId || '') || undefined
            : undefined,
        project_id:
          data && typeof data === 'object'
            ? String((data as Record<string, unknown>).project_id || (data as Record<string, unknown>).projectId || '') || undefined
            : undefined,
      },
      { status: response.status }
    )
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status }
      )
    }
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
