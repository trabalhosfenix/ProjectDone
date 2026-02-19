'use client'

import { useState } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createKanbanItem, moveKanbanItem, deleteKanbanItem } from '@/app/actions/kanban'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

type KanbanItem = {
  id: string
  task: string
  status: string
  responsible: string | null
  priority: string | null
  dateActualEnd: Date | null
}

const COLUMNS = [
  { id: 'A iniciar', title: 'A iniciar', color: 'bg-gray-100' },
  { id: 'Em andamento', title: 'Em andamento', color: 'bg-blue-50' },
  { id: 'Em espera', title: 'Em espera', color: 'bg-yellow-50' },
  { id: 'Concluído', title: 'Concluído', color: 'bg-green-50' }
]

function SortableItem({ item, onDelete }: { item: KanbanItem, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { ...item } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none select-none">
       <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardContent className="p-3">
             <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {item.id.slice(-4).toUpperCase()}
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                    {item.priority || 'Média'}
                </Badge>
             </div>
             
             <p className="font-medium text-sm mb-3 line-clamp-3">{item.task}</p>
             
             <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                 <div className="flex items-center gap-1">
                     <User className="w-3 h-3" />
                     {item.responsible || 'Sem resp.'}
                 </div>
                 <div className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {item.dateActualEnd ? new Date(item.dateActualEnd).toLocaleDateString('pt-BR') : '--/--'}
                 </div>
             </div>
             
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                }}
             >
                <X className="w-3 h-3 text-red-400" />
             </Button>

          </CardContent>
       </Card>
    </div>
  )
}

export function ProjectKanbanBoard({ projectId, initialItems }: { projectId: string, initialItems: KanbanItem[] }) {
  const [items, setItems] = useState<KanbanItem[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addingColumn, setAddingColumn] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleAddItem(status: string) {
      if (!newTask.trim()) return
      
      const tempId = Math.random().toString(36).substr(2, 9)
      const newItem: KanbanItem = {
          id: tempId,
          task: newTask,
          status,
          responsible: null,
          priority: 'Média',
          dateActualEnd: null
      }
      
      setItems([...items, newItem])
      setNewTask('')
      setAddingColumn(null)

      const result = await createKanbanItem(projectId, newTask, status)
      if (result.success && result.data) {
          setItems(prev => prev.map(i => i.id === tempId ? { ...result.data, dateActualEnd: result.data.dateActualEnd ? new Date(result.data.dateActualEnd) : null } as KanbanItem : i))
          toast.success("Card criado")
      } else {
          setItems(prev => prev.filter(i => i.id !== tempId))
          toast.error("Erro ao criar card")
      }
  }

  async function handleDelete(id: string) {
      const backup = [...items]
      setItems(items.filter(i => i.id !== id))
      const result = await deleteKanbanItem(id, projectId)
      if (!result.success) {
          setItems(backup)
          toast.error("Erro ao deletar")
      }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string // Pode ser item ID ou column ID

    // Encontrar item e novo status
    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) return

    // Se soltou em uma coluna vazia (overId é o status)
    let newStatus = activeItem.status
    if (COLUMNS.some(c => c.id === overId)) {
        newStatus = overId
    } else {
        // Soltou sobre outro item, pegar o status desse item
        const overItem = items.find(i => i.id === overId)
        if (overItem) newStatus = overItem.status
    }

    if (activeItem.status !== newStatus) {
        // Mudou de coluna
        const newItems = items.map(i => i.id === activeId ? { ...i, status: newStatus } : i)
        setItems(newItems)
        
        await moveKanbanItem(activeId, projectId, newStatus)
    }
  }

  function handleDragOver(event: DragOverEvent) {
      // Opcional: Reordenar visualmente enquanto arrasta (sortable strategy)
      // Para Kanban simples de status change, DragEnd resolve o status.
      // DndKit Sortable precisa que os items estejam em containers SortableContext.
  }

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] items-start">
        {COLUMNS.map(col => {
            const colItems = items.filter(i => i.status === col.id)
            return (
                <div key={col.id} className="min-w-[280px] w-[300px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full max-h-full">
                    <div className={`p-4 border-b flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10 ${col.id === 'Concluído' ? 'border-green-200' : ''}`}>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">{col.title}</span>
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200">{colItems.length}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingColumn(col.id)}>
                            <Plus className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {addingColumn === col.id && (
                            <div className="mb-3">
                                <Input 
                                    autoFocus
                                    placeholder="Título do card..."
                                    className="mb-2 bg-white"
                                    value={newTask}
                                    onChange={e => setNewTask(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddItem(col.id)
                                        if (e.key === 'Escape') {
                                            setAddingColumn(null)
                                            setNewTask('')
                                        }
                                    }}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setAddingColumn(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => handleAddItem(col.id)}>Adicionar</Button>
                                </div>
                            </div>
                        )}

                        <SortableContext items={colItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {colItems.map(item => (
                                <SortableItem key={item.id} item={item} onDelete={handleDelete} />
                            ))}
                        </SortableContext>
                        
                        {colItems.length === 0 && !addingColumn && (
                            <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm italic">
                                Arraste itens aqui
                                {/* Droppable area placeholder */}
                            </div>
                        )}
                        {/* Area vazia da coluna tbm deve ser droppable */}
                        <SortableContext items={[]} id={col.id} strategy={verticalListSortingStrategy}>
                             <div className="flex-grow min-h-[10px]" /> 
                        </SortableContext>
                    </div>
                </div>
            )
        })}
      </div>

      <DragOverlay>
        {activeId ? (
            <Card className="w-[280px] shadow-xl opacity-90 cursor-grabbing bg-white rotate-2 transform">
                <CardContent className="p-3">
                     <p className="font-medium text-sm">{items.find(i => i.id === activeId)?.task}</p>
                </CardContent>
            </Card>
        ) : null}
      </DragOverlay>

    </DndContext>
  )
}
