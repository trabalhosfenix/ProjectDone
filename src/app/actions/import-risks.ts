/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

function classifyRisk(probability: number, impact: number) {
  const severity = probability * impact
  if (severity >= 15) return { severity, level: 'Crítico', priority: 'P1' }
  if (severity >= 10) return { severity, level: 'Alto', priority: 'P2' }
  if (severity >= 5) return { severity, level: 'Médio', priority: 'P3' }
  return { severity, level: 'Baixo', priority: 'P4' }
}


export async function importRisksExcel(formData: FormData) {
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string

  if (!file || !projectId) {
    return { success: false, error: 'Arquivo e projeto são obrigatórios' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return { success: false, error: 'Planilha vazia' }
    }

    const stats = {
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const row of data as any[]) {
      try {
        // Mapear colunas - aceita diversos formatos
        const description = row['Descrição'] || row['Risco'] || row['Description'] || row['Nome']
        
        if (!description) {
          stats.skipped++
          continue
        }

        const type = row['Tipo'] || row['Type'] || 'Ameaça'
        const category = row['Categoria'] || row['Category'] || 'Gerencial'
        const probability = parseInt(row['Probabilidade'] || row['Probability'] || '3') || 3
        const impact = parseInt(row['Impacto'] || row['Impact'] || '3') || 3
        const classified = classifyRisk(probability, impact)
        const responseStrategy = row['Estratégia'] || row['Strategy'] || row['Estrategia'] || 'Mitigar'
        const responsePlan = row['Plano de Ação'] || row['Plano'] || row['Response Plan'] || ''
        const owner = row['Responsável'] || row['Owner'] || row['Dono'] || ''
        const causes = row['Causas'] || row['Causes'] || ''
        const consequences = row['Consequências'] || row['Consequences'] || ''
        const contingency = row['Contingência'] || row['Contingency'] || ''
        const status = row['Status'] || 'Ativo'

        await prisma.projectRisk.create({
          data: {
            projectId,
            description,
            type,
            category,
            probability,
            impact,
            severity: classified.severity,
            responseStrategy,
            owner,
            causes,
            consequences,
            contingency,
            status,
            responsePlan: `${responsePlan}\n[Nível: ${classified.level} | Prioridade: ${classified.priority}]`.trim()
          }
        })

        stats.imported++
      } catch (err: any) {
        stats.errors.push(`Linha ${stats.imported + stats.skipped + 1}: ${err.message}`)
        stats.skipped++
      }
    }

    revalidatePath(`/dashboard/projetos/${projectId}/riscos`)
    
    return { 
      success: true, 
      message: `${stats.imported} riscos importados com sucesso!`,
      stats
    }
  } catch (error: any) {
    console.error('Erro na importação de riscos:', error)
    return { success: false, error: error.message || 'Erro ao processar arquivo' }
  }
}
