'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createProjectItem, deleteProjectItem, updateProjectItem } from '@/app/actions/project-items'
import { fromProjectItemPriorityLevel } from '@/lib/project-item-priority'
import { toast } from 'sonner'

interface TaskEntitySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  task?: any | null
  responsibleOptions?: string[]
  onSaved?: () => void | Promise<void>
}

type TaskForm = {
  task: string
  wbs: string
  scenario: string
  responsible: string
  status: string
  priority: string
  datePlanned: string
  datePlannedEnd: string
  progress: string
  predecessors: string
}

function toDateInput(value?: string | Date | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function TaskEntitySheet({ open, onOpenChange, projectId, task, responsibleOptions = [], onSaved }: TaskEntitySheetProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isCreate = !task?.id

  const baseForm = useMemo<TaskForm>(() => ({
    task: task?.task || task?.name || '',
    wbs: task?.wbs || '',
    scenario: task?.scenario || '',
    responsible: task?.responsible || '',
    status: task?.status || task?.statusLabel || 'A iniciar',
    priority: fromProjectItemPriorityLevel(task?.priority),
    datePlanned: toDateInput(task?.datePlanned || task?.start),
    datePlannedEnd: toDateInput(task?.datePlannedEnd || task?.end),
    progress: String(Math.round(((task?.metadata?.progress ?? task?.progress ?? 0) <= 1 ? (task?.metadata?.progress ?? task?.progress ?? 0) * 100 : (task?.metadata?.progress ?? task?.progress ?? 0)) || 0)),
    predecessors: String(task?.metadata?.predecessors || task?.dependencies || ''),
  }), [task])

  const [form, setForm] = useState<TaskForm>(baseForm)

  useEffect(() => {
    setForm(baseForm)
  }, [baseForm, open])

  async function handleSave() {
    if (!form.task.trim()) {
      toast.error('Informe o nome da tarefa')
      return
    }

    setSaving(true)
    try {
      const progress = Number(form.progress || '0')
      const normalized = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0))
      const metadata = {
        progress: normalized / 100,
        predecessors: form.predecessors.trim() || undefined,
      }

      if (isCreate) {
        const result = await createProjectItem({
          projectId,
          task: form.task.trim(),
          scenario: form.scenario.trim() || undefined,
          responsible: form.responsible || undefined,
          status: form.status,
          priority: form.priority,
          datePlanned: form.datePlanned ? new Date(form.datePlanned) : undefined,
          datePlannedEnd: form.datePlannedEnd ? new Date(form.datePlannedEnd) : undefined,
          wbs: form.wbs.trim() || undefined,
          metadata,
        } as any)

        if (!result.success) {
          toast.error(result.error || 'Erro ao criar tarefa')
          return
        }
        toast.success('Tarefa criada com sucesso')
        onOpenChange(false)
        await onSaved?.()
        return
      }

      const result = await updateProjectItem(task.id, {
        task: form.task.trim(),
        scenario: form.scenario.trim() || undefined,
        responsible: form.responsible || '',
        status: form.status,
        priority: form.priority,
        datePlanned: form.datePlanned ? new Date(form.datePlanned) : undefined,
        datePlannedEnd: form.datePlannedEnd ? new Date(form.datePlannedEnd) : undefined,
        metadata,
      } as any)

      if (!result.success) {
        toast.error(result.error || 'Erro ao salvar tarefa')
        return
      }

      toast.success('Tarefa atualizada')
      onOpenChange(false)
      await onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task?.id) return
    setDeleting(true)
    try {
      const result = await deleteProjectItem(task.id)
      if (!result.success) {
        toast.error(result.error || 'Erro ao excluir tarefa')
        return
      }
      toast.success('Tarefa excluída')
      onOpenChange(false)
      await onSaved?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-160 overflow-y-auto p-5">
        <SheetHeader>
          <SheetTitle>{isCreate ? 'Nova tarefa' : 'Entidade da tarefa'}</SheetTitle>
          <SheetDescription>
            {isCreate ? 'Crie uma tarefa individual com todos os dados principais.' : 'Edite ou exclua todas as informações da tarefa selecionada.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label>Nome da tarefa</Label>
            <Input value={form.task} onChange={(e) => setForm((p) => ({ ...p, task: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>EAP/WBS</Label><Input value={form.wbs} onChange={(e) => setForm((p) => ({ ...p, wbs: e.target.value }))} /></div>
            <div>
              <Label>Responsável</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={form.responsible} onChange={(e) => setForm((p) => ({ ...p, responsible: e.target.value }))}>
                <option value="">Sem responsável</option>
                {responsibleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Cenário/Descrição</Label>
            <Textarea value={form.scenario} onChange={(e) => setForm((p) => ({ ...p, scenario: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="A iniciar">A iniciar</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Em espera">Em espera</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início planejado</Label><Input type="date" value={form.datePlanned} onChange={(e) => setForm((p) => ({ ...p, datePlanned: e.target.value }))} /></div>
            <div><Label>Fim planejado</Label><Input type="date" value={form.datePlannedEnd} onChange={(e) => setForm((p) => ({ ...p, datePlannedEnd: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))} /></div>
            <div><Label>Predecessoras</Label><Input value={form.predecessors} onChange={(e) => setForm((p) => ({ ...p, predecessors: e.target.value }))} placeholder="Ex: 12FS+2" /></div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              {!isCreate && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting || saving}>
                  {deleting ? 'Excluindo...' : 'Excluir tarefa'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || deleting}>{saving ? 'Salvando...' : isCreate ? 'Criar tarefa' : 'Salvar alterações'}</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
