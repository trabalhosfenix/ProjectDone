"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type SessionUser = {
  id?: string;
  role?: string;
  tenantId?: string | null;
};

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const user = (session?.user || {}) as SessionUser;

  if (user.role !== "ADMIN") {
    return { authorized: false as const, user: null };
  }

  return { authorized: true as const, user };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getTenants() {
  const session = await getAdminSession();
  if (!session.authorized) return [];

  return prisma.tenant.findMany({
    where: session.user.tenantId ? { id: session.user.tenantId } : undefined,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },
  });
}

export async function createTenant(input: { name?: string; slug?: string }) {
  const session = await getAdminSession();
  if (!session.authorized) {
    return { success: false, error: "Apenas administradores podem criar tenants." };
  }

  if (session.user.tenantId) {
    return { success: false, error: "Admin de tenant não pode criar novo tenant." };
  }

  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: "Nome do tenant é obrigatório." };
  }

  const slug = slugify(input.slug || name);
  if (!slug) {
    return { success: false, error: "Slug inválido." };
  }

  try {
    await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return { success: false, error: "Slug já utilizado por outro tenant." };
    }
    return { success: false, error: "Erro ao criar tenant." };
  }
}

export async function updateTenantStatus(tenantId: string, isActive: boolean) {
  const session = await getAdminSession();
  if (!session.authorized) {
    return { success: false, error: "Apenas administradores podem alterar tenants." };
  }

  if (!tenantId) {
    return { success: false, error: "Tenant inválido." };
  }

  if (session.user.tenantId && session.user.tenantId !== tenantId) {
    return { success: false, error: "Sem permissão para alterar este tenant." };
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar status do tenant." };
  }
}
