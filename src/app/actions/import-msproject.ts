'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { addBusinessDays } from 'date-fns'

const execAsync = promisify(exec)

// Interface para o formato JSON que o MPXJ gera
interface MPXJTask {
  id: number
  name: string
  wbs?: string
  start?: string
  finish?: string
  duration?: string
  percentComplete?: number
  predecessors?: string
  resourceNames?: string
  notes?: string
  milestone?: boolean
  summary?: boolean
}

interface MPXJProject {
  name?: string
  tasks: MPXJTask[]
}

/**
 * Importa um arquivo Microsoft Project (.mpp, .mpx, .xml) usando MPXJ via Java CLI
 */
export async function importMSProject(formData: FormData) {
  const tempId = randomUUID()
  const tempDir = process.platform === 'win32' ? 'C:\\temp' : '/tmp'
  const inputPath = join(tempDir, `input_${tempId}.mpp`)
  const outputPath = join(tempDir, `output_${tempId}.json`)

  try {
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!projectId || !file) {
      return { success: false, error: 'Projeto ou arquivo não fornecido' }
    }

    // Validar extensão
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.mpp', '.mpx', '.xml', '.mpt']
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext))
    if (!hasValidExt) {
      return { 
        success: false, 
        error: `Formato não suportado. Use: ${validExtensions.join(', ')}` 
      }
    }

    // 1. Garantir diretório temp existe
    try {
      await mkdir(tempDir, { recursive: true })
    } catch (e) {
      // Ignore if exists
    }

    // 2. Salvar arquivo temporariamente
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(inputPath, buffer)

    // 3. Executar conversão MPXJ
    // O script Python ou Java irá converter o .mpp para JSON
    const binPath = join(process.cwd(), 'bin')
    const jarPath = join(binPath, 'mpxj-converter.jar')
    
    let jsonData: MPXJProject
    
    try {
      // Tentar usar Java MPXJ
      const { stdout, stderr } = await execAsync(
        `java -jar "${jarPath}" "${inputPath}" "${outputPath}"`,
        { timeout: 60000 } // 60 segundos timeout
      )
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('MPXJ stderr:', stderr)
      }

      // Ler JSON gerado
      const jsonContent = await readFile(outputPath, 'utf-8')
      jsonData = JSON.parse(jsonContent)
      
    } catch (javaError: any) {
      // Se Java falhar, tentar fallback com parsing XML (se for arquivo XML do Project)
      if (fileName.endsWith('.xml')) {
        return await importProjectXML(formData, buffer, projectId)
      }
      
      console.error('MPXJ Java error:', javaError.message)
      return { 
        success: false, 
        error: 'Conversão falhou. Verifique se Java está instalado na VPS ou use formato .xml do MS Project.',
        details: javaError.message
      }
    }

    // 4. Validar membros do projeto para recursos
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true }
    })
    const validMemberNames = new Set(
      projectMembers
        .map(m => m.user.name?.toLowerCase())
        .filter(Boolean)
    )
    projectMembers.forEach(m => {
      if (m.user.email) validMemberNames.add(m.user.email.toLowerCase())
    })

    // 5. Criar itens no banco
    const createdItemsMap = new Map<number, string>() // MPXJ ID -> DB UUID
    const dependenciesToProcess: { dbId: string; preds: string }[] = []
    const warnings: string[] = []

    for (const task of jsonData.tasks || []) {
      if (!task.name || task.summary) continue // Pular tarefas resumo (WBS headers)

      // Parse datas
      const datePlanned = task.start ? new Date(task.start) : null
      const datePlannedEnd = task.finish ? new Date(task.finish) : null
      
      // Parse duração (formato "5 days" ou "5d")
      let duration = 0
      if (task.duration) {
        const match = task.duration.toString().match(/[\d.]+/)
        if (match) duration = parseFloat(match[0])
      }

      // Validar recurso
      let responsible = task.resourceNames || null
      if (responsible) {
        const checkName = responsible.split(';')[0].trim().toLowerCase()
        if (!validMemberNames.has(checkName)) {
          warnings.push(`Recurso "${responsible}" na tarefa "${task.name}" não encontrado.`)
          responsible = null
        }
      }

      // Status baseado em % concluído
      const progress = task.percentComplete || 0
      const status = progress >= 100 ? 'Concluído' : progress > 0 ? 'Em Andamento' : 'A Fazer'

      const item = await prisma.projectItem.create({
        data: {
          projectId,
          task: task.name,
          originSheet: 'MSPROJECT_IMPORT',
          wbs: task.wbs || null,
          status,
          responsible,
          datePlanned,
          datePlannedEnd,
          duration,
          metadata: {
            progress,
            mpxjId: task.id,
            milestone: task.milestone,
            notes: task.notes
          }
        }
      })

      createdItemsMap.set(task.id, item.id)

      if (task.predecessors) {
        dependenciesToProcess.push({ dbId: item.id, preds: task.predecessors })
      }
    }

    // 6. Processar predecessores
    let depCount = 0
    for (const dep of dependenciesToProcess) {
      // Formato: "1FS", "2SS+1d", "3,4"
      const predParts = dep.preds.split(/[;,]/)
      for (const part of predParts) {
        const match = part.trim().match(/^(\d+)/)
        if (match) {
          const predMpxjId = parseInt(match[1])
          const predDbId = createdItemsMap.get(predMpxjId)
          if (predDbId) {
            await prisma.projectItem.update({
              where: { id: dep.dbId },
              data: {
                predecessors: {
                  connect: { id: predDbId }
                }
              }
            })
            depCount++
          }
        }
      }
    }

    // 7. Limpar arquivos temporários
    try {
      await unlink(inputPath)
      await unlink(outputPath)
    } catch (e) {
      // Ignore cleanup errors
    }

    revalidatePath(`/dashboard/projetos/${projectId}`)

    return {
      success: true,
      count: createdItemsMap.size,
      message: `${createdItemsMap.size} tarefas importadas e ${depCount} dependências conectadas do MS Project.`,
      stats: {
        imported: createdItemsMap.size,
        dependencies: depCount,
        warnings: warnings.slice(0, 10)
      }
    }

  } catch (error: any) {
    console.error('Erro na importação MS Project:', error)
    
    // Limpar arquivos em caso de erro
    try {
      await unlink(inputPath)
      await unlink(outputPath)
    } catch (e) {
      // Ignore
    }
    
    return { 
      success: false, 
      error: 'Falha ao processar arquivo do MS Project',
      details: error.message
    }
  }
}

