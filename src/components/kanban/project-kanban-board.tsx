'use client'

import { useRef, useState, type ReactNode } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  pointerWithin,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable,
  DragOverEvent,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
  type CollisionDetection
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createKanbanItem, moveKanbanItem, deleteKanbanItem } from '@/app/actions/kanban'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { KANBAN_STATUS, normalizeTaskStatus } from '@/lib/task-status'

type KanbanItem = {
  id: string
  wbs?: string | null
  task: string
  scenario?: string | null
  originSheet?: string | null
  status: string
  responsible: string | null
  priority: string | null
  datePlanned: string | Date | null
  datePlannedEnd: string | Date | null
  dateActualStart: string | Date | null
  dateActual: string | Date | null
  metadata?: Record<string, unknown> | null
}

const COLUMNS = KANBAN_STATUS.map((status) => ({
  id: status,
  title: status,
  color:
    status === 'Concluído'
      ? 'bg-green-50'
      : status === 'Em andamento'
        ? 'bg-blue-50'
        : status === 'Em espera'
          ? 'bg-yellow-50'
          : 'bg-gray-100',
}))

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeTaskTitle(value?: string | null) {
  const title = String(value || '').trim()
  return title || 'Tarefa sem titulo'
}

function normalizeOriginLabel(value?: string | null) {
  const key = String(value || '').trim().toUpperCase()
  if (!key) return 'Manual'
  if (key === 'KANBAN') return 'Manual'
  if (key === 'CRONOGRAMA_IMPORT') return 'Importado'
  if (key === 'MANUAL') return 'Manual'
  return key
}

