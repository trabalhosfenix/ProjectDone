"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Clock, User, CheckCircle2, AlertCircle, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  userName: string | null;
  createdAt: Date;
  projectItem: {
    task: string | null;
  };
}

export function RecentActivity({ activities }: { activities: any[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Activity className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs italic">Nenhuma atividade recente.</p>
      </div>
    );
  }

  const getIcon = (field: string) => {
    if (field === "Status") return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    if (field === "Prioridade") return <AlertCircle className="w-3 h-3 text-amber-500" />;
    return <FileEdit className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="group relative pl-6 pb-4 border-l border-gray-100 last:pb-0">
          <div className="absolute left-[-6.5px] top-0 bg-white border border-gray-200 rounded-full p-1 group-hover:border-blue-200 transition-colors">
            {getIcon(activity.field)}
          </div>
          
          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-0.5">
              <span className="text-[10px] font-bold text-[#094160] line-clamp-1 flex-1 pr-2">
                {activity.projectItem.task}
              </span>
              <span className="text-[9px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            
            <p className="text-[10px] text-gray-500 leading-tight">
              <span className="font-bold text-gray-700">{activity.userName || "Sistema"}</span> alterou{" "}
              <span className="font-medium text-blue-600">{activity.field}</span> de{" "}
              <span className="italic">"{activity.oldValue || "Vazio"}"</span> para{" "}
              <span className="font-bold text-[#094160]">"{activity.newValue}"</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
