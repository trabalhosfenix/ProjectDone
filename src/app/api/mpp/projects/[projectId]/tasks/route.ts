import { NextResponse } from 'next/server'
import { getMppTasks } from '@/lib/mpp-api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const tasks = await getMppTasks(projectId, searchParams)
    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Erro ao buscar tasks na MPP API:', error)
    return NextResponse.json({ success: false, error: 'Falha ao buscar tarefas no backend MPP' }, { status: 500 })
  }
}
