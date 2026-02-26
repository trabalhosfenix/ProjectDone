import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildProjectScope, requireAuth } from "@/lib/access-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle2, Building2, FolderKanban, BriefcaseBusiness } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
  const currentUser = await requireAuth();
  const projectScope = buildProjectScope(currentUser);

  const [user, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        area: true,
        jobTitle: true,
        functionalManager: true,
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      where: projectScope,
      select: {
        id: true,
        name: true,
        code: true,
        client: true,
        status: true,
        members: {
          where: { userId: currentUser.id },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const uniqueClients = Array.from(
    new Set(projects.map((project) => project.client).filter((client): client is string => Boolean(client?.trim())))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-full bg-gray-50 p-6 md:p-8 space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-[#094160]">
            <UserCircle2 className="w-6 h-6" />
            Minha Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nome</p>
            <p className="font-semibold text-gray-900">{user?.name || "Não informado"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-semibold text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Tipo de acesso</p>
            <p className="font-semibold text-gray-900">{user?.role || "USER"}</p>
          </div>
          <div>
            <p className="text-gray-500">Conta</p>
            <p className="font-semibold text-gray-900">{user?.tenant?.name || "Sem conta vinculada"}</p>
          </div>
          <div>
            <p className="text-gray-500">Organização</p>
            <p className="font-semibold text-gray-900">{user?.organization || "Não informado"}</p>
          </div>
          <div>
            <p className="text-gray-500">Área</p>
            <p className="font-semibold text-gray-900">{user?.area || "Não informado"}</p>
          </div>
          <div>
            <p className="text-gray-500">Cargo</p>
            <p className="font-semibold text-gray-900">{user?.jobTitle || "Não informado"}</p>
          </div>
          <div>
            <p className="text-gray-500">Superior funcional</p>
            <p className="font-semibold text-gray-900">{user?.functionalManager || "Não informado"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#094160] flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Projetos Vinculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-[#094160]">{projects.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#094160] flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4" />
              Clientes dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {uniqueClients.length === 0 ? (
              <p className="text-sm text-gray-500">Sem clientes associados.</p>
            ) : (
              uniqueClients.map((client) => (
                <Badge key={client} variant="secondary" className="bg-slate-100 text-slate-700">
                  {client}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#094160] flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Meus Projetos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">Você ainda não está vinculado a projetos.</p>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projetos/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{project.name}</p>
                  <p className="text-xs text-gray-500">
                    {project.code || "Sem código"} • {project.client || "Sem cliente"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{project.members[0]?.role || "Criador"}</Badge>
                  <p className="text-[11px] text-gray-500 mt-1">{project.status}</p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
