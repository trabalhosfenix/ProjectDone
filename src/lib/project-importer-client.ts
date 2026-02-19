
export interface ImportedTask {
  name: string
  start?: string
  end?: string
  duration?: number
  progress?: number
  notes?: string
  responsible?: string
}

export const parseMSProjectXML = (xmlContent: string): ImportedTask[] => {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml")
    
    const tasks = Array.from(xmlDoc.getElementsByTagName("Task"))
    const result: ImportedTask[] = []

    tasks.forEach(task => {
      const name = task.getElementsByTagName("Name")[0]?.textContent || ""
      // Ignorar tarefas raiz ou vazias se necessário
      if (!name) return

      const start = task.getElementsByTagName("Start")[0]?.textContent
      const finish = task.getElementsByTagName("Finish")[0]?.textContent
      const percentComplete = task.getElementsByTagName("PercentComplete")[0]?.textContent
      const active = task.getElementsByTagName("Active")[0]?.textContent
      
      // Ignorar inativas se quiser
      if (active === '0') return

      result.push({
        name,
        start: start || undefined,
        end: finish || undefined,
        progress: percentComplete ? parseInt(percentComplete) / 100 : 0
      })
    })

    return result
  } catch (error) {
    console.error("Erro ao parsear XML", error)
    return []
  }
}
