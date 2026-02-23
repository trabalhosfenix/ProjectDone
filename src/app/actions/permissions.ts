"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isAdminSession() {
  const session = await getServerSession(authOptions);
  const user = (session?.user as { role?: string; tenantId?: string | null } | undefined) || {};
  return {
    isAdmin: user.role === "ADMIN",
    tenantId: user.tenantId || null,
  };
}

function buildRoleScope(tenantId: string | null) {
  return tenantId ? { tenantId } : {};
}

export async function getRoles() {
  const session = await isAdminSession();
  if (!session.isAdmin) return [];

  return await prisma.role.findMany({
    where: buildRoleScope(session.tenantId),
    orderBy: { name: "asc" }
  });
}

export async function createRole(name: string) {
  try {
    const session = await isAdminSession();
    if (!session.isAdmin) return { success: false, error: "Acesso negado." };

    const role = await prisma.role.create({
      data: {
        name,
        tenantId: session.tenantId || undefined,
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
    const session = await isAdminSession();
    if (!session.isAdmin) return { success: false, error: "Acesso negado." };

    const role = await prisma.role.findFirst({
      where: {
        id,
        ...buildRoleScope(session.tenantId),
      },
      select: { id: true },
    });

    if (!role) {
      return { success: false, error: "Perfil não encontrado." };
    }

    await prisma.role.update({
      where: { id: role.id },
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
    const session = await isAdminSession();
    if (!session.isAdmin) return { success: false, error: "Acesso negado." };

    const role = await prisma.role.findFirst({
      where: {
        id,
        ...buildRoleScope(session.tenantId),
      },
      select: { id: true },
    });

    if (!role) {
      return { success: false, error: "Perfil não encontrado." };
    }

    await prisma.role.delete({
      where: { id: role.id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao deletar nível." };
  }
}

export async function assignRoleToUser(userId: string, roleId: string | null) {
  try {
    const session = await isAdminSession();
    if (!session.isAdmin) return { success: false, error: "Acesso negado." };

    if (roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          ...buildRoleScope(session.tenantId),
        },
        select: { id: true },
      });

      if (!role) {
        return { success: false, error: "Perfil inválido para este tenant." };
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        ...(session.tenantId ? { tenantId: session.tenantId } : {}),
      },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado para este tenant." };
    }

    await prisma.user.update({
      where: { id: user.id },
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
    const session = await isAdminSession();
    if (!session.isAdmin) return { roles: [], usersWithoutRole: 0 };

    const roles = await prisma.role.findMany({
      where: buildRoleScope(session.tenantId),
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: "asc" }
    });

    // Contar usuários sem perfil
    const usersWithoutRole = await prisma.user.count({
      where: {
        roleId: null,
        ...(session.tenantId ? { tenantId: session.tenantId } : {}),
      }
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
    const session = await isAdminSession();
    if (!session.isAdmin) return { roles: [], usersWithoutRole: 0 };

    if (!permissionKey || permissionKey === "all") {
      return getRolesWithUserCount();
    }

    const roles = await prisma.role.findMany({
      where: buildRoleScope(session.tenantId),
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
      where: {
        roleId: null,
        ...(session.tenantId ? { tenantId: session.tenantId } : {}),
      }
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
