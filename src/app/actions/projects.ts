"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipos
export type ProjectFilters = {
  search?: string;
  status?: string[];
  area?: string[];
  type?: string[];
  program?: string[];
  managerId?: string;
};

// Listar projetos com filtros
export async function getProjects(filters?: ProjectFilters) {
  try {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.area && filters.area.length > 0) {
      where.area = { in: filters.area };
    }

    if (filters?.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters?.program && filters.program.length > 0) {
      where.program = { in: filters.program };
    }

    if (filters?.managerId) {
      where.managerId = filters.managerId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        importedProjects: {
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            externalUid: true,
            externalProjectId: true,
            source: true,
            syncMode: true,
            syncStatus: true,
            lastSyncAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Erro ao buscar projetos" };
  }
}

// Buscar projeto por ID
export async function getProjectById(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          take: 10, // Últimas 10 tarefas
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Projeto não encontrado" };
    }

    return { success: true, project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, error: "Erro ao buscar projeto" };
  }
}

// Criar projeto
export async function createProject(data: {
  name: string;
  description?: string;
  code?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  area?: string;
  program?: string;
  portfolio?: string;
  strategicPlan?: string;
  managerId?: string;
  managerName?: string;
  client?: string;
  budget?: number;
  priority?: string;
}) {
  try {
    const project = await prisma.project.create({
      data: {
        ...data,
        code: data.code || `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        status: data.status || "A iniciar",
        priority: data.priority || "Média",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (error: any) {
    console.error("Error creating project:", error);
    
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      return { success: false, error: "Código de projeto já existe" };
    }
    
    return { success: false, error: "Erro ao criar projeto" };
  }
}

// Atualizar projeto
export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    code: string;
    status: string;
    type: string;
    startDate: Date | null;
    endDate: Date | null;
    realEndDate: Date | null;
    area: string;
    program: string;
    portfolio: string;
    strategicPlan: string;
    managerId: string;
    managerName: string;
    client: string;
    budget: number;
    actualCost: number;
    progress: number;
    priority: string;
    impactScore: number;
    complexityScore: number;
    justification: string;
    objective: string;
    assumptions: string;
    constraints: string;
  }>
) {
  try {
    const project = await prisma.project.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (error: any) {
    console.error("Error updating project:", error);
    
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      return { success: false, error: "Código de projeto já existe" };
    }
    
    if (error.code === "P2025") {
      return { success: false, error: "Projeto não encontrado" };
    }
    
    return { success: false, error: "Erro ao atualizar projeto" };
  }
}

// Deletar projeto
export async function deleteProject(id: string) {
  try {
    // Verificar se tem tarefas associadas
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Projeto não encontrado" };
    }

    if (project._count.items > 0) {
      return {
        success: false,
        error: `Não é possível excluir. Existem ${project._count.items} tarefa(s) vinculada(s).`,
      };
    }

    await prisma.project.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Erro ao deletar projeto" };
  }
}

// Obter opções únicas para filtros
export async function getProjectFilterOptions() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        status: true,
        area: true,
        type: true,
        program: true,
        portfolio: true,
      },
    });

    const statuses = [...new Set(projects.map((p) => p.status).filter(Boolean))];
    const areas = [...new Set(projects.map((p) => p.area).filter(Boolean))];
    const types = [...new Set(projects.map((p) => p.type).filter(Boolean))];
    const programs = [...new Set(projects.map((p) => p.program).filter(Boolean))];
    const portfolios = [...new Set(projects.map((p) => p.portfolio).filter(Boolean))];

    return {
      success: true,
      options: {
        statuses,
        areas,
        types,
        programs,
        portfolios,
      },
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { success: false, error: "Erro ao buscar opções de filtro" };
  }
}

// Estatísticas de projetos
export async function getProjectStats() {
  try {
    const total = await prisma.project.count();
    const byStatus = await prisma.project.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats = {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return { success: false, error: "Erro ao buscar estatísticas" };
  }
}
