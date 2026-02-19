'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface KanbanColumnProps {
  column: any
  items: any[]
  kanbanCard?: React.ComponentType<any>
  onAdd?: (title: string) => void
  onCardClick?: (item: any) => void
}

export function KanbanColumn({ column, items, kanbanCard: CardComponent = KanbanCard, onAdd, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column
    }
  })

  const itemsIds = useMemo(() => items.map((item) => item.id), [items]);
  
  // Quick Add State
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if(newTitle.trim() && onAdd) {
          onAdd(newTitle)
          setNewTitle('')
          setIsAdding(false)
      }
  }

  return (
    <div className="flex flex-col w-[280px] shrink-0">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 rounded-t-lg border-t-4 bg-gray-50 mb-2 shadow-sm"
        style={{ borderTopColor: column.color || '#ccc' }}
      >
        <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-700 text-sm">
            {column.label}
            </h3>
            <span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full border border-gray-200 font-medium">
            {items.length}
            </span>
        </div>
        {onAdd && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4" />
            </Button>
        )}
      </div>

      {/* Dropszone */}
      <div 
        ref={setNodeRef}
        className="flex-1 bg-gray-50/50 rounded-lg p-2 min-h-[500px] flex flex-col gap-2 border border-dashed border-gray-200"
      >
        {isAdding && (
            <form onSubmit={handleAddSubmit} className="mb-2">
                <Input 
                   value={newTitle} 
                   onChange={e => setNewTitle(e.target.value)} 
                   placeholder="Título..." 
                   className="bg-white"
                   autoFocus
                   onBlur={() => !newTitle && setIsAdding(false)}
                />
            </form>
        )}

        <SortableContext items={itemsIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
             <div key={item.id} onClick={() => onCardClick && onCardClick(item)}>
                <CardComponent item={item} />
             </div>
          ))}
        </SortableContext>
        
        {items.length === 0 && !isAdding && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic py-10">
            Arraste itens aqui
          </div>
        )}
      </div>
    </div>
  )
}