function KanbanDroppableColumn({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${isOver ? 'bg-blue-50/40' : ''}`}
    >
      {children}
    </div>
  )
}

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
       <Card className="group relative mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardContent className="p-3">
             <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {item.id.slice(-4).toUpperCase()}
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                    {item.priority || 'Média'}
                </Badge>
             </div>
             
             <p className="font-medium text-sm mb-1 line-clamp-3">{normalizeTaskTitle(item.task)}</p>
             {!!item.wbs && (
               <p className="text-[11px] text-blue-700 mb-1 font-semibold">WBS: {item.wbs}</p>
             )}
             {!!item.scenario && (
               <p className="text-xs text-gray-500 mb-2 line-clamp-2 italic">{item.scenario}</p>
             )}
             
             <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                 <div className="flex items-center gap-2">
                     <User className="w-3 h-3" />
                     {item.responsible || 'Sem resp.'}
                     <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                       {normalizeOriginLabel(item.originSheet)}
                     </span>
                 </div>
                 <div className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {parseDate(item.datePlannedEnd || item.dateActual)?.toLocaleDateString('pt-BR') || '--/--'}
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

export function ProjectKanbanBoard({ projectId, initialItems, responsibleOptions = [] }: { projectId: string, initialItems: KanbanItem[], responsibleOptions?: string[] }) {
  const [items, setItems] = useState<KanbanItem[]>(
    initialItems.map((item) => ({ ...item, status: normalizeTaskStatus(item.status) }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragSnapshot, setDragSnapshot] = useState<{ id: string; status: string } | null>(null)
  const [addingColumn, setAddingColumn] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [newScenario, setNewScenario] = useState('')
  const [newWbs, setNewWbs] = useState('')
  const [newResponsible, setNewResponsible] = useState('')
  const [newPriority, setNewPriority] = useState('Média')
  const [newPlannedStart, setNewPlannedStart] = useState(toDateInputValue(new Date()))
  const [newPlannedEnd, setNewPlannedEnd] = useState('')
  const tempIdRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function resetNewCardForm() {
    setNewTask('')
    setNewScenario('')
    setNewWbs('')
    setNewResponsible('')
    setNewPriority('Média')
    setNewPlannedStart(toDateInputValue(new Date()))
    setNewPlannedEnd('')
  }

  async function handleAddItem(status: string) {
      if (!newTask.trim()) return
      
      tempIdRef.current += 1
      const tempId = `temp-${tempIdRef.current}`
      const newItem: KanbanItem = {
          id: tempId,
          wbs: newWbs.trim() || null,
          task: normalizeTaskTitle(newTask),
          scenario: newScenario || null,
          originSheet: 'KANBAN',
          status: normalizeTaskStatus(status),
          responsible: newResponsible || null,
          priority: newPriority || 'Média',
          datePlanned: newPlannedStart || null,
          datePlannedEnd: newPlannedEnd || null,
          dateActualStart: null,
          dateActual: null,
          metadata: {
            needsScheduling: !newPlannedStart || !newPlannedEnd,
            createdFrom: 'KANBAN',
          },
      }
      
      setItems([...items, newItem])
      resetNewCardForm()
      setAddingColumn(null)

      const result = await createKanbanItem({
        projectId,
        task: normalizeTaskTitle(newTask),
        wbs: newWbs.trim() || undefined,
        scenario: newScenario || undefined,
        status,
        responsible: newResponsible || undefined,
        priority: newPriority,
        datePlanned: newPlannedStart || null,
        datePlannedEnd: newPlannedEnd || null,
      })
      if (result.success && result.data) {
          setItems(prev => prev.map(i => i.id === tempId ? { ...result.data, status: normalizeTaskStatus(result.data.status) } as KanbanItem : i))
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
    const draggingId = String(event.active.id)
    const activeItem = items.find((item) => item.id === draggingId)
    setActiveId(draggingId)
    setDragSnapshot(activeItem ? { id: draggingId, status: activeItem.status } : null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const draggingId = String(active.id)
    const activeItem = items.find((item) => item.id === draggingId)
    if (!activeItem) return

    const overId = String(over.id)
    let targetStatus = activeItem.status

    if (COLUMNS.some((column) => column.id === overId)) {
      targetStatus = overId
    } else {
      const overItem = items.find((item) => item.id === overId)
      if (overItem) targetStatus = overItem.status
    }

    const normalizedTarget = normalizeTaskStatus(targetStatus)
    if (normalizedTarget === activeItem.status) return

    setItems((previous) => previous.map((item) => (item.id === draggingId ? { ...item, status: normalizedTarget } : item)))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) {
      if (dragSnapshot) {
        setItems((previous) =>
          previous.map((item) => (item.id === dragSnapshot.id ? { ...item, status: dragSnapshot.status } : item))
        )
      }
      setDragSnapshot(null)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id) // Pode ser item ID ou column ID

    // Encontrar item e novo status
    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) {
      setDragSnapshot(null)
      return
    }

    // Se soltou em uma coluna vazia (overId é o status)
    let newStatus = activeItem.status
    if (COLUMNS.some(c => c.id === overId)) {
        newStatus = overId
    } else {
        // Soltou sobre outro item, pegar o status desse item
        const overItem = items.find(i => i.id === overId)
        if (overItem) newStatus = overItem.status
    }

    const normalizedNextStatus = normalizeTaskStatus(newStatus)
    const previousStatus = dragSnapshot?.id === activeId ? dragSnapshot.status : activeItem.status

    if (previousStatus !== normalizedNextStatus) {
        const result = await moveKanbanItem(activeId, projectId, normalizedNextStatus)
        if (!result.success) {
          setItems((previous) =>
            previous.map((item) => (item.id === activeId ? { ...item, status: previousStatus } : item))
          )
          toast.error(result.error || 'Erro ao mover card')
        }
    }
    setDragSnapshot(null)
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    return pointer.length > 0 ? pointer : closestCorners(args)
  }

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
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
                    
                    <KanbanDroppableColumn id={col.id}>
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
                                            resetNewCardForm()
                                        }
                                    }}
                                />
                                <Input
                                  placeholder="Contexto / descrição curta"
                                  className="mb-2 bg-white"
                                  value={newScenario}
                                  onChange={e => setNewScenario(e.target.value)}
                                />
                                <Input
                                  placeholder="WBS (ex: 1.2.3)"
                                  className="mb-2 bg-white"
                                  value={newWbs}
                                  onChange={e => setNewWbs(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <select
                                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                                    value={newResponsible}
                                    onChange={(e) => setNewResponsible(e.target.value)}
                                  >
                                    <option value="">Sem responsável</option>
                                    {responsibleOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value)}
                                  >
                                    <option value="Baixa">Baixa</option>
                                    <option value="Média">Média</option>
                                    <option value="Alta">Alta</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <Input
                                    type="date"
                                    className="bg-white"
                                    value={newPlannedStart}
                                    onChange={e => setNewPlannedStart(e.target.value)}
                                  />
                                  <Input
                                    type="date"
                                    className="bg-white"
                                    value={newPlannedEnd}
                                    onChange={e => setNewPlannedEnd(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setAddingColumn(null)
                                        resetNewCardForm()
                                      }}
                                    >
                                      Cancelar
                                    </Button>
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
                            </div>
                        )}
                    </KanbanDroppableColumn>
                </div>
            )
        })}
      </div>

      <DragOverlay>
        {activeId ? (
            <Card className="w-[280px] shadow-xl opacity-90 cursor-grabbing bg-white rotate-2 transform">
                <CardContent className="p-3">
                     <p className="font-medium text-sm">{normalizeTaskTitle(items.find(i => i.id === activeId)?.task)}</p>
                </CardContent>
            </Card>
        ) : null}
      </DragOverlay>

    </DndContext>
  )
}
