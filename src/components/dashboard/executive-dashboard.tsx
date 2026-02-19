"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutiveDashboardProps {
  stats: any;
  items: any[];
}

import { useMemo } from "react";
import { PerformanceGauge } from "./performance-gauge";

export function ExecutiveDashboard({ stats, items }: ExecutiveDashboardProps) {
  // Dados para Status (Rosca)
  const statusData = useMemo(() => [
    { name: "Concluído", value: stats.completed, color: "#10b981" },
    { name: "Pendente", value: stats.pending, color: "#3b82f6" },
    { name: "Bloqueado", value: stats.blocked, color: "#f43f5e" },
    { name: "Em Andamento", value: items.filter(i => i.status !== "Keyuser - Concluído" && i.status !== "Keyuser - Pendente" && i.status !== "Keyuser - Com problemas").length, color: "#f59e0b" },
  ].filter(d => d.value > 0), [stats, items]);

  // Dados para Escala (Baseline vs Real)
  const scaleData = useMemo(() => [
    { name: "Abaixo", value: items.filter(i => i.priority === "Baixa").length, color: "#ef4444" },
    { name: "Na Meta", value: items.filter(i => i.priority === "Média").length, color: "#10b981" },
    { name: "Acima", value: items.filter(i => i.priority === "Alta").length, color: "#3b82f6" },
  ], [items]);

  // Dados para Perspectiva
  const perspectiveData = useMemo(() => {
    const counts = items.reduce((acc: any, item: any) => {
        const p = item.perspective || "Geral";
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {});
    
    return Object.keys(counts).map(name => ({
        name,
        value: counts[name],
        color: name === "Financeira" ? "#3b82f6" : name === "Cliente" ? "#10b981" : "#f59e0b"
      }));
  }, [items]);

  // Dados para Origem
  const originData = useMemo(() => {
    const counts = items.reduce((acc: any, item: any) => {
        const o = item.originSheet || "Outros";
        acc[o] = (acc[o] || 0) + 1;
        return acc;
      }, {});
    
    return Object.keys(counts).map(name => ({
        name,
        value: counts[name],
        color: name === "TNV" ? "#6366f1" : name === "OUTBOUND" ? "#ec4899" : "#8b5cf6"
      }));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Índices de Performance (SPI / CPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        <PerformanceGauge value={stats.spi || 1.0} label="Índice Desempenho Prazo (SPI)" />
        <PerformanceGauge value={stats.cpi || 1.0} label="Índice Desempenho Custo (CPI)" />
        
        {/* Card Informativo Próxima Entrega */}
        <Card className="border-none shadow-sm bg-[#094160] text-white overflow-hidden flex flex-col justify-center px-4">
           <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Próximo Marco</p>
           <p className="text-sm font-bold mt-1">Entrega Fase 1</p>
           <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-white h-full w-[65%]" />
           </div>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden flex flex-col justify-center px-4">
           <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100">Saúde do Projeto</p>
           <p className="text-sm font-bold mt-1">98% Saudável</p>
           <p className="text-[8px] opacity-80">Baseado em 14 indicadores</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Gráfico 1: Status (Rosca) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
          <CardTitle className="text-xs font-black text-[#094160] uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Estratégias por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
              />
              <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase' }}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 2: Perspectiva (Barras Horizontais) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
          <CardTitle className="text-xs font-black text-[#094160] uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            Estratégias por Perspectiva
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perspectiveData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} width={70} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                {perspectiveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 3: Escala (Barras Verticais) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
          <CardTitle className="text-xs font-black text-[#094160] uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            Estratégias por Escala
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scaleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                {scaleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 4: Distribuição por Origem (Barras Verticais Coloridas) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
          <CardTitle className="text-xs font-black text-[#094160] uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
            Distribuição por Origem
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={originData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                {originData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
