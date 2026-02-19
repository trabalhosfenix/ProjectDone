"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateItemStatus } from "@/app/actions/items";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
  initialItems: any[];
  statusOptions: string[];
  projectId?: string;
}

export function KanbanBoard({ initialItems, statusOptions, projectId }: KanbanBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = statusOptions.map(status => ({
    id: status,
    title: status,
    items: items.filter(item => item.status === status)
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = statusOptions.find(status => status === overId);
    
    if (overColumn) {
        setItems(prev => prev.map(item => 
            item.id === activeId ? { ...item, status: overColumn } : item
        ));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as string;

    if (statusOptions.includes(newStatus)) {
        const result = await updateItemStatus(itemId, newStatus);
        if (result.success) {
            toast.success(`Status atualizado para ${newStatus}`);
        } else {
            toast.error("Erro ao sincronizar status.");
            // Rollback if needed
            setItems(initialItems);
        }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-240px)] min-h-[500px] select-none custom-scrollbar bg-slate-50/30 rounded-xl p-2 items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((column) => (
          <KanbanColumn 
            key={column.id} 
            id={column.id} 
            title={column.title} 
            items={column.items}
            projectId={projectId} 
          />
        ))}
        
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeId ? (
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-[#094160] w-[320px] rotate-3 scale-105 cursor-grabbing">
              <p className="font-black text-[#094160] text-base leading-tight">
                {items.find(i => i.id === activeId)?.task}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
