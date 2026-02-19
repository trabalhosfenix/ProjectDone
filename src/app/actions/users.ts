"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function getUsers() {
  try {
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

export async function createUser(formData: any) {
  try {
    const { 
        name, email, password, role, roleId, 
        code, organization, area, jobTitle, functionalManager, phone, notes,
        defaultCost, defaultRevenue, workHours
    } = formData;
    
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
        defaultCost: defaultCost ? parseFloat(defaultCost) : 0,
        defaultRevenue: defaultRevenue ? parseFloat(defaultRevenue) : 0,
        workHours: workHours ? parseFloat(workHours) : 8
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Este e-mail já está cadastrado." };
    }
    return { success: false, error: "Erro ao criar usuário." };
  }
}

export async function deleteUser(id: string) {
  try {
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
