"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getResourceAllocation } from "@/app/actions/resources";
import { Progress } from "@/components/ui/progress";
import { Users, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResourceAllocationMap() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getResourceAllocation();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>Carregando Mapa de Alocação...</div>;
  if (!data) return <div>Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-[#094160] tracking-tight">Mapa de Alocação de Pessoas</h2>
          <p className="text-sm text-gray-500 italic">Disponibilidade e carga horária semanal (Simulado: 8h/dia)</p>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                <span>Ideal (0-75%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-sm" />
                <span>Limite (75-100%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                <span>Sobrecarga (&gt;100%)</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-[#094160] w-[200px]">Pessoas</th>
                {data.days.map((day: any) => (
                  <th key={day.date} className="p-4 text-center text-[10px] font-black uppercase tracking-tight text-gray-500 border-l italic">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.allocationData.length === 0 ? (
                <tr>
                   <td colSpan={6} className="p-10 text-center text-gray-400 text-sm">Nenhuma alocação encontrada para esta semana.</td>
                </tr>
              ) : (
                data.allocationData.map((person: any) => (
                  <tr key={person.responsible} className="border-b last:border-0 hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 font-bold text-[#094160] text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#094160] text-white flex items-center justify-center text-[10px]">
                                {person.responsible.substring(0,2).toUpperCase()}
                            </div>
                            {person.responsible}
                        </div>
                    </td>
                    {person.dailyStats.map((day: any) => (
                      <td key={day.day} className="p-4 border-l vertical-top align-top min-w-[150px]">
                        <div className="space-y-2">
                          {day.tasks.length > 0 ? (
                             <>
                               {day.tasks.slice(0, 2).map((t: any) => (
                                 <div key={t.id} className="text-[10px] bg-blue-50 text-blue-700 p-1 rounded border border-blue-100 line-clamp-1">
                                    {t.task}
                                 </div>
                               ))}
                               {day.tasks.length > 2 && (
                                 <div className="text-[9px] text-gray-400 italic text-center">+{day.tasks.length - 2} mais tarefas</div>
                               )}
                               <div className="pt-2 border-t mt-2">
                                  <div className="flex justify-between text-[10px] font-bold mb-1">
                                    <span className={cn(
                                        day.percentage > 100 ? "text-rose-600" : 
                                        day.percentage >= 75 ? "text-amber-600" : "text-emerald-600"
                                    )}>{day.percentage}%</span>
                                    <span className="text-gray-400">{day.hours}:00h</span>
                                  </div>
                                  <Progress 
                                    value={Math.min(day.percentage, 100)} 
                                    className="h-1" 
                                    indicatorClassName={cn(
                                        day.percentage > 100 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : 
                                        day.percentage >= 75 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                  />
                               </div>
                             </>
                          ) : (
                            <div className="h-full flex items-center justify-center py-4">
                               <span className="text-[10px] text-gray-300 font-medium">Disponível</span>
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-100">
         <CardContent className="p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
                Este mapa consolida a <strong>carga horária planejada</strong> dos recursos. 
                A sobrecarga (rosa/brilho) indica que o colaborador possui mais de 4 tarefas no mesmo dia (estime de 2h por tarefa).
                Utilize esta visão para equilibrar a distribuição de trabalho e evitar burnouts.
            </p>
         </CardContent>
      </Card>
    </div>
  );
}
