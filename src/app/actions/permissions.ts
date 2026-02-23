"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isAdminSession() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

export async function getRoles() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return [];

  return await prisma.role.findMany({
    orderBy: { name: "asc" }
  });
}

export async function createRole(name: string) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { success: false, error: "Acesso negado." };

    const role = await prisma.role.create({
      data: {
        name,
        permissions: {
          dashboard: true,
          kanban: false,
          portfolio: false,
          resources: false,
          canvas: false,
          library: false,
          data: false,
          settings: false
        }
      }
    });
    revalidatePath("/dashboard");
    return { success: true, role };
  } catch {
    return { success: false, error: "Erro ao criar nível." };
  }
}

export async function updateRolePermissions(id: string, permissions: Record<string, boolean>) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { success: false, error: "Acesso negado." };

    await prisma.role.update({
      where: { id },
      data: { permissions }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar permissões." };
  }
}

export async function deleteRole(id: string) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { success: false, error: "Acesso negado." };

    await prisma.role.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao deletar nível." };
  }
}

export async function assignRoleToUser(userId: string, roleId: string | null) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { success: false, error: "Acesso negado." };

    await prisma.user.update({
      where: { id: userId },
      data: { roleId }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atribuir nível ao usuário." };
  }
}

// Buscar perfis com contagem de usuários
export async function getRolesWithUserCount() {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { roles: [], usersWithoutRole: 0 };

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: "asc" }
    });

    // Contar usuários sem perfil
    const usersWithoutRole = await prisma.user.count({
      where: { roleId: null }
    });

    return {
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        userCount: role._count.users
      })),
      usersWithoutRole
    };
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return { roles: [], usersWithoutRole: 0 };
  }
}

// Filtrar perfis por permissão específica
export async function filterRolesByPermission(permissionKey: string) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) return { roles: [], usersWithoutRole: 0 };

    if (!permissionKey || permissionKey === "all") {
      return getRolesWithUserCount();
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: "asc" }
    });

    // Filtrar roles que têm a permissão ativa
    const filteredRoles = roles.filter(role => {
      const permissions = role.permissions as Record<string, boolean>;
      return permissions[permissionKey] === true;
    });

    const usersWithoutRole = await prisma.user.count({
      where: { roleId: null }
    });

    return {
      roles: filteredRoles.map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        userCount: role._count.users
      })),
      usersWithoutRole
    };
  } catch (error) {
    console.error("Erro ao filtrar perfis:", error);
    return { roles: [], usersWithoutRole: 0 };
  }
}
