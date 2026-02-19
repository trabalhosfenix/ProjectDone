"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Info, Users, Shield, Zap, Target, FileText, Layout, AlertTriangle, Calendar, DollarSign, ListChecks } from "lucide-react";
import { updateProjectCanvas, getProjectCanvas } from "@/app/actions/canvas";
import { cn } from "@/lib/utils";

interface PMCanvasProps {
  projectName: string;
}

const BLOCKS = [
  { key: "justification", title: "Justificativas", icon: Info, color: "bg-purple-50", textColor: "text-purple-700", border: "border-purple-200" },
  { key: "objectives", title: "Objetivo SMART", icon: Target, color: "bg-purple-50", textColor: "text-purple-700", border: "border-purple-200" },
  { key: "benefits", title: "Benefícios", icon: Zap, color: "bg-purple-50", textColor: "text-purple-700", border: "border-purple-200" },
  
  { key: "product", title: "Produto", icon: Layout, color: "bg-orange-50", textColor: "text-orange-700", border: "border-orange-200" },
  { key: "requirements", title: "Requisitos", icon: ListChecks, color: "bg-orange-50", textColor: "text-orange-700", border: "border-orange-200" },
  
  { key: "stakeholders", title: "Stakeholders", icon: Users, color: "bg-red-50", textColor: "text-red-700", border: "border-red-200" },
  { key: "team", title: "Equipe", icon: Users, color: "bg-red-50", textColor: "text-red-700", border: "border-red-200" },
  
  { key: "premisses", title: "Premissas", icon: Shield, color: "bg-green-50", textColor: "text-green-700", border: "border-green-200" },
  { key: "deliveries", title: "Grupo de Entregas", icon: FileText, color: "bg-green-50", textColor: "text-green-700", border: "border-green-200" },
  { key: "restrictions", title: "Restrições", icon: AlertTriangle, color: "bg-green-50", textColor: "text-green-700", border: "border-green-200" },
  
  { key: "risks", title: "Riscos", icon: AlertTriangle, color: "bg-blue-50", textColor: "text-blue-700", border: "border-blue-200" },
  { key: "timeline", title: "Linha do Tempo", icon: Calendar, color: "bg-blue-50", textColor: "text-blue-700", border: "border-blue-200" },
  { key: "costs", title: "Custos", icon: DollarSign, color: "bg-blue-50", textColor: "text-blue-700", border: "border-blue-200" },
];

export function PMCanvas({ projectName }: PMCanvasProps) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getProjectCanvas(projectName);
      if (res) setData(res);
      setLoading(false);
    }
    load();
  }, [projectName]);

  const handleChange = (key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateProjectCanvas(projectName, data);
    if (res.success) {
      toast.success("Canvas salvo com sucesso!");
    } else {
      toast.error("Erro ao salvar Canvas.");
    }
    setSaving(false);
  };

  if (loading) return <div>Carregando Canvas...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#094160] tracking-tight">PM Canvas Strategist</h2>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border",
              data.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              data.approvalStatus === "Review" ? "bg-amber-50 text-amber-700 border-amber-200" :
              data.approvalStatus === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
              "bg-slate-50 text-slate-600 border-slate-200"
            )}>
              {data.approvalStatus || "Draft"}
            </span>
          </div>
          <p className="text-sm text-gray-500">Planejamento Estratégico para: {projectName}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-100">
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Impacto</span>
                <select 
                  value={data.impactScore || 1} 
                  onChange={(e) => handleChange("impactScore", parseInt(e.target.value))}
                  className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
                >
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Complexidade</span>
                <select 
                  value={data.complexityScore || 1} 
                  onChange={(e) => handleChange("complexityScore", parseInt(e.target.value))}
                  className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
                >
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
          </div>

          <div className="flex gap-2">
            {data.approvalStatus === "Draft" || data.approvalStatus === "Review" ? (
              <Button 
                onClick={() => handleChange("approvalStatus", "Approved")} 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px] font-bold"
              >
                Aprovar
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#094160] hover:bg-[#063045] h-8 text-[10px] font-bold">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 h-auto">
        {/* Coluna 1: Motivação */}
        <div className="md:col-span-1 space-y-3">
          {BLOCKS.slice(0, 3).map((block) => (
            <CanvasBlock key={block.key} block={block} value={data[block.key] || ""} onChange={(v) => handleChange(block.key, v)} />
          ))}
        </div>

        {/* Coluna 2: Produto */}
        <div className="md:col-span-1 space-y-3">
            <CanvasBlock block={BLOCKS[3]} value={data[BLOCKS[3].key] || ""} onChange={(v) => handleChange(BLOCKS[3].key, v)} />
            <CanvasBlock block={BLOCKS[4]} value={data[BLOCKS[4].key] || ""} onChange={(v) => handleChange(BLOCKS[4].key, v)} height="h-[280px]" />
        </div>

        {/* Coluna 3: Pessoas */}
        <div className="md:col-span-1 space-y-3">
            <CanvasBlock block={BLOCKS[5]} value={data[BLOCKS[5].key] || ""} onChange={(v) => handleChange(BLOCKS[5].key, v)} />
            <CanvasBlock block={BLOCKS[6]} value={data[BLOCKS[6].key] || ""} onChange={(v) => handleChange(BLOCKS[6].key, v)} height="h-[280px]" />
        </div>

        {/* Coluna 4: Execução */}
        <div className="md:col-span-1 space-y-3">
            {BLOCKS.slice(7, 10).map((block) => (
                <CanvasBlock key={block.key} block={block} value={data[block.key] || ""} onChange={(v) => handleChange(block.key, v)} />
            ))}
        </div>

        {/* Coluna 5: Entrega */}
        <div className="md:col-span-1 space-y-3">
             {BLOCKS.slice(10, 13).map((block) => (
                <CanvasBlock key={block.key} block={block} value={data[block.key] || ""} onChange={(v) => handleChange(block.key, v)} />
            ))}
        </div>
      </div>
    </div>
  );
}

interface CanvasBlockProps {
  block: any;
  value: string;
  onChange: (v: string) => void;
  height?: string;
}

function CanvasBlock({ block, value, onChange, height = "h-32" }: CanvasBlockProps) {
  const Icon = block.icon;
  return (
    <div className={`${block.color} ${block.border} border rounded-lg p-3 flex flex-col gap-2 transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${block.textColor}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${block.textColor}`}>{block.title}</span>
      </div>
      <Textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white/50 border-none shadow-none text-xs focus-visible:ring-1 focus-visible:ring-offset-0 placeholder:text-gray-300 resize-none ${height}`}
        placeholder="Descreva aqui..."
      />
    </div>
  );
}
