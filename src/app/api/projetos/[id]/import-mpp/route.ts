import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const execAsync = promisify(exec)

// Aumentar o limite de tempo de execução para esta rota
export const maxDuration = 300 // 5 minutos

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
  tasks: MPXJTask[]
}

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const tempId = randomUUID()
  const tempDir = process.platform === 'win32' ? 'C:\\temp' : '/tmp'
  const inputPath = join(tempDir, `input_${tempId}.mpp`)
  const outputPath = join(tempDir, `output_${tempId}.json`)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!projectId || !file) {
      return NextResponse.json({ success: false, error: 'Projeto ou arquivo não fornecido' }, { status: 400 })
    }

    // Validar extensão
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.mpp', '.mpx', '.xml', '.mpt']
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext))
    if (!hasValidExt) {
      return NextResponse.json({ 
        success: false, 
        error: `Formato não suportado. Use: ${validExtensions.join(', ')}` 
      }, { status: 400 })
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
    const binPath = join(process.cwd(), 'bin')
    const jarPath = join(binPath, 'mpxj.jar')
    
    // Se não for usar o Converter dedicado e sim o nativo do MPXJ (se tivermos o transformer)
    // Mas criamos o MPXJConverter.java que precisa ser compilado.
    // Como baixamos o JAR full, vamos usar a classe MpxjConvert do sample que vem nele, ou tentar o nosso se foi compilado.
    // O comando anterior foi baixar mpxj.jar. Esse jar geralmente tem classes utilitárias.
    // Vamos tentar usar a classe nativa do MPXJ net.sf.mpxj.sample.MpxjConvert se existir, 
    // ou assumir que o usuário vai usar o fallback XML se o java falhar.
    // Mas para garantir, vamos usar o conversor json embutido se houver.
    
    // Na verdade, a melhor aposta com o mpxj.jar padrão é usar o MpxjConvert se ele exportar para JSON.
    // Porém, o MPXJ padrão exporta para MPX, MSPDI (XML), Planner, etc. JSON nem sempre é nativo no tool CLI padrão.
    
    // Vamos focar no XML fallback como primário se Java falhar, mas tentar rodar algo simples.
    // Se o arquivo já é XML, processamos direto.
    if (fileName.endsWith('.xml')) {
        await unlink(inputPath)
        return await importProjectXML(buffer, projectId)
    }

    // Se é MPP, precisamos converter. 
    // java -cp "bin/mpxj.jar:bin/lib/*" net.sf.mpxj.sample.MpxjConvert input.mpp output.xml
    const xmlOutputPath = join(tempDir, `output_${tempId}.xml`)
    
    // Configurar classpath correto (separador : para Linux/Mac, ; para Windows)
    const isWin = process.platform === 'win32'
    const classpathSeparator = isWin ? ';' : ':'
    // Include mpxj.jar and all jars in lib/
    const classpath = `"${jarPath}${classpathSeparator}${join(binPath, 'lib', '*')}"`
    
    try {
      const { stdout, stderr } = await execAsync(
        `java -cp ${classpath} net.sf.mpxj.sample.MpxjConvert "${inputPath}" "${xmlOutputPath}"`,
        { timeout: 120000 }
      )

      if (stderr && !stderr.includes('WARNING')) console.error('MPXJ stderr:', stderr)

      // Ler o XML gerado e processar
      const xmlBuffer = await readFile(xmlOutputPath)
      await unlink(inputPath)
      await unlink(xmlOutputPath)
      
      return await importProjectXML(xmlBuffer, projectId)
      
    } catch (javaError: any) {
      console.error('MPXJ Java error:', javaError.message)
      // Tentar limpar
      try { await unlink(inputPath); await unlink(xmlOutputPath); } catch(e){}
      
      // Se ainda der erro de classe, é grave. Retornar erro detalhado.
      return NextResponse.json({ 
        success: false, 
        error: 'Falha na conversão do arquivo .mpp. Verifique se o arquivo não está corrompido.',
        details: javaError.message
      }, { status: 500 })
    }


  } catch (error: any) {
    console.error('Erro na API import:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha interna no servidor',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * Processa XML do MS Project (MSPDI)
 */
async function importProjectXML(buffer: Buffer, projectId: string) {
  try {
    const xmlContent = buffer.toString('utf-8')
    const tasks: { uid: string; name: string; start?: Date; finish?: Date; wbs?: string; summary?: boolean; outlineLevel?: number }[] = []
    
    // Extração Regex robusta para MSPDI XML
    const taskBlocks = xmlContent.match(/<Task>[\s\S]*?<\/Task>/g) || []
    
    for (const block of taskBlocks) {
        // Ignorar tarefas resumo de projeto (nível 0 ou summary com WBS 0)
        // Mas precisamos das tarefas resumo reais (fases) para estrutura, ou apenas das folhas?
        // O sistema atual é lista plana com WBS. Vamos importar tudo exceto o Projeto Raiz.
        
        const summaryStr = block.match(/<Summary>(\d+)<\/Summary>/)?.[1]
        const isSummary = summaryStr === '1'
        
        const outlineLevelStr = block.match(/<OutlineLevel>(\d+)<\/OutlineLevel>/)?.[1]
        const outlineLevel = outlineLevelStr ? parseInt(outlineLevelStr) : 0
        
        // Ignorar raiz (level 0) se não tiver nome útil ou for resumo geral
        if (outlineLevel === 0) continue

        const uid = block.match(/<UID>(\d+)<\/UID>/)?.[1]
        if (!uid) continue

        const name = block.match(/<Name>([^<]+)<\/Name>/)?.[1]
        if (!name) continue

        const startStr = block.match(/<Start>([^<]+)<\/Start>/)?.[1]
        const finishStr = block.match(/<Finish>([^<]+)<\/Finish>/)?.[1]
        const wbs = block.match(/<WBS>([^<]+)<\/WBS>/)?.[1]

        tasks.push({
            uid,
            name,
            wbs,
            start: startStr ? new Date(startStr) : undefined,
            finish: finishStr ? new Date(finishStr) : undefined,
            summary: isSummary,
            outlineLevel
        })
    }
    
    // Parse Assignments e Resources (Mantido igual)
    const assignmentBlocks = xmlContent.match(/<Assignment>[\s\S]*?<\/Assignment>/g) || []
    const taskResourceMap = new Map<string, string>()
    for (const block of assignmentBlocks) {
        const taskUid = block.match(/<TaskUID>(\d+)<\/TaskUID>/)?.[1]
        const resUid = block.match(/<ResourceUID>(\d+)<\/ResourceUID>/)?.[1]
        if (taskUid && resUid && resUid !== '-65535') taskResourceMap.set(taskUid, resUid)
    }
    
    const resourceBlocks = xmlContent.match(/<Resource>[\s\S]*?<\/Resource>/g) || []
    const resourceNameMap = new Map<string, string>()
    for (const block of resourceBlocks) {
        const uid = block.match(/<UID>(\d+)<\/UID>/)?.[1]
        const name = block.match(/<Name>([^<]+)<\/Name>/)?.[1]
        if (uid && name) resourceNameMap.set(uid, name)
    }

    // Validar membros no DB
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true }
    })
    const validMemberNames = new Set(projectMembers.map(m => m.user.name?.toLowerCase()).filter(Boolean))
    projectMembers.forEach(m => { if (m.user.email) validMemberNames.add(m.user.email.toLowerCase()) })

    // Parse Predecessors (Dependências)
    // Dentro de <Task> temos <PredecessorLink> <PredecessorUID>12</PredecessorUID> </PredecessorLink>
    // Vamos fazer um map UID -> DB_ID
    
    const createdItemsMap = new Map<string, string>()
    let createdCount = 0
    const dependenciesToProcess: { dbId: string; predUid: string }[] = []

    // 1. Criar Itens
    for (const task of tasks) {
        // Encontrar recurso
        let responsible = null
        if (taskResourceMap.has(task.uid)) {
            const resUid = taskResourceMap.get(task.uid)!
            const resName = resourceNameMap.get(resUid)
            if (resName) {
                const checkName = resName.toLowerCase()
                if (validMemberNames.has(checkName)) responsible = resName
            }
        }

        const item = await prisma.projectItem.create({
            data: {
                projectId,
                task: task.name,
                originSheet: 'MSPROJECT_IMPORT',
                wbs: task.wbs || null,
                status: 'A Fazer',
                datePlanned: task.start || null,
                datePlannedEnd: task.finish || null,
                responsible,
                metadata: {
                    mpxjUid: task.uid,
                    summary: task.summary,
                    outlineLevel: task.outlineLevel
                }
            }
        })
        
        createdItemsMap.set(task.uid, item.id)
        createdCount++
        
        // Extrair predecessores dessa tarefa específica
        // Precisamos achar o bloco dessa tarefa no XML original de novo ou parsear antes.
        // Regex simplificada para links dentro do bloco da tarefa atual
        // Encontrar o bloco da task pelo UID
        const taskBlockRegex = new RegExp(`<Task>[\\s\\S]*?<UID>${task.uid}<\\/UID>[\\s\\S]*?<\\/Task>`)
        const taskBlockMatch = xmlContent.match(taskBlockRegex)
        
        if (taskBlockMatch) {
            const block = taskBlockMatch[0]
            const predLinks = block.match(/<PredecessorLink>[\s\S]*?<\/PredecessorLink>/g) || []
            for (const link of predLinks) {
                const predUid = link.match(/<PredecessorUID>(\d+)<\/PredecessorUID>/)?.[1]
                if (predUid) {
                    dependenciesToProcess.push({ dbId: item.id, predUid })
                }
            }
        }
    }
    
    // 2. Conectar Dependências
    let depCount = 0
    for (const dep of dependenciesToProcess) {
        const predDbId = createdItemsMap.get(dep.predUid)
        if (predDbId) {
            await prisma.projectItem.update({
                where: { id: dep.dbId },
                data: { predecessors: { connect: { id: predDbId } } }
            })
            depCount++
        }
    }

    revalidatePath(`/dashboard/projetos/${projectId}`)

    return NextResponse.json({
      success: true,
      count: createdCount,
      message: `${createdCount} tarefas importadas e ${depCount} dependências conectadas.`,
    })

  } catch (error: any) {
    console.error('Erro no processamento XML:', error)
    return NextResponse.json({ success: false, error: 'Falha ao processar conteúdo XML', details: error.message }, { status: 500 })
  }
}
