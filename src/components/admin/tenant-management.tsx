"use client";

import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createTenant, getTenants, updateTenantStatus } from "@/app/actions/tenants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: {
    users: number;
    projects: number;
  };
};

export function TenantManagement() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  async function loadTenants() {
    setIsLoading(true);
    try {
      const data = await getTenants();
      setTenants(data as TenantItem[]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Informe o nome da conta.");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createTenant({ name, slug: slug || undefined });
      if (!result.success) {
        toast.error(result.error?.replace(/tenant/gi, "conta") || "Erro ao criar conta.");
        return;
      }
      toast.success("Conta criada com sucesso.");
      setName("");
      setSlug("");
      await loadTenants();
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleStatus(tenantId: string, currentStatus: boolean) {
    const result = await updateTenantStatus(tenantId, !currentStatus);
    if (!result.success) {
      toast.error(result.error?.replace(/tenant/gi, "conta") || "Erro ao atualizar conta.");
      return;
    }
    toast.success("Status da conta atualizado.");
    await loadTenants();
  }

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="bg-[#094160] text-white">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Gestão de Contas
        </CardTitle>
        <CardDescription className="text-blue-100 text-[10px]">
          Crie e ative/desative organizações para isolamento de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            placeholder="Nome da conta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
          />
          <Input
            placeholder="Slug (opcional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isCreating}
          />
          <Button onClick={handleCreate} disabled={isCreating} className="bg-[#094160] hover:bg-[#0d5a85]">
            <Plus className="w-4 h-4 mr-2" />
            Criar
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {isLoading ? (
            <p className="text-center text-xs text-gray-400 py-4 italic">Carregando contas...</p>
          ) : tenants.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4 italic">Nenhuma conta disponível.</p>
          ) : (
            tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#094160] truncate">{tenant.name}</p>
                  <p className="text-xs text-gray-500 truncate">/{tenant.slug}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {tenant._count.users} usuários • {tenant._count.projects} projetos
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={tenant.isActive ? "default" : "secondary"}>
                    {tenant.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Switch
                    checked={tenant.isActive}
                    onCheckedChange={() => handleToggleStatus(tenant.id, tenant.isActive)}
                    aria-label={`Alterar status da conta ${tenant.name}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
