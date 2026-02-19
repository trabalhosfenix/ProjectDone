"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAuditHistory(projectItemId: string) {
  try {
    return await prisma.auditLog.findMany({
      where: { projectItemId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export async function getComments(projectItemId: string) {
  try {
    return await prisma.comment.findMany({
      where: { projectItemId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function addComment(projectItemId: string, content: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.comment.create({
      data: {
        projectItemId,
        userId: (session.user as any).id,
        userName: session.user.name || session.user.email || "Usuário",
        content,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error };
  }
}
