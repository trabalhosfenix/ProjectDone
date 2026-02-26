import { NextResponse } from 'next/server'
import { getMppTasks } from '@/lib/mpp-api'
import { AccessError, requireAuth } from '@/lib/access-control'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const headerTenantId = request.headers.get('x-tenant-id') || undefined
    if (currentUser.tenantId && headerTenantId && currentUser.tenantId !== headerTenantId) {
      throw new AccessError('Tenant inválido', 403)
    }
    const tenantId = currentUser.tenantId || headerTenantId || undefined
    const tasks = await getMppTasks(projectId, searchParams, { tenantId })
    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao buscar tasks na MPP API:', error)
    return NextResponse.json({ success: false, error: 'Falha ao buscar tarefas no backend MPP' }, { status: 500 })
  }
}
