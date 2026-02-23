'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Calendar, Plus, X, MessageSquare, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createProjectItem } from '@/app/actions/items'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ItemDetailsSheet } from '@/components/dashboard/item-details-sheet'
import { KanbanTask } from './kanban-board'

const BOARD_COLUMNS = ['A iniciar', 'Em andamento', 'Em espera', 'Concluído'] as const

interface KanbanColumnProps {
  id: string
  title: string
  items: KanbanTask[]
  projectId?: string
  onAdd?: (title: string) => Promise<void> | void
  onCardClick?: (item: KanbanTask) => void
  allowCreate?: boolean
  onQuickUpdate?: (
    itemId: string,
    payload: { task?: string; responsible?: string | null; priority?: string; status?: (typeof BOARD_COLUMNS)[number] }
  ) => Promise<void>
}

function normalizeTaskTitle(task?: string | null) {
  const value = String(task || '').trim()
  return value || 'Tarefa sem titulo'
}

function normalizeOriginLabel(origin?: string | null) {
  const key = String(origin || '').trim().toUpperCase()
  if (!key) return 'Manual'
  if (key === 'KANBAN' || key === 'MANUAL') return 'Manual'
  if (key === 'CRONOGRAMA_IMPORT') return 'Importado'
  return key
}

export function KanbanColumn({ id, title, items, projectId, onAdd, onCardClick, allowCreate = true, onQuickUpdate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newWbs, setNewWbs] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canCreate = allowCreate && (Boolean(onAdd) || Boolean(projectId))

  const handleAdd = async () => {
    if (!newTask.trim()) return

    if (!allowCreate) {
      toast.info('Criação desativada nesta visualização. Use o Kanban do projeto para criar cartões.')
      return
    }

    if (!onAdd && !projectId) {
      toast.error('Não foi possível criar: selecione um projeto para vincular o cartão.')
      return
    }
    setIsSubmitting(true)
    try {
      if (onAdd) {
        await onAdd(newTask)
      } else {
        const result = await createProjectItem({
          task: newTask,
          wbs: newWbs || undefined,
          status: id,
          originSheet: 'Kanban',
          projectId,
        })
        if (!result.success) {
          toast.error('Erro ao adicionar')
          return
        }
      }

      setNewTask('')
      setNewWbs('')
      setIsAdding(false)
      toast.success('Tarefa adicionada!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-w-[280px] w-[300px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full max-h-full shadow-sm">
      <div className={`p-4 border-b flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10 ${id === 'Concluído' ? 'border-green-200' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-semibold text-gray-700 truncate" title={title}>
            {title}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        {canCreate ? (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 text-gray-400 hover:text-blue-600" />
          </Button>
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-3 space-y-3 transition-colors duration-200',
          isOver ? 'bg-blue-50/40' : 'bg-transparent'
        )}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanItem key={item.id} item={item} onClick={() => onCardClick?.(item)} onQuickUpdate={onQuickUpdate} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm italic bg-white/60">
            Arraste itens aqui
          </div>
        )}
      </div>

      <div className="p-3 pt-0 bg-transparent">
        {isAdding ? (
          <div className="mb-0">
            <textarea
              autoFocus
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none min-h-[60px] mb-2"
              placeholder="Título do card..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Input
              placeholder="WBS (ex: 1.2.3)"
              value={newWbs}
              onChange={(e) => setNewWbs(e.target.value)}
              className="mb-2 bg-white"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isSubmitting}>
                Adicionar cartão
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsAdding(false)
                  setNewTask('')
                  setNewWbs('')
                }}
                className="h-8 w-8 text-gray-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9 text-[#44546f] hover:bg-black/5 font-semibold text-sm px-2 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setIsAdding(true)}
              disabled={!canCreate}
              title={!canCreate ? 'Criação indisponível sem contexto de projeto' : undefined}
            >
              <Plus className="w-4 h-4" />
              Adicionar um cartão
            </Button>
            {!canCreate && <p className="px-2 text-xs text-[#44546f]/80">Criação disponível apenas no Kanban do projeto.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanItem({
  item,
  onClick,
  onQuickUpdate,
}: {
  item: KanbanTask
  onClick?: () => void
  onQuickUpdate?: (
    itemId: string,
    payload: { task?: string; responsible?: string | null; priority?: string; status?: (typeof BOARD_COLUMNS)[number] }
  ) => Promise<void>
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    task: normalizeTaskTitle(item.task),
    responsible: item.responsible || '',
    priority: item.priority || 'Média',
    status: (item.status || 'A iniciar') as (typeof BOARD_COLUMNS)[number],
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColor =
    {
      Alta: 'text-red-700 bg-red-100/50 border-red-200',
      Média: 'text-orange-700 bg-orange-100/50 border-orange-200',
      Baixa: 'text-blue-700 bg-blue-100/50 border-blue-200',
    }[item.priority || 'Média'] || 'text-gray-700 bg-gray-100/50 border-gray-200'

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const saveQuickEdit = async () => {
    if (!onQuickUpdate) return
    await onQuickUpdate(item.id, {
      task: form.task,
      responsible: form.responsible.trim() || null,
      priority: form.priority,
      status: form.status,
    })
    setIsEditing(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isDragging) {
            onClick?.()
            setIsDetailsOpen(true)
          }
        }}
        className={cn(
          'bg-white p-3 rounded-xl shadow-sm border border-gray-200 cursor-pointer active:cursor-grabbing hover:shadow-md transition-all duration-200 group/card relative',
          isDragging && 'opacity-60 ring-2 ring-[#0c66e4] z-50 rotate-2 shadow-xl'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/card:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing((prev) => !prev)
          }}
        >
          <Settings className="w-4 h-4 text-[#44546f]" />
        </Button>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-start">
            <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-md border shadow-sm', priorityColor)}>{(item.priority || 'Média').toUpperCase()}</span>
            <span className="text-[11px] font-black text-[#44546f] opacity-60 tracking-wider">{normalizeOriginLabel(item.originSheet)}</span>
          </div>

          <h4 className="font-bold text-base text-[#172b4d] leading-tight break-words">{normalizeTaskTitle(item.task)}</h4>

          {item.scenario && <p className="text-xs text-[#44546f] line-clamp-2 leading-relaxed opacity-80 italic">{item.scenario}</p>}

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-3">
              {item.dateActual && (
                <div className={cn('flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md', new Date(item.dateActual) < new Date() ? 'bg-red-100 text-red-700' : 'text-[#44546f] bg-slate-100/50')}>
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

            <div className="flex items-center" title={item.responsible || 'Sem responsável'}>
              <div className="w-6 h-6 rounded-full bg-[#094160] flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-[10px] font-bold text-white">{getInitials(item.responsible)}</span>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div
            className="mt-3 border-t pt-3 space-y-2"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="space-y-1">
              <Label className="text-xs">Tarefa</Label>
              <Input value={form.task} onChange={(e) => setForm((prev) => ({ ...prev, task: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                <Input value={form.responsible} onChange={(e) => setForm((prev) => ({ ...prev, responsible: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioridade</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(value: (typeof BOARD_COLUMNS)[number]) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_COLUMNS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveQuickEdit}>
                Salvar
              </Button>
            </div>
          </div>
        )}
      </div>

      <ItemDetailsSheet itemId={item.id} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} taskTitle={item.task} />
    </>
  )
}
