'use server'

import { revalidatePath } from 'next/cache'
import { MPP_API_BASE_URL } from '@/lib/mpp-api'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Importação de MS Project delegada integralmente para MPP Platform API.
 *
 * Sem parsing local no Next.js.
 */
export async function importMSProject(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!projectId || !file) {
      return { success: false, error: 'Projeto ou arquivo não fornecido' }
    }

    const fileName = file.name.toLowerCase()
    const validExtensions = ['.mpp', '.mpx', '.xml', '.mpt']
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext))
    if (!hasValidExt) {
      return {
        success: false,
        error: `Formato não suportado. Use: ${validExtensions.join(', ')}`,
      }
    }

    const payload = new FormData()
    payload.append('file', file)
    payload.append('legacy_project_id', projectId)

    const startResponse = await fetch(`${MPP_API_BASE_URL}/v1/projects/import/mpp`, {
      method: 'POST',
      body: payload,
      cache: 'no-store',
    })

    const startBody = await startResponse.json()

    if (!startResponse.ok) {
      return {
        success: false,
        error: startBody.error || 'Falha ao iniciar importação na MPP Platform API',
        details: startBody,
      }
    }

    const jobId = startBody.job_id || startBody.jobId
    const importedProjectId = startBody.project_id || startBody.projectId

    if (!jobId) {
      revalidatePath(`/dashboard/projetos/${projectId}`)
      return {
        success: true,
        message: 'Importação iniciada com sucesso.',
        projectId: importedProjectId,
      }
    }

    // Polling server-side simples para manter compatibilidade do retorno desta action.
    const timeoutAt = Date.now() + 120_000
    while (Date.now() < timeoutAt) {
      const jobResponse = await fetch(`${MPP_API_BASE_URL}/v1/jobs/${jobId}`, {
        cache: 'no-store',
      })
      const jobBody = await jobResponse.json()
      const status = String(jobBody.status || '').toLowerCase()

      if (['completed', 'success', 'done'].includes(status)) {
        revalidatePath(`/dashboard/projetos/${projectId}`)
        return {
          success: true,
          message: 'Importação concluída com sucesso.',
          jobId,
          projectId: importedProjectId,
          stats: {
            imported: jobBody.imported || undefined,
          },
        }
      }

      if (['failed', 'error'].includes(status)) {
        return {
          success: false,
          error: jobBody.error || 'Falha ao processar arquivo .mpp',
          details: jobBody,
        }
      }

      await sleep(1500)
    }

    return {
      success: false,
      error: 'Tempo de processamento excedido. Consulte o status do job.',
      jobId,
      projectId: importedProjectId,
    }
  } catch (error: unknown) {
    console.error('Erro na importação MS Project:', error)
    return {
      success: false,
      error: 'Falha ao processar arquivo do MS Project',
      details: error instanceof Error ? error.message : String(error),
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