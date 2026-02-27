/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

// src/components/admin/admin-panel.tsx

import { useEffect, useState } from "react";
import { Users, LayoutDashboard, Database, Settings, Trello, Activity, Layout, FolderOpen, LayoutGrid, ZoomIn, ZoomOut, Type, Shield, UserCircle2 } from "lucide-react";
import { ExcelUpload } from "@/components/excel-upload";
import { ProjectDataTable } from "@/components/project-data-table";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

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

import { NavigationShell, type NavigationSections } from "@/components/navigation/navigation-shell";



interface AdminPanelProps {

  initialItems: any[];

  stats: any;

  curvaSData: any[];

  recentActivities: any[];

  statusOptions: string[];

}



export default function AdminPanel({ initialItems, stats, curvaSData, recentActivities, statusOptions }: AdminPanelProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "data" | "settings" | "canvas" | "resources" | "library" | "portfolio" | "perfis" | "projetos">("projetos");
  const [selectedProject, setSelectedProject] = useState("Geral");

  const [fontScale, setFontScale] = useState(1);



  const projectNames = Array.from(new Set(initialItems.map(i => i.originSheet))).filter(Boolean);

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
  const sections: NavigationSections = {
    global: menuItems.map((item: any) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      href: item.href,
      onClick: item.href ? undefined : () => setActiveTab(item.id as any),
      permissionKey: item.id
    })),
    project: [],
    common: [{ id: "minha-conta", label: "Minha Conta", icon: UserCircle2, href: "/dashboard/minha-conta" }]
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = new Set(["dashboard", "kanban", "data", "settings", "canvas", "resources", "library", "portfolio", "perfis", "projetos"]);

    if (tab && allowedTabs.has(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);





  return (
    <NavigationShell
      sections={sections}
      activeItemId={activeTab}
      role={(session?.user as any)?.role}
      permissions={(session?.user as any)?.permissions}
      headerContent={(
        <div className="flex items-center gap-3 md:gap-5 p-2 bg-gray-50 rounded-full border border-gray-200 ml-auto overflow-x-auto">
          <div className="hidden sm:flex items-center gap-3 px-4 border-r border-gray-200">
            <Type className="w-4 h-4 text-[#094160]" />
            <span className="text-[11px] font-bold text-[#094160] uppercase tracking-wider">Ajuste Visual</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 px-1 md:px-2">
            <button onClick={() => setFontScale(s => Math.max(0.8, s - 0.05))} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-[#094160]" title="Diminuir">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-[13px] font-black text-[#094160] w-14 text-center pointer-events-none">
              {(fontScale * 100).toFixed(0)}%
            </span>
            <button onClick={() => setFontScale(s => Math.min(1.4, s + 0.05))} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-[#094160]" title="Aumentar">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => setFontScale(1)} className="ml-1 md:ml-2 px-3 md:px-4 py-1.5 text-[10px] font-black bg-[#094160] text-white rounded-full hover:bg-[#0d5a85] transition-colors whitespace-nowrap">
              PADRÃO
            </button>
          </div>
        </div>
      )}
    >

      <div className="p-4 md:p-10 font-montserrat" style={{ zoom: fontScale }}>
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

             <KanbanBoard initialItems={initialItems} allowCreate={false} />

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

    </NavigationShell>

  );

}
