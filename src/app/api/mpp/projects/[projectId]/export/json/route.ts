import { NextResponse } from 'next/server'
import { MPP_API_BASE_URL } from '@/lib/mpp-api'
import { AccessError, requireAuth } from '@/lib/access-control'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { projectId } = await params
    const headerTenantId = request.headers.get('x-tenant-id') || undefined
    if (currentUser.tenantId && headerTenantId && currentUser.tenantId !== headerTenantId) {
      throw new AccessError('Tenant inválido', 403)
    }
    const tenantId = currentUser.tenantId || headerTenantId || undefined
    const response = await fetch(`${MPP_API_BASE_URL}/v1/projects/${projectId}/export/json`, {
      cache: 'no-store',
      headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
    })

    const body = await response.text()
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao exportar JSON MPP:', error)
    return NextResponse.json({ error: 'Falha ao exportar JSON da MPP API' }, { status: 500 })
  }
}
