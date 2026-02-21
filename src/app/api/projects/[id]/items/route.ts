import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const items = await prisma.projectItem.findMany({
      where: { projectId: id },
      orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar tarefas do projeto' }, { status: 500 })
  }
}
