"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X, Palette, Settings2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getStatusOptions, createStatusOption, deleteStatusOption } from "@/app/actions/items";
import { RoleManagement } from "./role-management";
import { ProjectTypesManager } from "./project-types-manager";
import UserManagement from "./user-management";
import { TenantManagement } from "./tenant-management";

export function SystemSettings() {
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const data = await getStatusOptions();
      setStatusOptions(data);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddStatus = async () => {
    if (!newStatus) return;
    setIsSubmitting(true);
    try {
        const result = await createStatusOption(newStatus);
        if (result.success) {
            toast.success("Status adicionado!");
            setNewStatus("");
            loadStatus();
        } else {
            toast.error(typeof result.error === "string" ? result.error : "Erro ao adicionar");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteStatus = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este status?")) return;
    try {
        const result = await deleteStatusOption(id);
        if (result.success) {
            toast.success("Status removido!");
            loadStatus();
        }
    } catch (error) {
        toast.error("Erro ao remover");
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#094160]">Parâmetros e Segurança</h2>
        <p className="text-sm text-gray-500">Controle de acesso, status e preferências do sistema.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#094160] uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Níveis de Acesso e Permissões
        </h3>
        <RoleManagement />
      </div>

      <div className="h-px bg-gray-100 my-8" />

      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#094160] uppercase tracking-wider">Usuários e Contas</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <TenantManagement />
          </div>
          <div>
            <UserManagement />
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-[#094160] text-white">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Gestão de Status
            </CardTitle>
            <CardDescription className="text-blue-100 text-[10px]">
              Adicione ou remova opções de status para as tarefas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: Em Homologação" 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-9 text-sm"
                disabled={isSubmitting}
              />
              <Button size="sm" onClick={handleAddStatus} disabled={isSubmitting} className="bg-[#094160] hover:bg-[#0d5a85]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {isLoading ? (
                <p className="text-center text-xs text-gray-400 py-4 italic">Carregando...</p>
              ) : statusOptions.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                  <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteStatus(opt.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
           <CardHeader className="bg-[#094160] text-white">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Tipos de Projeto
            </CardTitle>
            <CardDescription className="text-blue-100 text-[10px]">
              Gerencie as categorias de classificação dos projetos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProjectTypesManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
