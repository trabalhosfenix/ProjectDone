"use client";

import { cn } from "@/lib/utils";

interface PerformanceGaugeProps {
  value: number;
  label: string;
  min?: number;
  max?: number;
  colorRange?: "performance" | "cost";
}

export function PerformanceGauge({ value, label, min = 0, max = 2, colorRange = "performance" }: PerformanceGaugeProps) {
  // SPI/CPI: < 0.8 Critico (Vermelho), 0.8-1.0 Atencao (Amarelo), > 1.0 Bom (Verde)
  const getStatusColor = (val: number) => {
    if (val < 0.9) return "text-rose-500 fill-rose-500 stroke-rose-500";
    if (val < 1.0) return "text-amber-500 fill-amber-500 stroke-amber-500";
    return "text-emerald-500 fill-emerald-500 stroke-emerald-500";
  };

  const getStatusBg = (val: number) => {
    if (val < 0.9) return "bg-rose-50 text-rose-700 border-rose-100";
    if (val < 1.0) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  };

  const colorClass = getStatusColor(value);
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Semi-circle background */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress Path */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6"
            style={{ 
              strokeDashoffset: 125.6 - (125.6 * percentage) / 100,
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className={cn("text-2xl font-black", colorClass.split(" ")[0])}>
            {value.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold", getStatusBg(value))}>
          {value < 0.9 ? "Crítico" : value < 1.0 ? "Atenção" : "No Prazo"}
        </span>
      </div>
    </div>
  );
}
