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
}

async function isAdminSession() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

export async function getUsers() {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return [];

    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Acesso negado. Apenas administradores podem criar usuários." };
    }

    const { 
        name, email, password, role, roleId, 
        code, organization, area, jobTitle, functionalManager, phone, notes,
        defaultCost, defaultRevenue, workHours
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
        workHours: parseNumericInput(workHours, 8)
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
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Acesso negado. Apenas administradores podem remover usuários." };
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
