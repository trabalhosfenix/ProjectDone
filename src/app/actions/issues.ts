'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Tipos
export type IssueFilters = {
  projectId?: string
  type?: 'INTERNAL' | 'EXTERNAL'
  statusId?: number
  memberId?: string
  role?: string
  search?: string
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type CreateIssueData = {
  projectId: string
  title: string
  description?: string
  type?: 'INTERNAL' | 'EXTERNAL'
  statusId?: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  code?: string
  code2?: string
  plannedStart?: Date
  plannedEnd?: Date
  createdById?: string
  memberIds?: string[] // IDs dos usuários responsáveis
}

export type UpdateIssueData = {
    title?: string
    description?: string
    type?: 'INTERNAL' | 'EXTERNAL'
    statusId?: number
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    code?: string
    code2?: string
    plannedStart?: Date
    plannedEnd?: Date
    actualStart?: Date
    actualEnd?: Date
    memberIds?: string[] // IDs para atualizar responsáveis (substituição completa)
}

// Buscar questões (listagem)
export async function getIssues(filters: IssueFilters) {
  try {
    const where: any = {}

    if (filters.projectId) where.projectId = filters.projectId
    if (filters.type) where.type = filters.type
    if (filters.statusId) where.statusId = filters.statusId
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Filtro por membro (se necessário, requer includes específicos)
    if (filters.memberId) {
        where.members = {
            some: {
                userId: filters.memberId
            }
        }
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        status: true,
        project: {
            select: { id: true, name: true }
        },
        createdBy: {
            select: { id: true, name: true, email: true }
        },
        members: {
            include: { user: true }
        },
        _count: {
            select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return issues
  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return []
  }
}

// Buscar detalhes da questão
export async function getIssueDetails(issueId: string) {
    try {
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                status: true,
                project: true,
                createdBy: true,
                members: {
                    include: { user: true }
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        
        return issue
    } catch (error) {
        console.error('Erro ao buscar detalhes da questão:', error)
        return null
    }
}

// Criar nova questão
export async function createIssue(data: CreateIssueData) {
  try {
    let userId = data.createdById

    if (!userId) {
        const session = await getServerSession(authOptions)
        userId = (session?.user as any)?.id
    }

    if (!userId) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // Preparar membros
    let membersCreateQuery: any = {}
    if (data.memberIds && data.memberIds.length > 0) {
        membersCreateQuery = {
            create: data.memberIds.map(mid => ({
                userId: mid,
                role: 'RESPONSIBLE'
            }))
        }
    } else {
        // Fallback: Criador é o responsável
        membersCreateQuery = {
            create: {
                userId: userId,
                role: 'RESPONSIBLE'
            }
        }
    }

    const issue = await prisma.issue.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        type: data.type || 'INTERNAL',
        statusId: data.statusId,
        priority: data.priority || 'MEDIUM',
        code: data.code,
        code2: data.code2,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
        createdById: userId,
        members: membersCreateQuery
      },
      include: {
        status: true,
        project: true,
        createdBy: true,
        members: {
          include: {
            user: true
          }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${data.projectId}/questoes`)
    
    return { success: true, issue }
  } catch (error) {
    console.error('Erro ao criar questão:', error)
    return { success: false, error: 'Falha ao criar questão' }
  }
}

// Atualizar questão
export async function updateIssue(issueId: string, data: UpdateIssueData, projectId: string) {
  try {
    // Atualizar membros se fornecido
    if (data.memberIds) {
        await prisma.$transaction(async (tx) => {
             // 1. Atualizar campos básicos
             await tx.issue.update({
                where: { id: issueId },
                data: {
                    ...(data.title && { title: data.title }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.type && { type: data.type }),
                    ...(data.statusId !== undefined && { statusId: data.statusId }),
                    ...(data.priority && { priority: data.priority }),
                    ...(data.code !== undefined && { code: data.code }),
                    ...(data.code2 !== undefined && { code2: data.code2 }),
                    ...(data.plannedStart !== undefined && { plannedStart: data.plannedStart }),
                    ...(data.plannedEnd !== undefined && { plannedEnd: data.plannedEnd }),
                    ...(data.actualStart !== undefined && { actualStart: data.actualStart }),
                    ...(data.actualEnd !== undefined && { actualEnd: data.actualEnd }),
                }
             })

             // 2. Atualizar membros (remover todos e adicionar novos)
             if (data.memberIds) {
                 await tx.issueMember.deleteMany({
                     where: { issueId }
                 })
                 
                 if (data.memberIds.length > 0) {
                     await tx.issueMember.createMany({
                         data: data.memberIds.map(mid => ({
                             issueId,
                             userId: mid,
                             role: 'RESPONSIBLE'
                         }))
                     })
                 }
             }
        })
    } else {
        // Update simples
        await prisma.issue.update({
            where: { id: issueId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.type && { type: data.type }),
                ...(data.statusId !== undefined && { statusId: data.statusId }),
                ...(data.priority && { priority: data.priority }),
                ...(data.code !== undefined && { code: data.code }),
                ...(data.code2 !== undefined && { code2: data.code2 }),
                ...(data.plannedStart !== undefined && { plannedStart: data.plannedStart }),
                ...(data.plannedEnd !== undefined && { plannedEnd: data.plannedEnd }),
                ...(data.actualStart !== undefined && { actualStart: data.actualStart }),
                ...(data.actualEnd !== undefined && { actualEnd: data.actualEnd }),
            }
        })
    }
    
    const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: {
            status: true,
            project: true,
            createdBy: true,
            members: { include: { user: true } }
        }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/questoes`)
    revalidatePath(`/dashboard/projetos/${projectId}/questoes/${issueId}`)

    return { success: true, issue }
  } catch (error) {
    console.error('Erro ao atualizar questão:', error)
    return { success: false, error: 'Falha ao atualizar questão' }
  }
}

// Deletar questão
export async function deleteIssue(issueId: string, projectId: string) {
  try {
    await prisma.issue.delete({
      where: { id: issueId }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/questoes`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar questão:', error)
    return { success: false, error: 'Falha ao deletar questão' }
  }
}

// Adicionar envolvido
export async function addIssueMember(issueId: string, userId: string, role: string, projectId: string) {
  try {
    const member = await prisma.issueMember.create({
      data: {
        issueId,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/questoes/${issueId}`)

    return { success: true, member }
  } catch (error) {
    console.error('Erro ao adicionar envolvido:', error)
    return { success: false, error: 'Falha ao adicionar envolvido' }
  }
}

// Remover envolvido
export async function removeIssueMember(memberId: string, projectId: string, issueId: string) {
  try {
    await prisma.issueMember.delete({
      where: { id: memberId }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/questoes/${issueId}`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao remover envolvido:', error)
    return { success: false, error: 'Falha ao remover envolvido' }
  }
}

// Adicionar comentário
export async function addIssueComment(issueId: string, userId: string, content: string, projectId: string) {
  try {
    const comment = await prisma.issueComment.create({
      data: {
        issueId,
        userId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    revalidatePath(`/dashboard/projetos/${projectId}/questoes/${issueId}`)

    return { success: true, comment }
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error)
    return { success: false, error: 'Falha ao adicionar comentário' }
  }
}

// Buscar situações disponíveis
export async function getIssueStatuses() {
  const statuses = await prisma.issueStatus.findMany({
    orderBy: {
      order: 'asc'
    }
  })

  return statuses
}

// Criar situações padrão (para ser chamado no seed)
export async function createDefaultIssueStatuses() {
  const defaultStatuses = [
    { label: "Aberta", color: "#3b82f6", isDefault: true, order: 1 },
    { label: "Em andamento", color: "#f59e0b", order: 2 },
    { label: "Em espera", color: "#6b7280", order: 3 },
    { label: "Resolvida", color: "#10b981", isFinal: true, order: 4 },
    { label: "Fechada", color: "#64748b", isFinal: true, order: 5 },
    { label: "Cancelada", color: "#ef4444", isFinal: true, order: 6 },
  ]

  for (const status of defaultStatuses) {
    await prisma.issueStatus.upsert({
      where: { label: status.label },
      update: status,
      create: status
    })
  }
}
