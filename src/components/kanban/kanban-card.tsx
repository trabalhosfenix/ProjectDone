'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, AlignLeft, AlertCircle } from 'lucide-react'
import { ProjectItem } from '@prisma/client'

interface KanbanCardProps {
  item: any
}

export function KanbanCard({ item }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id,
    data: {
      type: 'Item',
      item,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  // Cor da prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-700'
      case 'Média': return 'bg-yellow-100 text-yellow-700'
      case 'Baixa': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow group ${isDragging ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
          {item.displayId}
        </span>
        {item.priority && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
        )}
      </div>

      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {item.name}
      </h4>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
          {item.responsible ? (
            <div className="flex items-center gap-1" title={`Responsável: ${item.responsible}`}>
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold uppercase">
                {item.responsible.substring(0,2)}
              </div>
              <span className="hidden group-hover:inline max-w-[80px] truncate">
                {item.responsible}
              </span>
            </div>
          ) : (
             <div className="flex items-center gap-1 text-gray-400">
               <User className="w-3.5 h-3.5" />
               <span>Sem resp.</span>
             </div>
          )}
        </div>

        {item.endDate && (
             <div className="flex items-center gap-1" title="Data de entrega">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(item.endDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
             </div>
        )}
      </div>
    </div>
  )
}
