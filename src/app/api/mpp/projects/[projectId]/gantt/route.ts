import { NextResponse } from 'next/server'
import { getMppGantt } from '@/lib/mpp-api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const tenantId = request.headers.get('x-tenant-id') || undefined
    const data = await getMppGantt(projectId, { tenantId })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar gantt da MPP API:', error)
    return NextResponse.json({ error: 'Falha ao buscar dados de Gantt no backend MPP' }, { status: 500 })
  }
}
