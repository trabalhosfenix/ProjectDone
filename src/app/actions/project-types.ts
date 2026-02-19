"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getProjectTypes() {
  try {
    const types = await prisma.projectType.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, types }
  } catch (error) {
    console.error("Erro ao buscar tipos de projeto:", error)
    return { success: false, error: "Falha ao carregar tipos" }
  }
}

export async function createProjectType(name: string) {
  try {
    if (!name) return { success: false, error: "Nome é obrigatório" }

    await prisma.projectType.create({
      data: { name }
    })
    
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erro ao criar tipo:", error)
    return { success: false, error: "Falha ao criar tipo (talvez já exista?)" }
  }
}

export async function updateProjectType(id: string, name: string, active: boolean) {
  try {
    await prisma.projectType.update({
      where: { id },
      data: { name, active }
    })
    
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar tipo:", error)
    return { success: false, error: "Falha ao atualizar tipo" }
  }
}

export async function deleteProjectType(id: string) {
  try {
    await prisma.projectType.delete({
      where: { id }
    })
    
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erro ao excluir tipo:", error)
    return { success: false, error: "Falha ao excluir tipo" }
  }
}

// Seed inicial se necessário
export async function seedProjectTypes() {
  const defaults = ["Implementação", "Pesquisa", "Manutenção", "Melhoria", "Suporte"]
  
  for (const name of defaults) {
    const exists = await prisma.projectType.findUnique({ where: { name } })
    if (!exists) {
      await prisma.projectType.create({ data: { name } })
    }
  }
  return { success: true }
}
