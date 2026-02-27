'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createIssue, updateIssue } from '@/app/actions/issues'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// ... props
interface IssueFormProps {
  projectId: string
  userId: string
  statuses: any[]
  members?: any[] // Lista de membros do projeto
  issue?: any
  mode?: 'create' | 'edit'
}

export function IssueForm({ projectId, userId, statuses, members = [], issue, mode = 'create' }: IssueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract member IDs from issue (if edit)
  const initialMemberIds = issue?.members?.map((m: any) => m.userId) || []

  const [formData, setFormData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    type: issue?.type || 'INTERNAL',
    statusId: issue?.statusId?.toString() || (mode === 'create' ? statuses.find(s => s.isDefault)?.id.toString() : '') || '',
    priority: issue?.priority || 'MEDIUM',
    code: issue?.code || '',
    code2: issue?.code2 || '',
    plannedStart: issue?.plannedStart ? new Date(issue.plannedStart).toISOString().split('T')[0] : '',
    plannedEnd: issue?.plannedEnd ? new Date(issue.plannedEnd).toISOString().split('T')[0] : '',
    actualStart: issue?.actualStart ? new Date(issue.actualStart).toISOString().split('T')[0] : '',
    actualEnd: issue?.actualEnd ? new Date(issue.actualEnd).toISOString().split('T')[0] : '',
    memberIds: initialMemberIds as string[]
  })

  // Toggle member
  const toggleMember = (memberUserId: string) => {
      setFormData(prev => {
          const current = prev.memberIds
          if (current.includes(memberUserId)) {
              return { ...prev, memberIds: current.filter(id => id !== memberUserId) }
          } else {
              return { ...prev, memberIds: [...current, memberUserId] }
          }
      })
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const result = await createIssue({
          projectId,
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type as 'INTERNAL' | 'EXTERNAL',
          statusId: formData.statusId ? parseInt(formData.statusId) : undefined,
          priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          code: formData.code || undefined,
          code2: formData.code2 || undefined,
          plannedStart: formData.plannedStart ? new Date(formData.plannedStart) : undefined,
          plannedEnd: formData.plannedEnd ? new Date(formData.plannedEnd) : undefined,
          createdById: userId,
          memberIds: formData.memberIds
        })

        if (result.success) {
          toast.success('Questão criada com sucesso!')
          // If in Sheet (modal), we might want to close or refresh parent.
          // Router push refreshes full page.
          router.push(`/dashboard/projetos/${projectId}/questoes`)
          router.refresh()
        } else {
          toast.error(result.error || 'Erro ao criar questão')
        }
      } else {
        const result = await updateIssue(
          issue.id,
          {
            title: formData.title,
            description: formData.description || undefined,
            type: formData.type as 'INTERNAL' | 'EXTERNAL',
            statusId: formData.statusId ? parseInt(formData.statusId) : undefined,
            priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            code: formData.code || undefined,
            code2: formData.code2 || undefined,
            plannedStart: formData.plannedStart ? new Date(formData.plannedStart) : undefined,
            plannedEnd: formData.plannedEnd ? new Date(formData.plannedEnd) : undefined,
            actualStart: formData.actualStart ? new Date(formData.actualStart) : undefined,
            actualEnd: formData.actualEnd ? new Date(formData.actualEnd) : undefined,
            memberIds: formData.memberIds
          },
          projectId
        )

        if (result.success) {
          toast.success('Questão atualizada com sucesso!')
          router.push(`/dashboard/projetos/${projectId}/questoes/${issue.id}`)
          router.refresh()
        } else {
          toast.error(result.error || 'Erro ao atualizar questão')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar questão:', error)
      toast.error(mode === 'create' ? 'Erro ao criar questão' : 'Erro ao atualizar questão')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... Title etc */}
      <div>
        <Label htmlFor="title">
          Título <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Descreva brevemente a questão"
          required
        />
      </div>

       {/* Responsáveis */}
       {members.length > 0 && (
          <div>
            <Label>Responsáveis</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1">
                {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id={`member-${m.userId}`}
                            checked={formData.memberIds.includes(m.userId)}
                            onChange={() => toggleMember(m.userId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`member-${m.userId}`} className="text-sm text-gray-700 cursor-pointer select-none">
                            {m.user?.name || m.user?.email}
                        </label>
                    </div>
                ))}
            </div>
          </div>
       )}

      {/* Códigos */}
      <div className="grid grid-cols-2 gap-4">
    {/* ... rest of existing form ... */}
        <div>
          <Label htmlFor="code">Código 1</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="Ex: Q-001"
          />
        </div>
        <div>
          <Label htmlFor="code2">Código 2</Label>
          <Input
            id="code2"
            value={formData.code2}
            onChange={(e) => handleChange('code2', e.target.value)}
            placeholder="Ex: EXT-001"
          />
        </div>
      </div>

      {/* Type/Priority/Status ... */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="INTERNAL">Interna</option>
            <option value="EXTERNAL">Externa</option>
          </select>
        </div>
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <select
            id="priority"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="statusId">Situação</Label>
        <select
          id="statusId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.statusId}
          onChange={(e) => handleChange('statusId', e.target.value)}
        >
          <option value="">Nenhuma</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Dates ... */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plannedStart">Início Previsto</Label>
          <Input
            id="plannedStart"
            type="date"
            value={formData.plannedStart}
            onChange={(e) => handleChange('plannedStart', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="plannedEnd">Fim Previsto</Label>
          <Input
            id="plannedEnd"
            type="date"
            value={formData.plannedEnd}
            onChange={(e) => handleChange('plannedEnd', e.target.value)}
          />
        </div>
      </div>

      {mode === 'edit' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="actualStart">Início Real</Label>
            <Input
              id="actualStart"
              type="date"
              value={formData.actualStart}
              onChange={(e) => handleChange('actualStart', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="actualEnd">Fim Real</Label>
            <Input
              id="actualEnd"
              type="date"
              value={formData.actualEnd}
              onChange={(e) => handleChange('actualEnd', e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descreva detalhadamente a questão..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Criar Questão' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}
