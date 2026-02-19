"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { User, Calendar, Plus, X, MoreHorizontal, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createProjectItem } from "@/app/actions/items";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ItemDetailsSheet } from "@/components/dashboard/item-details-sheet";

interface KanbanColumnProps {
  id: string;
  title: string;
  items: any[];
  projectId?: string;
  cardComponent?: React.ComponentType<{ item: any; onClick?: () => void }>;
  onAdd?: (title: string) => Promise<void> | void;
  onCardClick?: (item: any) => void;
}

export function KanbanColumn({ id, title, items, projectId, cardComponent: CardComponent, onAdd, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setIsSubmitting(true);
    try {
      if (onAdd) {
        await onAdd(newTask);
        setNewTask("");
        setIsAdding(false);
        // Parent handles toast usually, but we can do generic success here or let parent do it?
        // Let's assume parent does logic, we just reset UI.
      } else {
          const result = await createProjectItem({
            task: newTask,
            status: id,
            originSheet: "Kanban",
            projectId: projectId
          });
          if (result.success) {
            setNewTask("");
            setIsAdding(false);
            toast.success("Tarefa adicionada!");
          }
      }
    } catch(e) {
        toast.error("Erro ao adicionar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-full max-h-full bg-[#f1f2f4] rounded-xl shadow-sm border border-gray-200/50 p-3 shrink-0">
      <div className="flex justify-between items-center mb-4 px-1.5 group/header">
        <div className="flex items-center gap-3 overflow-hidden">
            <h3 className="font-bold text-[#172b4d] text-base truncate" title={title}>
            {title}
            </h3>
            <span className="text-[#44546f] text-xs font-black px-2 py-1 rounded-full bg-black/5 shadow-inner">
            {items.length}
            </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4 text-[#44546f]" />
        </Button>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-2.5 min-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
             CardComponent ? (
                <CardComponent 
                    key={item.id} 
                    item={item} 
                    onClick={() => onCardClick?.(item)}
                />
             ) : (
                <KanbanItem key={item.id} item={item} />
             )
          ))}
        </SortableContext>
      </div>

      <div className="mt-3">
        {isAdding ? (
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 space-y-2">
            <textarea
              autoFocus
              className="w-full text-sm p-2 border-none focus:ring-0 resize-none min-h-[60px]"
              placeholder="Insira um título para este cartão..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isSubmitting} className="bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold">
                Adicionar cartão
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="h-8 w-8">
                <X className="w-4 h-4 text-[#44546f]" />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 h-9 text-[#44546f] hover:bg-black/5 font-semibold text-sm px-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
            Adicionar um cartão
          </Button>
        )}
      </div>
    </div>
  );
}

function KanbanItem({ item }: { item: any }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const priorityColor = {
    "Alta": "text-red-700 bg-red-100/50 border-red-200",
    "Média": "text-orange-700 bg-orange-100/50 border-orange-200",
    "Baixa": "text-blue-700 bg-blue-100/50 border-blue-200",
  }[item.priority as string] || "text-gray-700 bg-gray-100/50 border-gray-200";

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
            // Only open if not dragging
            if (!isDragging) {
              setIsDetailsOpen(true);
            }
        }}
        className={cn(
          "bg-white p-3 rounded-xl shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] border-none cursor-pointer active:cursor-grabbing hover:bg-[#f7f8f9] transition-all group/card relative",
          isDragging && "opacity-50 ring-2 ring-[#0c66e4] z-50 rotate-2"
        )}
      >
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-start">
                <span className={cn("text-[11px] font-black px-2.5 py-1 rounded-md border shadow-sm", priorityColor)}>
                  {(item.priority || "Média").toUpperCase()}
                </span>
                <span className="text-[11px] font-black text-[#44546f] opacity-60 tracking-wider">{item.originSheet}</span>
            </div>
            
            <h4 className="font-bold text-base text-[#172b4d] leading-tight break-words">
                {item.task}
            </h4>

            {item.scenario && (
                <p className="text-xs text-[#44546f] line-clamp-2 leading-relaxed opacity-80 italic">
                    {item.scenario}
                </p>
            )}

            <div className="flex justify-between items-center mt-1">
                <div className="flex items-center gap-3">
                    {item.dateActual && (
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md",
                            new Date(item.dateActual) < new Date() ? "bg-red-100 text-red-700" : "text-[#44546f] bg-slate-100/50"
                        )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(item.dateActual), "d 'de' MMM", { locale: ptBR })}
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-[#44546f]">
                         <div className="flex items-center gap-0.5" title="Comentários">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium">{item._count?.comments || 0}</span>
                         </div>
                    </div>
                </div>

                <div className="flex items-center" title={item.responsible || "Sem responsável"}>
                     <div className="w-6 h-6 rounded-full bg-[#094160] flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-[10px] font-bold text-white">
                            {getInitials(item.responsible)}
                        </span>
                     </div>
                </div>
            </div>
        </div>
      </div>

      <ItemDetailsSheet 
        itemId={item.id}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        taskTitle={item.task}
      />
    </>
  );
}
