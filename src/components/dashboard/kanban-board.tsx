'use client'

import { useMemo, useState } from 'react'
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
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { updateItemStatus } from '@/app/actions/items'
import { updateProjectItem } from '@/app/actions/project-items'
import { toast } from 'sonner'
import { KanbanColumn } from './kanban-column'

const BOARD_COLUMNS = ['A iniciar', 'Em andamento', 'Em espera', 'Concluído'] as const

type BoardStatus = (typeof BOARD_COLUMNS)[number]

export interface KanbanTask {
  id: string
  task: string
  status: string | null
  responsible: string | null
  priority: string | null
  originSheet: string
  scenario: string | null
  dateActual: Date | null
  _count?: { comments: number }
}

interface KanbanBoardProps {
  initialItems: KanbanTask[]
  projectId?: string
}

const statusMap: Record<string, BoardStatus> = {
  'a fazer': 'A iniciar',
  'não iniciado': 'A iniciar',
  'nao iniciado': 'A iniciar',
  'a iniciar': 'A iniciar',
  'to do': 'A iniciar',
  'em andamento': 'Em andamento',
  'in progress': 'Em andamento',
  doing: 'Em andamento',
  'em espera': 'Em espera',
  blocked: 'Em espera',
  pausado: 'Em espera',
  concluído: 'Concluído',
  concluido: 'Concluído',
  done: 'Concluído',
  completed: 'Concluído',
}

function normalizeStatus(status: string | null): BoardStatus {
  if (!status) return 'A iniciar'
  return statusMap[status.trim().toLowerCase()] || 'A iniciar'
}

export function KanbanBoard({ initialItems }: KanbanBoardProps) {
  const [items, setItems] = useState<KanbanTask[]>(
    initialItems.map((item) => ({ ...item, status: normalizeStatus(item.status) }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columns = useMemo(
    () =>
      BOARD_COLUMNS.map((status) => ({
        id: status,
        title: status,
        items: items.filter((item) => item.status === status),
      })),
    [items]
  )

  const updateCard = async (
    itemId: string,
    payload: { task?: string; responsible?: string | null; priority?: string; status?: BoardStatus }
  ) => {
    const previous = [...items]

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              task: payload.task ?? item.task,
              responsible: payload.responsible === undefined ? item.responsible : payload.responsible,
              priority: payload.priority ?? item.priority,
              status: payload.status ?? item.status,
            }
          : item
      )
    )

    const result = await updateProjectItem(itemId, {
      task: payload.task,
      responsible: payload.responsible === undefined ? undefined : payload.responsible || '',
      priority: payload.priority,
      status: payload.status,
    })

    if (!result.success) {
      setItems(previous)
      toast.error('Não foi possível salvar o ajuste do card.')
      return
    }

    toast.success('Card atualizado com sucesso.')
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeItemId = active.id as string
    const overId = over.id as string
    const overColumn = BOARD_COLUMNS.find((status) => status === overId)

    if (overColumn) {
      setItems((prev) => prev.map((item) => (item.id === activeItemId ? { ...item, status: overColumn } : item)))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const draggedItem = items.find((item) => item.id === itemId)
    if (!draggedItem) return

    const overId = over.id as string
    let nextStatus: BoardStatus = normalizeStatus(draggedItem.status)

    if (BOARD_COLUMNS.includes(overId as BoardStatus)) {
      nextStatus = overId as BoardStatus
    } else {
      const overItem = items.find((item) => item.id === overId)
      if (overItem) nextStatus = normalizeStatus(overItem.status)
    }

    const previousStatus = normalizeStatus(draggedItem.status)
    if (previousStatus === nextStatus) return

    const result = await updateItemStatus(itemId, nextStatus)
    if (!result.success) {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status: previousStatus } : item)))
      toast.error('Erro ao sincronizar mudança de status.')
      return
    }

    toast.success(`Status atualizado para ${nextStatus}`)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-240px)] min-h-[500px] select-none custom-scrollbar rounded-xl p-2 items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((column) => (
          <KanbanColumn key={column.id} id={column.id} title={column.title} items={column.items} onQuickUpdate={updateCard} />
        ))}

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-[#094160] w-[320px] rotate-3 scale-105 cursor-grabbing">
              <p className="font-black text-[#094160] text-base leading-tight">{items.find((i) => i.id === activeId)?.task}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
