import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const items = await prisma.projectItem.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
  }
}
