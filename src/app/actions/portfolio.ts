"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/access-control";

export async function getDocuments() {
  try {
    await requireAuth()
    return await (prisma as any).document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        projectItem: {
          select: { task: true }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

export async function getProjectPrioritization() {
  try {
    await requireAuth()
    const projects = await (prisma as any).projectCanvas.findMany({
      select: {
        projectName: true,
        impactScore: true,
        complexityScore: true,
        approvalStatus: true
      }
    });

    return projects.map((p: any) => ({
      ...p,
      valueScore: p.complexityScore > 0 ? (p.impactScore / p.complexityScore).toFixed(2) : 0
    })).sort((a: any, b: any) => b.valueScore - a.valueScore);
  } catch (error) {
    console.error("Error fetching prioritization:", error);
    return [];
  }
}
export async function uploadDocument(data: { name: string, type: string, url: string, projectName?: string }) {
  try {
    await requireAuth()
    const doc = await (prisma as any).document.create({
      data: {
        ...data,
        uploadedAt: new Date()
      }
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard");
    return { success: true, doc };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error };
  }
}
