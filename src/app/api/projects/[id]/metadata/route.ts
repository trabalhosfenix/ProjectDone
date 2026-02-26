import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AccessError, requireProjectAccess } from '@/lib/access-control'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireProjectAccess(id)
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    const project = await prisma.project.findUnique({
      where: { id },
      select: { metadata: true }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projeto não encontrado' }, { status: 404 })
    }

    const metadata = (project.metadata as any) || {}
    
    // Se solicitou chave específica
    if (key) {
      return NextResponse.json({ success: true, data: metadata[key] || null })
    }

    return NextResponse.json({ success: true, data: metadata })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: 'Erro ao buscar metadados' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireProjectAccess(id)
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ success: false, error: 'Chave obrigatória' }, { status: 400 })
    }

    // Buscar metadata existente
    const project = await prisma.project.findUnique({
      where: { id },
      select: { metadata: true }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projeto não encontrado' }, { status: 404 })
    }

    const currentMetadata = (project.metadata as any) || {}
    
    // Atualizar apenas a chave enviada
    const newMetadata = {
      ...currentMetadata,
      [key]: value
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        metadata: newMetadata
      }
    })

    return NextResponse.json({ success: true, data: (updated.metadata as any)[key] })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('Erro ao atualizar metadata:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar metadados' }, { status: 500 })
  }
}
