"use client";

import { useState, useEffect } from "react";
import { getRolesWithUserCount, createRole, updateRole, deleteRole } from "@/app/actions/permissions";
import { Shield, Users, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_GROUPS = {
  "Acesso Básico": {
    projetos: "Acessar Projetos",
    dashboard: "Acessar Dashboard",
    kanban: "Acessar Kanban",
    portfolio: "Acessar Portfólio",
  },
  "Recursos": {
    resources: "Acessar Recursos",
    canvas: "Acessar Canvas",
    library: "Acessar Biblioteca",
    data: "Acessar Dados",
  },
  "Configurações": {
    settings: "Acessar Configurações",
    perfis: "Acessar Perfis",
  },
  "Gestão de Projetos": {
    canEdit: "Editar Projetos",
    canDelete: "Excluir Projetos",
    canCreate: "Criar Projetos",
  },
  "Administração": {
    manageUsers: "Gerenciar Usuários",
    manageRoles: "Gerenciar Perfis",
    viewReports: "Visualizar Relatórios",
  },
};

export function RolesManagement() {
  const [data, setData] = useState<any>({ roles: [], usersWithoutRole: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", permissions: { dashboard: true } });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const result = await getRolesWithUserCount();
    setData(result);
    setLoading(false);
  };

  const handleNew = () => {
    setFormData({ name: "", permissions: { dashboard: true } });
    setView("new");
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setFormData({ name: role.name, permissions: role.permissions || {} });
    setView("edit");
  };

  const handleCancel = () => {
    setView("list");
    setSelectedRole(null);
    setFormData({ name: "", permissions: { dashboard: true } });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Por favor, informe o nome do perfil.");
      return;
    }

    setLoading(true);

    if (view === "new") {
      const result = await createRole(formData.name, formData.permissions);
      if (!result.success) {
        toast.error(result.error || "Não foi possível criar o perfil.");
        setLoading(false);
        return;
      }
      toast.success("Perfil criado com sucesso.");
    } else if (view === "edit" && selectedRole) {
      const result = await updateRole(selectedRole.id, {
        name: formData.name,
        permissions: formData.permissions
      });
      if (!result.success) {
        toast.error(result.error || "Não foi possível atualizar o perfil.");
        setLoading(false);
        return;
      }
      toast.success("Perfil atualizado com sucesso.");
    }

    await loadRoles();
    handleCancel();
  };

  const handleDelete = async (role: any) => {
    if (role.userCount > 0) {
      toast.error(`Não é possível excluir este perfil pois existem ${role.userCount} usuário(s) vinculado(s).`);
      return;
    }

    if (!confirm(`Deseja realmente excluir o perfil "${role.name}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteRole(role.id);
    if (!result.success) {
      toast.error(result.error || "Não foi possível excluir o perfil.");
      setLoading(false);
      return;
    }
    toast.success("Perfil excluído com sucesso.");
    await loadRoles();
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  if (loading && view === "list") {
    return <div className="p-6">Carregando...</div>;
  }

  // View: Formulário (Novo ou Editar)
  if (view === "new" || view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {view === "new" ? "Novo Perfil de Acesso" : `Editar: ${selectedRole?.name}`}
          </h2>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block mb-2 font-semibold">
              Nome do Perfil <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Gerente de Projetos"
            />
          </div>

          {/* Permissões */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Permissões</h3>
            {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => (
              <div key={groupName} className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">{groupName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(groupPermissions).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions[key] || false}
                        onChange={() => togglePermission(key)}
                        className="w-4 h-4"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: Lista
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Perfis de Acesso</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie os níveis de acesso e permissões do sistema
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Perfil
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Perfis</p>
              <p className="text-2xl font-bold">{data.roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuários com Perfil</p>
              <p className="text-2xl font-bold">
                {data.roles.reduce((acc: number, r: any) => acc + r.userCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sem Perfil</p>
              <p className="text-2xl font-bold">{data.usersWithoutRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left p-4">Perfil de Acesso</th>
              <th className="text-center p-4 w-40">Nº de Pessoas</th>
              <th className="text-center p-4 w-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.roles.map((role: any, index: number) => (
              <tr
                key={role.id}
                className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{role.name}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {role.userCount > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <Users className="w-3 h-3" />
                      {role.userCount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">0</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role.userCount > 0}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                      title={role.userCount > 0 ? "Não é possível excluir perfil com usuários vinculados" : "Excluir perfil"}
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Sem perfil de acesso */}
            <tr className="bg-gray-100 border-t-2">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-700">Sem perfil de acesso</span>
                </div>
              </td>
              <td className="p-4 text-center">
                {data.usersWithoutRole > 0 ? (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <Users className="w-3 h-3" />
                    {data.usersWithoutRole}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">0</span>
                )}
              </td>
              <td className="p-4 text-center">
                <span className="text-gray-400 text-sm">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-right text-sm text-gray-500">
        {data.roles.length + 1} itens listados
      </div>
    </div>
  );
}
