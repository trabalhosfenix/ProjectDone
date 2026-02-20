import { NextResponse } from 'next/server'
import { getMppTasks } from '@/lib/mpp-api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = request.headers.get('x-tenant-id') || undefined
    const items = await getMppTasks(id, searchParams, { tenantId })
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar tarefas na MPP API' }, { status: 500 })
  }
}
