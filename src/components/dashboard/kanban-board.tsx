'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  MeasuringStrategy,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { updateItemStatus } from '@/app/actions/items'
import { updateProjectItem } from '@/app/actions/project-items'
import { toast } from 'sonner'
import { KanbanColumn } from './kanban-column'
import { Card, CardContent } from '@/components/ui/card'
import { KANBAN_STATUS, normalizeTaskStatus, type KanbanStatus } from '@/lib/task-status'

const BOARD_COLUMNS = KANBAN_STATUS
type BoardStatus = KanbanStatus

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
  allowCreate?: boolean
}

function normalizeStatus(status: string | null): BoardStatus {
  return normalizeTaskStatus(status)
}

export function KanbanBoard({ initialItems, projectId, allowCreate = true }: KanbanBoardProps) {
  const [items, setItems] = useState<KanbanTask[]>(
    initialItems.map((item) => ({ ...item, status: normalizeStatus(item.status) }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragSnapshot, setDragSnapshot] = useState<{ id: string; status: BoardStatus } | null>(null)

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
    const itemId = event.active.id as string
    const item = items.find((i) => i.id === itemId)
    setActiveId(itemId)
    setDragSnapshot(item ? { id: itemId, status: normalizeStatus(item.status) } : null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const activeItem = items.find((item) => item.id === activeId)
    if (!activeItem) return

    const overId = String(over.id)
    let nextStatus = activeItem.status as BoardStatus

    if (BOARD_COLUMNS.includes(overId as BoardStatus)) {
      nextStatus = overId as BoardStatus
    } else {
      const overItem = items.find((i) => i.id === overId)
      if (overItem) nextStatus = normalizeStatus(overItem.status)
    }

    if (nextStatus === activeItem.status) return
    setItems((previous) =>
      previous.map((item) => (item.id === activeId ? { ...item, status: nextStatus } : item))
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      if (dragSnapshot) {
        setItems((previous) =>
          previous.map((item) =>
            item.id === dragSnapshot.id ? { ...item, status: dragSnapshot.status } : item
          )
        )
      }
      setDragSnapshot(null)
      return
    }

    const itemId = String(active.id)
    const activeItem = items.find((item) => item.id === itemId)
    if (!activeItem) {
      setDragSnapshot(null)
      return
    }

    const overId = String(over.id)
    let nextStatus: BoardStatus

    if (BOARD_COLUMNS.includes(overId as BoardStatus)) {
      nextStatus = overId as BoardStatus
    } else {
      const overItem = items.find((i) => i.id === overId)
      nextStatus = overItem ? normalizeStatus(overItem.status) : normalizeStatus(activeItem.status)
    }

    const previousStatus =
      dragSnapshot?.id === itemId ? dragSnapshot.status : normalizeStatus(activeItem.status)

    if (previousStatus === nextStatus) {
      setDragSnapshot(null)
      return
    }

    const result = await updateItemStatus(itemId, nextStatus)
    if (!result.success) {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: previousStatus } : item))
      )
      toast.error('Erro ao sincronizar mudança de status.')
      setDragSnapshot(null)
      return
    }

    toast.success(`Status atualizado para ${nextStatus}`)
    setDragSnapshot(null)
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollision = pointerWithin(args)
    return pointerCollision.length > 0 ? pointerCollision : closestCorners(args)
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[560px]">
      {!allowCreate && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Painel em modo visual: criação de cartões disponível no Kanban de cada projeto.
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
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
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              items={column.items}
              projectId={projectId}
              allowCreate={allowCreate}
              onQuickUpdate={updateCard}
            />
          ))}

          <DragOverlay>
            {activeId ? (
              <Card className="w-[300px] rounded-xl bg-white p-0 shadow-xl opacity-95 cursor-grabbing rotate-2 transform">
                <CardContent className="p-3">
                  <p className="font-medium text-sm leading-tight">
                    {items.find((i) => i.id === activeId)?.task}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
