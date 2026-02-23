"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncProjectProgress } from '@/lib/project-progress'
import { syncStatusAndProgress } from '@/lib/project-item-flow'

export async function getProjectItems() {
  try {
    return await prisma.projectItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
}

export async function updateItemStatus(id: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    const oldItem = await prisma.projectItem.findUnique({ where: { id } });

    if (!oldItem) {
      return { success: false, error: 'Item não encontrado' }
    }
    
    const flow = syncStatusAndProgress({
      currentStatus: oldItem.status,
      currentMetadata: oldItem.metadata,
      patchStatus: status,
    })

    const updateData: {
      status: string
      dateActualStart?: Date
      dateActual?: Date | null
      metadata: Record<string, unknown>
    } = {
      status: flow.status,
      metadata: flow.metadata,
    }

    if (flow.status === 'Em andamento' && !oldItem.dateActualStart) {
      updateData.dateActualStart = new Date()
    }

    if (flow.status === 'Concluído') {
      if (!oldItem.dateActual) {
        updateData.dateActual = new Date()
      }
    }

    if (flow.status !== 'Concluído' && oldItem.dateActual) {
      updateData.dateActual = null
    }

    await prisma.projectItem.update({
      where: { id },
      data: updateData,
    });

    // Registrar no histórico
    if (oldItem && oldItem.status !== flow.status) {
      await prisma.auditLog.create({
        data: {
          projectItemId: id,
          userId: (session?.user as any)?.id,
          userName: session?.user?.name || session?.user?.email || "Sistema",
          field: "Status",
          oldValue: oldItem.status,
          newValue: flow.status
        }
      });

      if (oldItem.projectId) {
        await syncProjectProgress(oldItem.projectId)
      }
    } else if (oldItem.projectId) {
      await syncProjectProgress(oldItem.projectId)
    }

    revalidatePath("/dashboard");
    if (oldItem.projectId) {
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/kanban`)
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/acompanhamento/kanban`)
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/monitorar`)
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/cronograma`)
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/gantt`)
      revalidatePath(`/dashboard/projetos/${oldItem.projectId}/situacao`)
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error };
  }
}

export async function updateItemDate(id: string, date: Date | null) {
  try {
    const session = await getServerSession(authOptions);
    const oldItem = await prisma.projectItem.findUnique({ where: { id } });

    await prisma.projectItem.update({
      where: { id },
      data: { dateActual: date },
    });

    // Registrar no histórico
    if (oldItem) {
      await prisma.auditLog.create({
        data: {
          projectItemId: id,
          userId: (session?.user as any)?.id,
          userName: session?.user?.name || session?.user?.email || "Sistema",
          field: "Data de Conclusão",
          oldValue: oldItem.dateActual?.toISOString() || null,
          newValue: date?.toISOString() || null
        }
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating date:", error);
    return { success: false, error };
  }
}

export async function getStatusOptions() {
  try {
    return await prisma.statusOption.findMany({
      orderBy: { label: "asc" },
    });
  } catch (error) {
    console.error("Error fetching status options:", error);
    return [];
  }
}
export async function updateItemPriority(id: string, priority: string) {
  try {
    const session = await getServerSession(authOptions);
    const oldItem = await prisma.projectItem.findUnique({ where: { id } });

    await prisma.projectItem.update({
      where: { id },
      data: { priority },
    });

    if (oldItem && (oldItem as any).priority !== priority) {
      await prisma.auditLog.create({
        data: {
          projectItemId: id,
          userId: (session?.user as any)?.id,
          userName: session?.user?.name || session?.user?.email || "Sistema",
          field: "Prioridade",
          oldValue: (oldItem as any).priority,
          newValue: priority
        }
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating priority:", error);
    return { success: false, error };
  }
}

export async function createStatusOption(label: string) {
  try {
    const existing = await prisma.statusOption.findUnique({ where: { label } });
    if (existing) return { success: false, error: "Status já existe" };

    await prisma.statusOption.create({
      data: { label }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error creating status option:", error);
    return { success: false, error };
  }
}

export async function deleteStatusOption(id: number) {
  try {
    await prisma.statusOption.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting status option:", error);
    return { success: false, error };
  }
}
export async function createProjectItem(data: { task: string, status: string, originSheet: string, projectId?: string, wbs?: string }) {
  try {
    const session = await getServerSession(authOptions);
    const item = await prisma.projectItem.create({
      data: {
        ...data,
        wbs: data.wbs?.trim() || null,
        priority: "Média"
      }
    });

    await prisma.auditLog.create({
      data: {
        projectItemId: item.id,
        userId: (session?.user as any)?.id,
        userName: session?.user?.name || session?.user?.email || "Sistema",
        field: "Criação",
        oldValue: null,
        newValue: `Tarefa "${data.task}" criada via Kanban`
      }
    });

    revalidatePath("/dashboard");
    return { success: true, item };
  } catch (error) {
    console.error("Error creating project item:", error);
    return { success: false, error };
  }
}
export async function updateItemPerspective(id: string, perspective: string) {
  try {
    const session = await getServerSession(authOptions);
    const oldItem = await prisma.projectItem.findUnique({ where: { id } });
    
    await prisma.projectItem.update({
      where: { id },
      data: { perspective }
    });

    if (oldItem && (oldItem as any).perspective !== perspective) {
      await prisma.auditLog.create({
        data: {
          projectItemId: id,
          userId: (session?.user as any)?.id,
          userName: session?.user?.name || session?.user?.email || "Sistema",
          field: "Perspectiva",
          oldValue: (oldItem as any).perspective || "Geral",
          newValue: perspective
        }
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating item perspective:", error);
    return { success: false, error };
  }
}
