import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Target, Percent } from "lucide-react";

interface KPIProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    blocked: number;
    metaDoDia: number;
    progressPercentage: number;
  };
}

export function KPISection({ stats }: KPIProps) {
  const cards = [
    {
      title: "Total de Cenários",
      value: stats.total,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Concluídos",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Bloqueados",
      value: stats.blocked,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      title: "Meta do Dia",
      value: stats.metaDoDia,
      icon: Target,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-500 mb-1">{card.title}</p>
                <h3 className="text-3xl font-black text-[#094160] tracking-tight">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            {card.title === "Concluídos" && (
                <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.progressPercentage}%` }}
                    />
                </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
