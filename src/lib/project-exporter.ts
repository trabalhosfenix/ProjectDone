import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export const exportProjectToExcel = async (projectId: string, projectName: string = 'Projeto') => {
  try {
    // 1. Buscar dados
    const response = await fetch(`/api/projects/${projectId}/items`)
    const result = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error('Falha ao buscar dados do projeto')
    }
    
    const tasks = result.data
    
    // 2. Formatar para Excel
    const excelData = tasks.map((t: any) => ({
      // 'ID': t.id, // Removido a pedido
      'Nome da Tarefa': t.task,
      'Início': t.datePlanned ? new Date(t.datePlanned).toLocaleDateString('pt-BR') : '',
      'Término': t.dateActual ? new Date(t.dateActual).toLocaleDateString('pt-BR') : '',
      'Duração': (t.metadata as any)?.duration || '',
      '% Concluída': (t.metadata as any)?.progress ? `${((t.metadata as any).progress * 100).toFixed(0)}%` : '0%',
      'Responsável': t.responsible || '',
      'Status': t.status || 'A Fazer',
      'Predecessoras': (t.metadata as any)?.predecessors || '',
    }))

    // 3. Gerar Planilha
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cronograma')

    // 4. Salvar Arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
    
    saveAs(data, `${projectName}_Cronograma.xlsx`)
    return true
  } catch (error) {
    console.error('Erro na exportação:', error)
    return false
  }
}

export const exportProjectToMSProject = async (projectId: string, projectName: string = 'Projeto') => {
  // Exportação básica XML para MS Project
  try {
    const response = await fetch(`/api/projects/${projectId}/items`)
    const result = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error('Falha ao buscar dados')
    }
    
    const tasks = result.data
    
    // Cabeçalho XML básico do MSPDI (Microsoft Project Data Interchange)
    let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
    <Name>${projectName}</Name>
    <Tasks>`

    tasks.forEach((t: any, index: number) => {
        xml += `
        <Task>
            <UID>${index + 1}</UID>
            <ID>${index + 1}</ID>
            <Name>${t.task.replace(/&/g, '&amp;')}</Name>
            <Active>1</Active>
            <Manual>0</Manual>
            <Start>${t.datePlanned || new Date().toISOString()}</Start>
            <Finish>${t.dateActual || new Date().toISOString()}</Finish>
            <PercentComplete>${(t.metadata as any)?.progress ? (t.metadata as any).progress * 100 : 0}</PercentComplete>
        </Task>`
    })

    xml += `
    </Tasks>
</Project>`

    const data = new Blob([xml], { type: 'application/xml;charset=UTF-8' })
    saveAs(data, `${projectName}.xml`)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
