import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildProjectScope, requireAuth } from '@/lib/access-control'

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth()
    const { searchParams } = new URL(request.url)
    const query = String(searchParams.get('q') || '').trim()
    const scope = buildProjectScope(currentUser)

    const projects = await prisma.project.findMany({
      where: {
        ...scope,
        ...(query
          ? {
              AND: [
                {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } },
                  ],
                },
              ],
            }
          : {}),
      },
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
