'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import readXlsxFile from 'read-excel-file/node'
import { parse, isValid, addBusinessDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { requireProjectAccess } from '@/lib/access-control'

// Mapeamento das colunas do Excel - aceita várias variações de nomes
const COLUMN_CANDIDATES = {
  task: ['Nome da tarefa', 'Nome da Tarefa', 'Tarefa', 'Task', 'Atividade'],
  wbs: ['EDT', 'WBS'],
  msId: ['Id', 'ID'],
  start: ['In\u00edcio', 'Inicio', 'Start'],
  startPlanned: ['In\u00edcio Previsto', 'Inicio Previsto', 'Data In\u00edcio', 'Data Inicio'],
  startActual: ['In\u00edcio Real', 'Inicio Real'],
  end: ['T\u00e9rmino', 'Termino', 'Fim', 'Finish'],
  endPlanned: ['T\u00e9rmino Previsto', 'Termino Previsto', 'Data T\u00e9rmino', 'Data Termino', 'Data Fim'],
  endActual: ['T\u00e9rmino Real', 'Termino Real'],
  duration: ['Dura\u00e7\u00e3o', 'Duracao', 'Duration'],
  progress: ['% conclu\u00edda', '% Conclu\u00edda', '% concluida', '%Conclu\u00edda', 'Progresso', '% Complete'],
  predecessors: ['Predecessoras', 'Predecessora', 'Predecessors', 'Predecessor'],
  resources: ['Nomes dos recursos', 'Nomes dos Recursos', 'Recursos', 'Recurso', 'Respons\u00e1vel', 'Responsavel', 'Resource Names'],
}

function buildSchema(headers: Array<string | null | undefined>) {
  const headerRow = headers.filter(Boolean).map((h) => String(h))
  const findColumn = (candidates: string[]) => {
    for (const candidate of candidates) {
      const found = headerRow.find((h) => h.trim() === candidate)
      if (found) return found
    }
    return null
  }

  const schema: Record<string, { column: string; type: any }> = {}

  const taskCol = findColumn(COLUMN_CANDIDATES.task)
  if (taskCol) schema.task = { column: taskCol, type: String }

  const wbsCol = findColumn(COLUMN_CANDIDATES.wbs)
  if (wbsCol) schema.wbs = { column: wbsCol, type: String }

  const msIdCol = findColumn(COLUMN_CANDIDATES.msId)
  if (msIdCol) schema.msId = { column: msIdCol, type: Number }

  const startCol = findColumn(COLUMN_CANDIDATES.start)
  if (startCol) schema.start = { column: startCol, type: String }

  const startPlannedCol = findColumn(COLUMN_CANDIDATES.startPlanned)
  if (startPlannedCol) schema.startPlanned = { column: startPlannedCol, type: String }

  const startActualCol = findColumn(COLUMN_CANDIDATES.startActual)
  if (startActualCol) schema.startActual = { column: startActualCol, type: String }

  const endCol = findColumn(COLUMN_CANDIDATES.end)
  if (endCol) schema.end = { column: endCol, type: String }

  const endPlannedCol = findColumn(COLUMN_CANDIDATES.endPlanned)
  if (endPlannedCol) schema.endPlanned = { column: endPlannedCol, type: String }

  const endActualCol = findColumn(COLUMN_CANDIDATES.endActual)
  if (endActualCol) schema.endActual = { column: endActualCol, type: String }

  const durationCol = findColumn(COLUMN_CANDIDATES.duration)
  if (durationCol) schema.duration = { column: durationCol, type: String }

  const progressCol = findColumn(COLUMN_CANDIDATES.progress)
  if (progressCol) schema.progress = { column: progressCol, type: Number }

  const predecessorsCol = findColumn(COLUMN_CANDIDATES.predecessors)
  if (predecessorsCol) schema.predecessors = { column: predecessorsCol, type: String }

  const resourcesCol = findColumn(COLUMN_CANDIDATES.resources)
  if (resourcesCol) schema.resources = { column: resourcesCol, type: String }

  return schema
}

// Helper: Parse Data
function parseExcelDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const cleanDate = dateStr.includes(' ') ? dateStr.split(' ')[1] : dateStr
  const date = parse(cleanDate, 'dd/MM/yy', new Date(), { locale: ptBR })
  if (isValid(date)) return date
  const dateFull = parse(cleanDate, 'dd/MM/yyyy', new Date(), { locale: ptBR })
  if (isValid(dateFull)) return dateFull
  return null
}

// Helper: Parse Duração ("313,08 dias" -> 313.08)
function parseDuration(durStr: string): number {
    if (!durStr) return 0
    const match = durStr.toString().match(/([\d,.]+)/)
    if (match) {
        const numStr = match[1].replace(',', '.')
        return parseFloat(numStr) || 0
    }
    return 0
}

