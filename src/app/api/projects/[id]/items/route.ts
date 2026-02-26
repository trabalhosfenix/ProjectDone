import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user } = await requireProjectAccess(id)

    const items = await prisma.projectItem.findMany({
      where: {
        projectId: id,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      orderBy: [{ wbs: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar tarefas do projeto' }, { status: 500 })
  }
}
