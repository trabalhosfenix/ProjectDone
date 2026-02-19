"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectCanvas } from "@prisma/client";
import { getProjectPrioritization } from "@/app/actions/portfolio";
import { TrendingUp, Award, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortfolioPrioritization() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getProjectPrioritization();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <Zap className="absolute top-4 right-4 w-12 h-12 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest opacity-80">🔥 Top Investimento</p>
            <h3 className="text-3xl font-bold mt-3 truncate tracking-tight">
              {data[0]?.projectName || "Iniciando análise..."}
            </h3>
            <p className="text-sm mt-2 font-bold italic bg-white/20 w-fit px-3 py-1 rounded-full">Score: {data[0]?.valueScore || "0.0"}</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 bg-[#094160]/5 rounded-xl border border-[#094160]/10 p-4 flex gap-4 items-center">
            <TrendingUp className="w-10 h-10 text-[#094160] shrink-0" />
            <div>
                <p className="text-sm font-black text-[#094160] uppercase tracking-wider">Lógica de Priorização Elite</p>
                <p className="text-xs text-[#094160]/80 italic leading-relaxed mt-1">
                    Calculamos o <strong>Valor Estratégico</strong> dividindo o Impacto pela Complexidade. 
                    Quanto maior o score, maior o retorno sobre esforço. Projetos aguardando aprovação não entram no ranking principal.
                </p>
            </div>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-[#094160] uppercase tracking-wider flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-500" />
            Ranking de Valor Estratégico e Priorização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="text-xs font-black uppercase py-4">Posição</TableHead>
                <TableHead className="text-xs font-black uppercase py-4">Nome do Projeto</TableHead>
                <TableHead className="text-xs font-black uppercase py-4 text-center">Impacto</TableHead>
                <TableHead className="text-xs font-black uppercase py-4 text-center">Complexidade</TableHead>
                <TableHead className="text-xs font-black uppercase py-4 text-center">Score Valor</TableHead>
                <TableHead className="text-right text-xs font-black uppercase py-4 px-6">Status de Aprovação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">Analisando portfólio...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">Nenhum projeto estratégico cadastrado.</TableCell></TableRow>
              ) : data.map((item, index) => (
                <TableRow key={item.projectName} className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    index === 0 && "bg-emerald-50/30 font-bold"
                )}>
                  <TableCell className="w-20 py-5">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm",
                        index === 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                        #{index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-black text-[#094160]">{item.projectName}</TableCell>
                  <TableCell className="text-center text-sm font-bold">{item.impactScore}/5</TableCell>
                  <TableCell className="text-center text-sm font-bold">{item.complexityScore}/5</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                        "text-sm font-black",
                        parseFloat(item.valueScore) >= 1 ? "text-emerald-600" : "text-amber-600"
                    )}>
                        {item.valueScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className={cn(
                        "text-[xs] px-3 py-1 rounded-full font-black uppercase tracking-wider border shadow-sm",
                        item.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        item.approvalStatus === "Review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                        {item.approvalStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
