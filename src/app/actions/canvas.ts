"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/access-control";

export async function getProjectCanvas(projectName: string) {
  try {
    await requireAuth()
    const canvas = await (prisma as any).projectCanvas.findUnique({
      where: { projectName }
    });
    return canvas || null;
  } catch (error) {
    console.error("Error fetching canvas:", error);
    return null;
  }
}

export async function updateProjectCanvas(projectName: string, data: any) {
  try {
    await requireAuth()
    const canvas = await (prisma as any).projectCanvas.upsert({
      where: { projectName },
      update: data,
      create: {
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
