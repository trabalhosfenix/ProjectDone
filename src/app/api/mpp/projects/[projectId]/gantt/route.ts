import { NextResponse } from 'next/server'
import { getMppGantt } from '@/lib/mpp-api'
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
    const data = await getMppGantt(projectId, { tenantId })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erro ao buscar gantt da MPP API:', error)
    return NextResponse.json({ error: 'Falha ao buscar dados de Gantt no backend MPP' }, { status: 500 })
  }
}
