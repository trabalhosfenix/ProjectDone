/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// src/components/admin/admin-panel.tsx
import { useState } from "react";
import { Users, LayoutDashboard, Database, Settings, LogOut, Trello, Activity, Layout, FolderOpen, LayoutGrid, ZoomIn, ZoomOut, Type, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UserManagement from "@/components/admin/user-management";
import { ExcelUpload } from "@/components/excel-upload";
import { ProjectDataTable } from "@/components/project-data-table";
import { signOut, useSession } from "next-auth/react";
import { KPISection } from "@/components/dashboard/kpi-section";
import { CurvaSChart } from "@/components/dashboard/curva-s";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SystemSettings } from "@/components/admin/system-settings";
import { PMCanvas } from "@/components/admin/pm-canvas";
import { ResourceAllocationMap } from "@/components/admin/resource-map";
import { DocumentLibrary } from "@/components/admin/document-library";
import { PortfolioPrioritization } from "@/components/admin/portfolio-prioritization";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RolesManagement } from "@/components/admin/roles-management";
import { ProjectList } from "@/components/admin/project-list";
import Link from "next/link";

interface AdminPanelProps {
  initialItems: any[];
  stats: any;
  curvaSData: any[];
  recentActivities: any[];
  statusOptions: string[];
}

export default function AdminPanel({ initialItems, stats, curvaSData, recentActivities, statusOptions }: AdminPanelProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "users" | "data" | "settings" | "canvas" | "resources" | "library" | "portfolio" | "perfis" | "projetos">("projetos");
  const [selectedProject, setSelectedProject] = useState("Geral");
  const [fontScale, setFontScale] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar-collapsed") === "true"
  });

  const projectNames = Array.from(new Set(initialItems.map(i => i.originSheet))).filter(Boolean);

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed
    setIsSidebarCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  const menuItems = [
    { id: "projetos", label: "Projetos", icon: FolderOpen },
    { id: "kanban", label: "Quadro Ágil", icon: Trello },
    { id: "canvas", label: "PM Canvas", icon: Layout },
    { id: "resources", label: "Alocação", icon: Users },
    { id: "perfis", label: "Perfis", icon: Shield },
    { id: "portfolio", label: "Portfólio", icon: LayoutGrid },
    { id: "library", label: "Documentos", icon: FolderOpen },
    { id: "data", label: "Base de Dados", icon: Database },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-[#094160] font-montserrat">
      {/* Sidebar */}
      <aside className={cn("bg-[#094160] text-white hidden md:flex flex-col transition-all duration-300 relative", isSidebarCollapsed ? "w-20" : "w-72")}>
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-9 bg-white text-[#094160] border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors z-50"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={cn("p-6 border-b border-[#0d5a85] overflow-hidden whitespace-nowrap", isSidebarCollapsed && "px-4")}>
          {isSidebarCollapsed ? (
            <div className="flex justify-center">
              <h1 className="text-xl font-bold">PD</h1>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">ProjectDone</h1>
              <p className="text-[12px] text-blue-200 tracking-widest uppercase font-semibold">Sistema de Gestão</p>
            </>
          )}
        </div>
        
        <nav className="flex-1 p-5 space-y-3">
          {menuItems.map((item: any) => {
            // Lógica de permissão: ADMIN master vê tudo. Outros depende das permissões da Role.
            const isMaster = (session?.user as any)?.role === "ADMIN";
            const userPermissions = (session?.user as any)?.permissions;
            const hasPermission = isMaster || !userPermissions || userPermissions[item.id] === true;

            if (!hasPermission) return null;

            // Se for um link, renderiza como Link
            if (item.isLink && item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn("w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm transition-all text-left hover:bg-[#0d5a85] text-blue-100 hover:scale-[1.02]", isSidebarCollapsed && "justify-center px-2")}
                >
                  <item.icon className="w-5 h-5" />
                  {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            }

            // Senão, renderiza como botão
            return (
                <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm transition-all text-left",
                    isSidebarCollapsed && "justify-center px-2",
                    activeTab === item.id 
                    ? "bg-white text-[#094160] font-bold shadow-lg scale-[1.02]" 
                    : "hover:bg-[#0d5a85] text-blue-100 hover:scale-[1.02]"
                )}
                >
                <item.icon className="w-5 h-5" />
                {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-[#0d5a85] overflow-hidden">
          {isSidebarCollapsed ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center justify-center p-3 rounded-xl text-sm hover:bg-red-500/20 text-red-200 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm hover:bg-red-500/20 text-red-200 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              Sair do Sistema
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Persistent */}
        <div className="bg-white border-b border-gray-100 px-10 py-4 flex justify-end items-center sticky top-0 z-50 shadow-sm">
           <div className="flex items-center gap-5 p-2 bg-gray-50 rounded-full border border-gray-200">
             <div className="flex items-center gap-3 px-4 border-r border-gray-200">
                <Type className="w-4 h-4 text-[#094160]" />
                <span className="text-[11px] font-bold text-[#094160] uppercase tracking-wider">Ajuste Visual</span>
             </div>
             
             <div className="flex items-center gap-3 px-2">
                <button 
                   onClick={() => setFontScale(s => Math.max(0.8, s - 0.05))}
                   className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-[#094160]"
                   title="Diminuir"
                >
                   <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="text-[13px] font-black text-[#094160] w-14 text-center pointer-events-none">
                  {(fontScale * 100).toFixed(0)}%
                </span>

                <button 
                   onClick={() => setFontScale(s => Math.min(1.4, s + 0.05))}
                   className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-[#094160]"
                   title="Aumentar"
                >
                   <ZoomIn className="w-5 h-5" />
                </button>
                
                <button 
                   onClick={() => setFontScale(1)}
                   className="ml-2 px-4 py-1.5 text-[10px] font-black bg-[#094160] text-white rounded-full hover:bg-[#0d5a85] transition-colors"
                >
                   PADRÃO
                </button>
             </div>
           </div>
        </div>

        <div className="p-10 font-montserrat" style={{ zoom: fontScale }}>
        {activeTab === "dashboard" && (
          <div className="space-y-10">
            <header className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-left">Resumo do Projeto</h2>
                <span className="text-sm bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-bold shadow-sm">INDICADORES LIVE</span>
            </header>
            
            {/* KPIs */}
            <KPISection stats={stats} />

            {/* Dashboards Estratégicos (Power BI Style) */}
            <div className="space-y-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-left italic opacity-80">Visão Executiva</h3>
                    <div className="h-0.5 flex-1 mx-6 bg-gray-100" />
                </div>
                <ExecutiveDashboard stats={stats} items={initialItems} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Gráfico Curva S */}
                <Card className="lg:col-span-2 border-none shadow-md h-full rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-[#094160] flex items-center justify-between">
                             <span>Progresso Geral <span className="font-light">(Curva S)</span></span>
                             <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-widest">Acumulado %</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <CurvaSChart data={curvaSData} />
                    </CardContent>
                </Card>

                {/* Atividades Recentes */}
                <Card className="border-none shadow-md h-full flex flex-col rounded-2xl overflow-hidden">
                     <CardHeader className="pb-3 bg-slate-50/50">
                        <CardTitle className="text-[#094160] text-base flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Atividades Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[450px] pt-4">
                         <RecentActivity activities={recentActivities} />
                    </CardContent>
                    <div className="p-6 bg-[#094160] text-white border-t border-blue-50 mt-auto">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Meta Diária</span>
                            <span className="text-2xl font-black text-white">{stats.metaDoDia}</span>
                        </div>
                        <p className="text-[11px] text-blue-100 leading-relaxed italic opacity-80">
                            Foque nas tarefas de prioridade <span className="font-bold text-blue-300">Alta</span> para manter o ritmo de entrega contratado.
                        </p>
                    </div>
                </Card>
            </div>

            <div className="space-y-5">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-left italic opacity-80">Fila de Trabalho Detalhada</h3>
                  <div className="h-0.5 flex-1 mx-6 bg-gray-100" />
               </div>
                <ProjectDataTable initialItems={initialItems} statusOptions={statusOptions} />
             </div>
           </div>
         )}
  
         {activeTab === "kanban" && (
           <div className="space-y-8 h-[calc(100vh-180px)]">
             <h2 className="text-3xl font-bold tracking-tight text-left">Quadro Ágil de Entregas</h2>
             <KanbanBoard initialItems={initialItems} statusOptions={statusOptions} />
           </div>
         )}

        {activeTab === "users" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-left">Gestão de Acessos</h2>
            <UserManagement />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-left">Parâmetros do Sistema</h2>
            <SystemSettings />
          </div>
        )}

        {activeTab === "perfis" && (
          <div className="space-y-8">
            <RolesManagement />
          </div>
        )}

        {activeTab === "projetos" && (
          <div className="space-y-8">
            <ProjectList />
          </div>
        )}

        {activeTab === "canvas" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="text-3xl font-bold tracking-tight text-left">Project Management Canvas</h2>
               <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Projeto Ativo:</span>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[250px] h-10 text-sm font-semibold">
                      <SelectValue placeholder="Selecione o Projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geral">Visão Consolidada</SelectItem>
                      {projectNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
            </div>
            <PMCanvas projectName={selectedProject} />
          </div>
        )}

        {activeTab === "resources" && (
            <div className="space-y-8">
                 <h2 className="text-3xl font-bold italic text-[#094160]">Ocupação &amp; Alocação de Recursos</h2>
                 <ResourceAllocationMap />
            </div>
        )}

        {activeTab === "library" && (
            <div className="space-y-8 text-[#094160]">
                 <h2 className="text-3xl font-bold tracking-tight text-left">Central de Documentos e Evidências</h2>
                 <DocumentLibrary />
            </div>
        )}

        {activeTab === "portfolio" && (
            <div className="space-y-8 text-[#094160]">
                 <h2 className="text-3xl font-bold tracking-tight text-left">Priorização Estratégica de Portfólio</h2>
                 <PortfolioPrioritization />
            </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-8">
             <h2 className="text-3xl font-bold text-[#094160] tracking-tight text-left">Importação de Dados</h2>
             <Card className="border-dashed border-2 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-gray-400 font-medium">Upload de Planilhas Estruturadas (Excel)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ExcelUpload />
                </CardContent>
             </Card>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
