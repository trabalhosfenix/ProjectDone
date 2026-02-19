import { ProjectEAPChart } from '@/components/project/project-eap-chart'
import { getProjectItemsForEAP } from '@/app/actions/eap-actions'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectPageHeader } from '@/components/project/project-page-header'

function buildTree(flatItems: any[]) {
  // Ordenar por WBS (ex: 1, 1.1, 1.2, 2, 10...)
  const sorted = [...flatItems].sort((a, b) => {
    // Se não tiver WBS, tenta usar externalId ou task. Mas WBS tem prioridade.
    const wbsA = a.wbs || a.task || ''
    const wbsB = b.wbs || b.task || ''
    return wbsA.localeCompare(wbsB, undefined, { numeric: true, sensitivity: 'base' })
  })

  // Hashmap para acesso rápido por WBS (opcional, mas o algoritmo de stack funciona bem para lista ordenada)
  // Como WBS do MS Project às vezes pula níveis ou tem IDs quebrados, o algoritmo de Stack é robusto.

  const rootItems: any[] = []
  const stack: { item: any, depth: number }[] = [] 

  for (const item of sorted) {
    if (!item.task) continue

    // Prioridade: Campo WBS > Regex no Nome
    let wbsCode = item.wbs
    
    // Fallback: Tentar extrair do nome se wbs for nulo (retrocompatibilidade)
    if (!wbsCode) {
        const match = item.task.match(/^(\d+(\.\d+)*)/)
        if (match) wbsCode = match[0]
    }
    
    // Calcular profundidade
    let depth = 0
    if (wbsCode) {
        // "1" -> depth 1. "1.1" -> depth 2.
        // Se terminar com ponto "1.", remove
        const clean = wbsCode.replace(/\.$/, '')
        depth = clean.split('.').length
    }

    const treeItem = { ...item, children: [] }

    if (depth === 0) {
        // Item sem hierarquia -> Raiz
        rootItems.push(treeItem)
        continue
    }

    if (depth === 1) {
        // Nível Superior
        rootItems.push(treeItem)
        while(stack.length > 0) stack.pop()
        stack.push({ item: treeItem, depth })
    } else {
        // Nível Inferior
        // Tenta encontrar o pai direto (depth - 1)
        // O MS Project garante hierarquia sequencial na lista geralmente.
        
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop()
        }
        
        if (stack.length > 0) {
            const parent = stack[stack.length - 1].item
            parent.children.push(treeItem)
            stack.push({ item: treeItem, depth })
        } else {
            // Orfão
            rootItems.push(treeItem)
            stack.push({ item: treeItem, depth })
        }
    }
  }

  return rootItems
}

export default async function EAPPage({ params }: { params: { id: string } }) {
  const { data: items } = await getProjectItemsForEAP(params.id)
  
  const treeItems = buildTree(items || [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <ProjectDetailTabs projectId={params.id} />
       <ProjectHorizontalMenu projectId={params.id} />
       
       <div className="flex-1 container mx-auto p-6 max-w-5xl">
            <ProjectPageHeader 
                title="EAP / Dicionário da EAP" 
                description="Estrutura Analítica do Projeto (Visualização Gráfica)"
                projectId={params.id}
            />
            <ProjectEAPChart items={treeItems} />
       </div>
    </div>
  )
}
