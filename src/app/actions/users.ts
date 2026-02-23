"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface CreateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  roleId?: string | null;
  code?: string;
  organization?: string;
  area?: string;
  jobTitle?: string;
  functionalManager?: string;
  phone?: string;
  notes?: string;
  defaultCost?: string | number;
  defaultRevenue?: string | number;
  workHours?: string | number;
  tenantId?: string;
}

type SessionUser = {
  id?: string;
  role?: string;
  tenantId?: string | null;
};

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const user = (session?.user || {}) as SessionUser;
  return {
    isAdmin: user.role === "ADMIN",
    user,
  };
}

export async function getUsers() {
  try {
    const session = await getAdminSession();
    if (!session.isAdmin) return [];

    return await prisma.user.findMany({
      where: session.user.tenantId ? { tenantId: session.user.tenantId } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function createUser(formData: CreateUserInput) {
  try {
    const session = await getAdminSession();
    if (!session.isAdmin) {
      return { success: false, error: "Acesso negado. Apenas administradores podem criar usuários." };
    }

    const { 
        name, email, password, role, roleId, 
        code, organization, area, jobTitle, functionalManager, phone, notes,
        defaultCost, defaultRevenue, workHours, tenantId
    } = formData;

    if (!name || !email || !password) {
      return { success: false, error: "Nome, e-mail e senha são obrigatórios." };
    }

    const parseNumericInput = (value: string | number | undefined, fallback: number) => {
      if (value === undefined || value === null || value === "") return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (session.user.tenantId && tenantId && tenantId !== session.user.tenantId) {
      return { success: false, error: "Sem permissão para criar usuário em outro tenant." };
    }

    const effectiveTenantId = tenantId || session.user.tenantId || undefined;

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        roleId: roleId && roleId !== "none" ? roleId : null,
        
        // Novos campos
        code,
        organization,
        area,
        jobTitle,
        functionalManager,
        phone,
        notes,
        defaultCost: parseNumericInput(defaultCost, 0),
        defaultRevenue: parseNumericInput(defaultRevenue, 0),
        workHours: parseNumericInput(workHours, 8),
        tenantId: effectiveTenantId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const code = (error as { code?: string } | null)?.code;
    if (code === 'P2002') {
      return { success: false, error: "Este e-mail já está cadastrado." };
    }
    return { success: false, error: "Erro ao criar usuário." };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await getAdminSession();
    if (!session.isAdmin) {
      return { success: false, error: "Acesso negado. Apenas administradores podem remover usuários." };
    }

    if (session.user.id === id) {
      return { success: false, error: "Não é permitido remover o próprio usuário." };
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!existing) {
      return { success: false, error: "Usuário não encontrado." };
    }

    if (session.user.tenantId && existing.tenantId && session.user.tenantId !== existing.tenantId) {
      return { success: false, error: "Sem permissão para remover usuário de outro tenant." };
    }

    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
}

// Seed function to create the first admin if database is empty
export async function seedFirstAdmin() {
  try {
    if (process.env.ALLOW_BOOTSTRAP_ADMIN !== "true") {
      return { success: false, message: "Bootstrap de admin desativado." };
    }

    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          name: "Administrador",
          email: "admin@empresa.com",
          password: hashedPassword,
          role: "ADMIN"
        }
      });
      return { success: true, message: "Admin padrão criado." };
    }
    return { success: true, message: "Admin já existe." };
  } catch (error) {
    console.error("Seed error:", error);
    return { success: false };
  }
}

export async function getSession() {
    // Helper to be used in server components if needed
}
