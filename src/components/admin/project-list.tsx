"use client";

import { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectFilterOptions,
  type ProjectFilters,
} from "@/app/actions/projects";
import { getProjectTypes } from "@/app/actions/project-types";
import { FolderKanban, Plus, Edit, Trash2, X, Save, Filter, FileSpreadsheet, ArrowLeft } from "lucide-react";

const STATUS_OPTIONS = [
  "A iniciar",
  "Andamento",
  "Concluído",
  "Parado",
  "Cancelado",
  "Atraso",
];

// Fallback inicial
const DEFAULT_TYPES = [
  "Implementação",
  "Pesquisa",
  "Manutenção",
  "Melhoria",
  "Suporte",
];

const PRIORITY_OPTIONS = ["Baixa", "Média", "Alta"];

export function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeOptions, setTypeOptions] = useState<string[]>(DEFAULT_TYPES);
  
  // Filtros
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [filterOptions, setFilterOptions] = useState<any>({});
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    status: "A iniciar",
    type: "",
    startDate: "",
    endDate: "",
    area: "",
    program: "",
    portfolio: "",
    strategicPlan: "",
    managerName: "",
    client: "",
    budget: 0,
    priority: "Média",
  });

  useEffect(() => {
    loadProjects();
    loadFilterOptions();
    loadTypes();
  }, [filters]);

  const loadTypes = async () => {
    const res = await getProjectTypes();
    if (res.success && res.types && res.types.length > 0) {
      // Filtra apenas ativos e pega os nomes
      const activeNames = res.types.filter((t: any) => t.active).map((t: any) => t.name);
      if (activeNames.length > 0) setTypeOptions(activeNames);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    const result = await getProjects(filters);
    if (result.success && result.projects) {
      setProjects(result.projects);
    }
    setLoading(false);
  };

  const loadFilterOptions = async () => {
    const result = await getProjectFilterOptions();
    if (result.success && result.options) {
      setFilterOptions(result.options);
    }
  };

  const handleNew = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      status: "A iniciar",
      type: "",
      startDate: "",
      endDate: "",
      area: "",
      program: "",
      portfolio: "",
      strategicPlan: "",
      managerName: "",
      client: "",
      budget: 0,
      priority: "Média",
    });
    setView("new");
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setFormData({
      name: project.name || "",
      description: project.description || "",
      code: project.code || "",
      status: project.status || "A iniciar",
      type: project.type || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      area: project.area || "",
      program: project.program || "",
      portfolio: project.portfolio || "",
      strategicPlan: project.strategicPlan || "",
      managerName: project.managerName || "",
      client: project.client || "",
      budget: project.budget || 0,
      priority: project.priority || "Média",
    });
    setView("edit");
  };

  const handleCancel = () => {
    setView("list");
    setSelectedProject(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Por favor, informe o nome do projeto.");
      return;
    }

    setLoading(true);

    const data = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    };

    let result;
    if (view === "new") {
      result = await createProject(data);
    } else if (view === "edit" && selectedProject) {
      result = await updateProject(selectedProject.id, data);
    }

    if (result?.success) {
      await loadProjects();
      handleCancel();
    } else {
      alert(result?.error || "Erro ao salvar projeto");
    }
    
    setLoading(false);
  };

  const handleDelete = async (project: any) => {
    if (!confirm(`Deseja realmente excluir o projeto "${project.name}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteProject(project.id);
    
    if (result.success) {
      await loadProjects();
    } else {
      alert(result.error || "Erro ao excluir projeto");
    }
    
    setLoading(false);
  };

  const applyFilter = (key: keyof ProjectFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (loading && view === "list") {
    return <div className="p-6">Carregando...</div>;
  }

  // View: Formulário
  if (view === "new" || view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">
              {view === "new" ? "Novo Projeto" : `Editar: ${selectedProject?.name}`}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 space-y-6">
          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">
                Nome do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="Ex: Implementação do Sistema X"
              />
            </div>

            {/* Código */}
            <div>
              <label className="block mb-2 font-semibold">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="Ex: PROJ-2025-001"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block mb-2 font-semibold">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Selecione...</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block mb-2 font-semibold">Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block mb-2 font-semibold">Data de Início</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block mb-2 font-semibold">Data de Término (Prevista)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Área */}
            <div>
              <label className="block mb-2 font-semibold">Área Executora</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="Ex: TI, RH, Financeiro"
              />
            </div>

            {/* Programa */}
            <div>
              <label className="block mb-2 font-semibold">Programa</label>
              <input
                type="text"
                value={formData.program}
                onChange={(e) => setFormData((prev) => ({ ...prev, program: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Portfólio */}
            <div>
              <label className="block mb-2 font-semibold">Portfólio</label>
              <input
                type="text"
                value={formData.portfolio}
                onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Gerente */}
            <div>
              <label className="block mb-2 font-semibold">Gerente/Responsável</label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, managerName: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block mb-2 font-semibold">Cliente</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Orçamento */}
            <div>
              <label className="block mb-2 font-semibold">Orçamento (R$)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-2"
                step="0.01"
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Descreva o objetivo e escopo do projeto..."
              />
            </div>
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
          <h2 className="text-2xl font-bold">Lista de Projetos</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie todos os projetos da organização
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 font-semibold"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filters.search || ""}
              onChange={(e) => applyFilter("search", e.target.value || undefined)}
              className="border rounded px-3 py-2"
            />

            {/* Status */}
            <select
              value={filters.status?.[0] || ""}
              onChange={(e) => applyFilter("status", e.target.value ? [e.target.value] : undefined)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Área */}
            <select
              value={filters.area?.[0] || ""}
              onChange={(e) => applyFilter("area", e.target.value ? [e.target.value] : undefined)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todas as áreas</option>
              {filterOptions.areas?.map((area: string) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {/* Tipo */}
            <select
              value={filters.type?.[0] || ""}
              onChange={(e) => applyFilter("type", e.target.value ? [e.target.value] : undefined)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos os tipos</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left p-4">Projeto</th>
              <th className="text-center p-4 w-32">Status</th>
              <th className="text-center p-4 w-32">Tipo</th>
              <th className="text-center p-4 w-32">Área</th>
              <th className="text-center p-4 w-32">Tarefas</th>
              <th className="text-center p-4 w-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Nenhum projeto encontrado
                </td>
              </tr>
            ) : (
              projects.map((project, index) => (
                <tr
                  key={project.id}
                  className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.code && (
                          <div className="text-xs text-gray-500">{project.code}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      project.status === "Concluído" ? "bg-green-100 text-green-700" :
                      project.status === "Andamento" ? "bg-blue-100 text-blue-700" :
                      project.status === "Atraso" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm">{project.type || "-"}</td>
                  <td className="p-4 text-center text-sm">{project.area || "-"}</td>
                  <td className="p-4 text-center">
                    <span className="text-blue-600 font-semibold">
                      {project._count?.items || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`/dashboard/projetos/${project.id}`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                      >
                        <FolderKanban className="w-3 h-3" />
                        Ver Detalhes
                      </a>
                      <button
                        onClick={() => handleEdit(project)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        disabled={project._count?.items > 0}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          project._count?.items > 0
                            ? "Não é possível excluir projeto com tarefas vinculadas"
                            : "Excluir projeto"
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-right text-sm text-gray-500">
        {projects.length} projeto(s) listado(s)
      </div>
    </div>
  );
}
