'use server'

import { revalidatePath } from 'next/cache'

interface ImportResult {
  success: boolean
  jobId?: string
  projectId?: string
  error?: string
  message?: string
  stats?: {
    imported: number
    dependencies: number
    warnings: string[]
  }
}

/**
 * Importa um arquivo Microsoft Project (.mpp, .mpx, .xml) 
 * AGORA: apenas encaminha para a API route
 */
export async function importMSProject(formData: FormData): Promise<ImportResult> {
  const projectId = formData.get('projectId') as string
  const file = formData.get('file') as File

  if (!projectId || !file) {
    return { success: false, error: 'Projeto ou arquivo não fornecido' }
  }

  // Validar extensão (cliente-side)
  const fileName = file.name.toLowerCase()
  const validExtensions = ['.mpp', '.mpx', '.xml', '.mpt']
  const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext))
  
  if (!hasValidExt) {
    return { 
      success: false, 
      error: `Formato não suportado. Use: ${validExtensions.join(', ')}` 
    }
  }

  try {
    // Descobrir URL base (para chamada interna)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Criar novo FormData para enviar para nossa API route
    const apiFormData = new FormData()
    apiFormData.append('file', file)
    apiFormData.append('projectId', projectId)

    // Chamar nossa própria API route (que vai redirecionar para API externa)
    const response = await fetch(`${baseUrl}/api/projects/import/mpp`, {
      method: 'POST',
      body: apiFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Erro ${response.status}`)
    }

    // Revalidar caminho se já tiver dados
    if (data.projectId) {
      revalidatePath(`/dashboard/projetos/${data.projectId}`)
    }

    return {
      success: true,
      jobId: data.jobId,
      projectId: data.projectId,
      message: data.message || 'Arquivo enviado para processamento',
      stats: data.stats
    }

  } catch (error: any) {
    console.error('Erro na importação MS Project:', error)
    
    return { 
      success: false, 
      error: error.message || 'Falha ao processar arquivo do MS Project'
    }
  }
}

/**
 * Verificar status de um job de importação
 */
export async function checkImportStatus(jobId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/projects/import/status/${jobId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao verificar status')
    }

    return {
      status: data.status,
      progress: data.progress,
      message: data.message,
      projectId: data.projectId,
      error: data.error
    }

  } catch (error: any) {
    console.error('Erro ao verificar status:', error)
    return {
      status: 'error',
      message: error.message,
      progress: 0
    }
  }
}

/**
 * Cancelar um job de importação
 */
export async function cancelImport(jobId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/projects/import/status/${jobId}/cancel`, {
      method: 'POST'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao cancelar')
    }

    return { success: true }

  } catch (error: any) {
    console.error('Erro ao cancelar:', error)
    return { success: false, error: error.message }
  }
}