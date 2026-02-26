'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/access-control'

export async function uploadFile(formData: FormData) {
  try {
    await requireAuth()
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado' }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignore if exists
    }

    // Gerar nome único
    const ext = file.name.split('.').pop()
    const fileName = `${randomUUID()}.${ext}`
    const path = join(uploadDir, fileName)

    await writeFile(path, buffer)

    // Retornar URL usando API route (funciona na VPS)
    const url = `/api/uploads/${fileName}`

    return { success: true, url, fileName: file.name }
  } catch (error) {
    console.error('Erro no upload:', error)
    return { success: false, error: 'Falha ao salvar arquivo' }
  }
}
