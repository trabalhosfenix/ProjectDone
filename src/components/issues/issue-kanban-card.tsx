'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, MessageSquare } from 'lucide-react'

interface IssueKanbanCardProps {
  item: any
  onClick?: () => void
}

export function IssueKanbanCard({ item, onClick }: IssueKanbanCardProps) {
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

  // ... (style and getTypeColor can be removed if unused)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging && onClick) onClick()
      }}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all group ${isDragging ? "ring-2 ring-blue-500" : ""}`}
    >
      {/* Code and Class badges removed */}
      
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {item.title}
      </h4>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
            {/* Responsáveis/Envolvidos (Pega o primeiro) */}
             {item.members && item.members.length > 0 ? (
                <div className="flex -space-x-1">
                    {item.members.slice(0,3).map((m: any) => (
                        <div key={m.id} className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold uppercase border border-white" title={m.user.name}>
                            {m.user.name?.substring(0,2)}
                        </div>
                    ))}
                </div>
             ) : (
                 <div className="flex items-center gap-1 text-gray-400">
                   <User className="w-3.5 h-3.5" />
                 </div>
             )}
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Comentários">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{item._count?.comments || 0}</span>
            </div>
            {item.plannedEnd && (
                <div className="flex items-center gap-1" title="Data Prevista">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.plannedEnd).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