export async function importProjectExcel(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File
    const { project, user } = await requireProjectAccess(projectId)

    if (!projectId || !file) {
      return { success: false, error: 'Projeto ou arquivo não fornecido' }
    }

    // 1. Validar Recursos (Buscar membros do projeto)
    const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
    })
    const validMemberNames = new Set(projectMembers.map(m => m.user.name?.toLowerCase()).filter(Boolean))
    projectMembers.forEach(m => {
        if (m.user.email) validMemberNames.add(m.user.email.toLowerCase())
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Debug: Ler cabeçalhos brutos primeiro para diagnosticar
    const rawParsed = await readXlsxFile(buffer)
    console.log('Excel Headers (primeira linha):', rawParsed[0])
    console.log('Total linhas brutas:', rawParsed.length)

    const headers = (rawParsed[0] || []) as Array<string | null | undefined>
    const schema = buildSchema(headers)
    if (!schema.task) {
      return { success: false, error: 'Coluna "Nome da Tarefa" não encontrada no arquivo.' }
    }

    const parsed = await readXlsxFile(buffer, { schema })
    const rows = parsed.rows as any[]
    
    console.log('Total linhas com schema:', rows.length)
    if (rows.length > 0) {
      console.log('Primeira linha parseada:', rows[0])
    }
    
    if (parsed.errors && parsed.errors.length > 0) {
      console.error('Erros de parsing:', parsed.errors)
    }

    const createdItemsMap = new Map<string, string>() // Map MS_ID -> DB_UUID
    const dependenciesToProcess: { dbId: string, preds: string }[] = []
    const warnings: string[] = []

    // 2. Criar Itens Sequencialmente (para ter IDs) e Validar
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const taskName = row.task
        if (!taskName) continue

        // Identificadores
        const msId = row.msId || (i + 1) // ID do Project ou linha + 1
        const wbsVal = row.wbs || row.wbs_alt

        // Datas
        const datePlanned = parseExcelDate(row.startPlanned || row.start)
        const dateActualStart = parseExcelDate(row.startActual)
        const dateActual = parseExcelDate(row.endActual)

        // Calcular Duração
        const duration = parseDuration(row.duration)

        // Calcular Data Prevista Fim se vazia
        let datePlannedEnd = parseExcelDate(row.endPlanned || row.end)
        if (!datePlannedEnd && datePlanned && duration > 0) {
            datePlannedEnd = addBusinessDays(datePlanned, Math.ceil(duration))
        }

        // Validar Recurso
        let responsible = row.resources || null
        if (responsible) {
            const checkName = responsible.split(';')[0].trim().toLowerCase()
            if (!validMemberNames.has(checkName)) {
                warnings.push(`Recurso "${responsible}" na tarefa "${taskName}" não encontrado no projeto.`)
                responsible = null 
            }
        }

        const progressVal = row.progress
        const status = (progressVal === 1 || progressVal === '100%') ? 'Concluído' : 'A Fazer'

        const item = await prisma.projectItem.create({
            data: {
                projectId,
                tenantId: project.tenantId || user.tenantId || undefined,
                task: taskName,
                originSheet: 'CRONOGRAMA_IMPORT',
                wbs: wbsVal ? String(wbsVal) : null,
                status,
                responsible,
                datePlanned,
                datePlannedEnd,
                dateActualStart,
                dateActual,
                duration,
                metadata: {
                    progress: progressVal,
                    originalDuration: row.duration,
                    msId: msId
                }
            }
        })
        
        createdItemsMap.set(String(msId), item.id)

        if (row.predecessors) {
            dependenciesToProcess.push({ dbId: item.id, preds: String(row.predecessors) })
        }
    }

    // 3. Processar Predecessoras (Relacionamentos)
    let depCount = 0
    for (const dep of dependenciesToProcess) {
        const predParts = dep.preds.split(/[;,]/)
        for (const part of predParts) {
            const match = part.trim().match(/^(\d+)/)
            if (match) {
                const predMsId = match[1]
                const predDbId = createdItemsMap.get(predMsId)
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

    revalidatePath(`/dashboard/projetos/${projectId}`)
    
    return { 
      success: true, 
      count: createdItemsMap.size,
      message: `${createdItemsMap.size} tarefas importadas e ${depCount} dependências conectadas.`,
      stats: {
          imported: createdItemsMap.size,
          dependencies: depCount,
          warnings: warnings.slice(0, 10)
      }
    }

  } catch (error) {
    console.error('Erro na importação:', error)
    return { success: false, error: 'Falha ao processar arquivo Excel' }
  }
}
