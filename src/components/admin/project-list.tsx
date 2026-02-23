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
import { 
  FolderKanban, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Filter, 
  FileSpreadsheet, 
  ArrowLeft,
  Database,
  RefreshCw,
  Eye,
  Download,
  FileText,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

// Tipos de origem
const SOURCE_TYPES = {
  local: { label: "Local", icon: FolderKanban, color: "bg-blue-100 text-blue-700" },
  mpp: { label: "MPP", icon: FileSpreadsheet, color: "bg-green-100 text-green-700" },
  excel: { label: "Excel", icon: FileText, color: "bg-purple-100 text-purple-700" },
  api: { label: "API", icon: Database, color: "bg-orange-100 text-orange-700" }
};

const normalizeSource = (source?: string | null): keyof typeof SOURCE_TYPES => {
  const normalized = String(source || "local").toLowerCase();
  if (normalized === "mpp" || normalized === "excel" || normalized === "api") {
    return normalized;
  }
  return "local";
};

export function ProjectList() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeOptions, setTypeOptions] = useState<string[]>(DEFAULT_TYPES);
  const [activeTab, setActiveTab] = useState<"all" | "local" | "imported">("all");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [filterOptions, setFilterOptions] = useState<any>({});
  
  // Form data (mantido igual)
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
    loadAllData();
  }, [filters, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProjects(),
        loadFilterOptions(),
        loadTypes()
      ]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    const res = await getProjectTypes();
    if (res.success && res.types && res.types.length > 0) {
      const activeNames = res.types.filter((t: any) => t.active).map((t: any) => t.name);
      if (activeNames.length > 0) setTypeOptions(activeNames);
    }
  };

  const loadProjects = async () => {
    const result = await getProjects(filters);
    if (result.success && result.projects) {
      setProjects(result.projects);
    }
  };

  const loadFilterOptions = async () => {
    const result = await getProjectFilterOptions();
    if (result.success && result.options) {
      setFilterOptions(result.options);
    }
  };

  const handleSync = async (project: any) => {
    const externalUid = project.primaryImported?.externalProjectId || project.primaryImported?.externalUid;
    if (!externalUid) {
      toast({
        title: "Sincronização indisponível",
        description: "Este projeto não possui vínculo externo para sincronização.",
        variant: "warning"
      });
      return;
    }

    setSyncingId(project.id);
    try {
      const response = await fetch("/api/mpp/sync-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mppProjectId: String(externalUid),
          localProjectId: project.id,
          syncMode: "upsert",
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Sucesso",
          description: `Projeto sincronizado (${result.importedTasks || 0} tarefas atualizadas)`
        });
        await loadProjects();
      } else {
        throw new Error(result.error || "Falha ao sincronizar");
      }
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setSyncingId(null);
    }
  };

  // Combinar projetos baseado na tab ativa
  const getDisplayProjects = () => {
    const normalizedProjects = projects.map((project) => ({
      primaryImported: Array.isArray(project.importedProjects) ? project.importedProjects[0] : null,
      ...project,
      source: normalizeSource(project.importedProjects?.[0]?.source),
      externalUid: project.importedProjects?.[0]?.externalProjectId || project.importedProjects?.[0]?.externalUid || null,
      importedAt: project.importedProjects?.[0]?.updatedAt || null,
      syncStatus: project.importedProjects?.[0]?.syncStatus || null,
      syncMode: project.importedProjects?.[0]?.syncMode || null,
      lastSyncAt: project.importedProjects?.[0]?.lastSyncAt || null,
      sourceTypes: Array.from(
        new Set(
          (project.importedProjects || [])
            .map((source: any) => normalizeSource(source?.source))
            .filter(Boolean)
        )
      ),
      hasExternalSource: Boolean(project.importedProjects?.[0]?.externalProjectId || project.importedProjects?.[0]?.externalUid),
    }));

    switch (activeTab) {
      case "local":
        return normalizedProjects.filter((project) => !project.hasExternalSource);
      case "imported":
        return normalizedProjects.filter((project) => project.hasExternalSource);
      case "all":
      default:
        return normalizedProjects.sort((a, b) => {
          const dateA = a.importedAt || a.createdAt;
          const dateB = b.importedAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }
  };

  const displayProjects = getDisplayProjects();

  const getSourceBadge = (project: any) => {
    const sources = project.hasExternalSource
      ? (project.sourceTypes.length ? project.sourceTypes : [normalizeSource(project.primaryImported?.source || project.source)])
      : ["local"];

    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {sources.map((source: keyof typeof SOURCE_TYPES) => {
          const config = SOURCE_TYPES[source] || SOURCE_TYPES.local;
          return (
            <Badge key={`${project.id}-${source}`} className={config.color}>
              <config.icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          );
        })}
      </div>
    );
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
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o nome do projeto.",
        variant: "destructive"
      });
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
      toast({
        title: "Sucesso",
        description: view === "new" ? "Projeto criado com sucesso" : "Projeto atualizado com sucesso"
      });
      await loadProjects();
      handleCancel();
    } else {
      toast({
        title: "Erro",
        description: result?.error || "Erro ao salvar projeto",
        variant: "destructive"
      });
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
      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso"
      });
      await loadProjects();
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir projeto",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const applyFilter = (key: keyof ProjectFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Função para navegar para detalhes do projeto importado
  const handleViewImported = (projectId: string, externalUid?: string | null) => {
    const query = externalUid ? `?mppProjectId=${encodeURIComponent(externalUid)}` : "";
    window.location.href = `/dashboard/projetos/${projectId}/gantt${query}`;
  };

  if (loading && view === "list") {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#094160]"></div>
      </div>
    );
  }

  // View: Formulário (mantido igual)
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
          {/* Grid de campos - IDÊNTICO AO ORIGINAL */}
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

  // View: Lista com Tabs
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Projetos</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie projetos locais e importados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={() => window.location.href = '/dashboard/import'}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Database className="w-4 h-4" />
            Importar MPP
          </Button>
          <Button
            onClick={handleNew}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto Local
          </Button>
        </div>
      </div>

      {/* Tabs de origem */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Locais
          </TabsTrigger>
          <TabsTrigger value="imported" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Importados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Filtros (compartilhados) */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left p-4">Projeto</th>
                  <th className="text-center p-4 w-24">Origem</th>
                  <th className="text-center p-4 w-32">Status</th>
                  <th className="text-center p-4 w-32">Tipo</th>
                  <th className="text-center p-4 w-32">Área</th>
                  <th className="text-center p-4 w-24">Tarefas</th>
                  <th className="text-center p-4 w-48">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Nenhum projeto encontrado
                    </td>
                  </tr>
                ) : (
                  displayProjects.map((project, index) => (
                    <tr
                      key={`${project.source}-${project.id}`}
                      className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {project.source === 'local' ? (
                            <FolderKanban className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Database className="w-4 h-4 text-green-500" />
                          )}
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="flex items-center gap-2 text-xs">
                              {project.code && (
                                <span className="text-gray-500">{project.code}</span>
                              )}
                              {project.hasExternalSource && project.importedAt && (
                                <span className="text-gray-400">
                                  {new Date(project.importedAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getSourceBadge(project)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            project.status === "Concluído" ? "bg-green-100 text-green-700" :
                            project.status === "Andamento" ? "bg-blue-100 text-blue-700" :
                            project.status === "Atraso" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {project.status || (project.source !== 'local' ? 'Importado' : 'A iniciar')}
                          </span>
                          {project.hasExternalSource && project.syncStatus && (
                            <div className="text-[11px] text-gray-500">
                              Sync: {project.syncStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm">{project.type || "-"}</td>
                      <td className="p-4 text-center text-sm">{project.area || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="text-blue-600 font-semibold">
                          {project._count?.items ?? project.totalItems ?? project.totalTasks ?? 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <a
                            href={`/dashboard/projetos/${project.id}`}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                          >
                            <FolderKanban className="w-3 h-3" />
                            Detalhes
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
                          {project.hasExternalSource && (
                            <>
                              <button
                                onClick={() => handleViewImported(project.id, project.externalUid)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                              >
                                <Eye className="w-3 h-3" />
                                Abrir Gantt
                              </button>
                              <button
                                onClick={() => handleSync(project)}
                                disabled={syncingId === project.id}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3 h-3 ${syncingId === project.id ? 'animate-spin' : ''}`} />
                                {syncingId === project.id ? 'Sinc...' : 'Sincronizar'}
                              </button>
                              <button
                                onClick={() => {
                                  if (!project.externalUid) {
                                    toast({
                                      title: "Exportação indisponível",
                                      description: "Este projeto não possui identificador externo para exportação.",
                                      variant: "warning"
                                    });
                                    return;
                                  }

                                  window.open(`/api/mpp/projects/${project.externalUid}/export/json`, '_blank');
                                }}
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                              >
                                <Download className="w-3 h-3" />
                                Exportar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Rodapé com contagem */}
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mt-4 text-sm text-gray-500">
            <div>
              {displayProjects.length} projeto(s) listado(s)
              {activeTab === 'all' && (
                <span className="ml-2 text-xs">
                  ({projects.filter((p) => !(p.importedProjects?.[0]?.externalProjectId || p.importedProjects?.[0]?.externalUid)).length} locais, {projects.filter((p) => Boolean(p.importedProjects?.[0]?.externalProjectId || p.importedProjects?.[0]?.externalUid)).length} com fonte externa)
                </span>
              )}
            </div>
            
            {activeTab === 'imported' && projects.some((p) => Boolean(p.importedProjects?.[0]?.externalProjectId || p.importedProjects?.[0]?.externalUid)) && (
              <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span>Clique em "Sincronizar" para integrar com o módulo de issues/riscos</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
