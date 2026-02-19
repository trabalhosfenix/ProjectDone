"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Save, Trash2 } from "lucide-react";
import { getRoles, createRole, updateRolePermissions, deleteRole } from "@/app/actions/permissions";
import { toast } from "sonner";

export function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(true);

  const availablePermissions = [
    { id: "dashboard", label: "Dashboard" },
    { id: "kanban", label: "Quadro Ágil" },
    { id: "portfolio", label: "Portfólio" },
    { id: "resources", label: "Alocação" },
    { id: "canvas", label: "PM Canvas" },
    { id: "library", label: "Documentos" },
    { id: "data", label: "Base de Dados" },
    { id: "settings", label: "Configurações" },
  ];

  async function loadRoles() {
    setLoading(true);
    const data = await getRoles();
    setRoles(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRoles();
  }, []);

  async function handleCreateRole() {
    if (!newRoleName) return toast.error("Digite um nome para o nível.");
    const res = await createRole(newRoleName);
    if (res.success) {
      toast.success("Nível criado!");
      setNewRoleName("");
      loadRoles();
    }
  }

  async function handleTogglePermission(roleId: string, permissionId: string, current: boolean) {
    const role = roles.find(r => r.id === roleId);
    const newPermissions = { ...role.permissions, [permissionId]: !current };
    const res = await updateRolePermissions(roleId, newPermissions);
    if (res.success) {
      loadRoles();
    }
  }

  async function handleDeleteRole(id: string) {
    if (!confirm("Excluir este nível de acesso?")) return;
    const res = await deleteRole(id);
    if (res.success) {
      toast.success("Nível removido.");
      loadRoles();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Novo Nível de Acesso</label>
          <Input 
            value={newRoleName} 
            onChange={e => setNewRoleName(e.target.value)} 
            placeholder="Ex: Gerente de Projetos, Cliente VIP..." 
            className="h-12 text-sm font-bold"
          />
        </div>
        <Button onClick={handleCreateRole} className="bg-[#094160] hover:bg-[#0d5a85] h-12 px-6 gap-2 rounded-xl">
          <Plus className="w-5 h-5" /> Criar Nível
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-center py-10 font-bold text-gray-400 italic">Carregando níveis de acesso...</p>
        ) : roles.map(role => (
          <Card key={role.id} className="border-none shadow-md overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between py-4 border-b">
              <div>
                <CardTitle className="text-base font-black text-[#094160] uppercase">{role.name}</CardTitle>
                <CardDescription className="text-[10px] font-bold">Configure o acesso para este perfil</CardDescription>
              </div>
              <Button onClick={() => handleDeleteRole(role.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-4">
                {availablePermissions.map(perm => (
                  <div key={perm.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={`${role.id}-${perm.id}`}
                      checked={!!role.permissions[perm.id]}
                      onCheckedChange={() => handleTogglePermission(role.id, perm.id, !!role.permissions[perm.id])}
                    />
                    <label 
                      htmlFor={`${role.id}-${perm.id}`}
                      className="text-xs font-bold text-gray-600 cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
