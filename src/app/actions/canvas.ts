"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/access-control";

export async function getProjectCanvas(projectName: string) {
  try {
    const user = await requireAuth()
    if (!user.tenantId) {
      throw new Error('Usuário sem tenant para consultar canvas')
    }

    const canvas = await prisma.projectCanvas.findUnique({
      where: {
        tenantId_projectName: {
          tenantId: user.tenantId,
          projectName,
        },
      },
    });
    return canvas || null;
  } catch (error) {
    console.error("Error fetching canvas:", error);
    return null;
  }
}

export async function updateProjectCanvas(projectName: string, data: any) {
  try {
    const user = await requireAuth()
    if (!user.tenantId) {
      throw new Error('Usuário sem tenant para atualizar canvas')
    }

    const canvas = await prisma.projectCanvas.upsert({
      where: {
        tenantId_projectName: {
          tenantId: user.tenantId,
          projectName,
        },
      },
      update: data,
      create: {
        tenantId: user.tenantId,
        projectName,
        ...data
      }
    });
    revalidatePath("/dashboard");
    return { success: true, canvas };
  } catch (error) {
    console.error("Error updating canvas:", error);
    return { success: false, error };
  }
}
