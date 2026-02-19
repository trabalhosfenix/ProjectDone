'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveImportedTasks(projectId: string, tasks: any[]) {
  try {
    if (!projectId || !tasks || tasks.length === 0) {
      return { success: false, error: 'Dados inválidos' }
    }

    // Opcional: Limpar tarefas existentes?
    // Por segurança, vamos adicionar. Se o usuário quiser limpar, ele deletaria o projeto ou implementaria uma função de limpar.
    // Mas uma importação de cronograma geralmente é inicial.
    
    // Preparar dados
    const dataToCreate = tasks.map(t => ({
      projectId,
      task: t.name,
      originSheet: 'PROJECT',
      status: t.progress === 1 ? 'Concluído' : t.progress > 0 ? 'Em Andamento' : 'A Fazer',
      datePlanned: t.start ? new Date(t.start) : new Date(),
      dateActual: t.end ? new Date(t.end) : null,
      metadata: {
        progress: t.progress || 0,
        duration: t.duration || 0
      }
    }))

    const result = await prisma.projectItem.createMany({
      data: dataToCreate
    })

    revalidatePath(`/dashboard/projetos/${projectId}`)
    return { success: true, count: result.count }
  } catch (error) {
    console.error('Erro ao salvar tarefas importadas:', error)
    return { success: false, error: 'Erro ao salvar no banco de dados' }
  }
}
