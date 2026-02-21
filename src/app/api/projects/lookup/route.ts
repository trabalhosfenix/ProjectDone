import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = String(searchParams.get('q') || '').trim()

    const projects = await prisma.project.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error('Erro ao listar projetos para lookup:', error)
    return NextResponse.json({ success: false, error: 'Falha ao listar projetos' }, { status: 500 })
  }
}