/**
 * Fallback: Importa XML do MS Project sem precisar de Java
 */
async function importProjectXML(formData: FormData, buffer: Buffer, projectId: string) {
  try {
    const xmlContent = buffer.toString('utf-8')
    
    // Parse básico do XML do MS Project
    // O formato XML do MS Project tem estrutura bem definida
    const tasks: { name: string; start?: Date; finish?: Date; wbs?: string }[] = []
    
    // Regex simples para extrair tarefas do XML do Project
    const taskMatches = xmlContent.matchAll(/<Task>[\s\S]*?<\/Task>/g)
    
    for (const match of taskMatches) {
      const taskXml = match[0]
      
      const nameMatch = taskXml.match(/<Name>([^<]+)<\/Name>/)
      const startMatch = taskXml.match(/<Start>([^<]+)<\/Start>/)
      const finishMatch = taskXml.match(/<Finish>([^<]+)<\/Finish>/)
      const wbsMatch = taskXml.match(/<WBS>([^<]+)<\/WBS>/)
      const summaryMatch = taskXml.match(/<Summary>1<\/Summary>/)
      
      if (nameMatch && !summaryMatch) {
        tasks.push({
          name: nameMatch[1],
          start: startMatch ? new Date(startMatch[1]) : undefined,
          finish: finishMatch ? new Date(finishMatch[1]) : undefined,
          wbs: wbsMatch ? wbsMatch[1] : undefined
        })
      }
    }

    // Criar itens
    let created = 0
    for (const task of tasks) {
      await prisma.projectItem.create({
        data: {
          projectId,
          task: task.name,
          originSheet: 'MSPROJECT_XML_IMPORT',
          wbs: task.wbs || null,
          status: 'A Fazer',
          datePlanned: task.start || null,
          datePlannedEnd: task.finish || null
        }
      })
      created++
    }

    revalidatePath(`/dashboard/projetos/${projectId}`)

    return {
      success: true,
      count: created,
      message: `${created} tarefas importadas do XML do MS Project.`,
      stats: { imported: created, dependencies: 0, warnings: [] }
    }

  } catch (error: any) {
    console.error('Erro no fallback XML:', error)
    return { success: false, error: 'Falha ao processar XML do MS Project' }
  }
}
