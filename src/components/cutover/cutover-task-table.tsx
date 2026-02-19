'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCutoverTask, updateCutoverTask, deleteCutoverTask, importCutoverFromExcel } from '@/app/actions/cutover-tasks'

interface CutoverTaskTableProps {
  projectId: string
  tasks: any[]
  onRefresh: () => void
}

export function CutoverTaskTable({ projectId, tasks, onRefresh }: CutoverTaskTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const resetForm = () => {
    setFormData({
      activity: '',
      predecessor: '',
      responsible: '',
      transaction: '',
      duration: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      newDeadline: '',
      actualDate: '',
      percentComplete: '0',
      percentPlanned: '0',
      status: 'pending',
      observations: ''
    })
  }

  const openAdd = () => {
    resetForm()
    setEditingTask(null)
    setIsAddOpen(true)
  }

  const openEdit = (task: any) => {
    setFormData({
      activity: task.activity || '',
      predecessor: task.predecessor || '',
      responsible: task.responsible || '',
      transaction: task.transaction || '',
      duration: task.duration?.toString() || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      newDeadline: task.newDeadline ? new Date(task.newDeadline).toISOString().split('T')[0] : '',
      actualDate: task.actualDate ? new Date(task.actualDate).toISOString().split('T')[0] : '',
      percentComplete: task.percentComplete?.toString() || '0',
      percentPlanned: task.percentPlanned?.toString() || '0',
      status: task.status || 'pending',
      observations: task.observations || ''
    })
    setEditingTask(task)
    setIsAddOpen(true)
  }

  const handleSave = async () => {
    if (!formData.activity) {
      toast.error('Atividade é obrigatória')
      return
    }
    
    setLoading(true)
    const result = editingTask 
      ? await updateCutoverTask(editingTask.id, projectId, formData)
      : await createCutoverTask(projectId, formData)
    setLoading(false)
    
    if (result.success) {
      toast.success(editingTask ? 'Tarefa atualizada!' : 'Tarefa criada!')
      setIsAddOpen(false)
      onRefresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return
    const result = await deleteCutoverTask(id, projectId)
    if (result.success) {
      toast.success('Tarefa excluída')
      onRefresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    
    const result = await importCutoverFromExcel(projectId, formData)
    setImporting(false)
    
    if (result.success) {
      toast.success(result.message)
      onRefresh()
    } else {
      toast.error(result.error)
    }
    
    e.target.value = ''
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      delayed: 'bg-red-100 text-red-700',
      completed: 'bg-green-100 text-green-700'
    }
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      delayed: 'Atrasado',
      completed: 'Concluído'
    }
    return <Badge className={styles[status] || styles.pending}>{labels[status] || status}</Badge>
  }

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-400',
      in_progress: 'bg-blue-500',
      delayed: 'bg-red-500',
      completed: 'bg-green-500'
    }
    return <div className={`w-4 h-4 rounded-full ${colors[status] || colors.pending}`} />
  }

  const formatDate = (date: any) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <>
      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">{tasks.length} tarefas</div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <Button variant="outline" asChild disabled={importing}>
              <span>{importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Importar Excel</span>
            </Button>
          </label>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 text-white">
                <TableHead className="text-white min-w-[250px]">Atividades</TableHead>
                <TableHead className="text-white">Predecessor</TableHead>
                <TableHead className="text-white">Responsável</TableHead>
                <TableHead className="text-white">Trans.</TableHead>
                <TableHead className="text-white text-center">Duração</TableHead>
                <TableHead className="text-white">Início</TableHead>
                <TableHead className="text-white">Término</TableHead>
                <TableHead className="text-white">Novo Prazo</TableHead>
                <TableHead className="text-white">Realizado</TableHead>
                <TableHead className="text-white text-center">% Concl</TableHead>
                <TableHead className="text-white text-center">Status</TableHead>
                <TableHead className="text-white w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    Nenhuma tarefa cadastrada. Importe um Excel ou adicione manualmente.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task, idx) => (
                  <TableRow key={task.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="font-medium">{task.activity}</TableCell>
                    <TableCell className="text-sm text-gray-600">{task.predecessor || '-'}</TableCell>
                    <TableCell>{task.responsible || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">{task.transaction || '-'}</TableCell>
                    <TableCell className="text-center">{task.duration ? `${task.duration}h` : '-'}</TableCell>
                    <TableCell>{formatDate(task.startDate)}</TableCell>
                    <TableCell>{formatDate(task.endDate)}</TableCell>
                    <TableCell>{formatDate(task.newDeadline)}</TableCell>
                    <TableCell>{formatDate(task.actualDate)}</TableCell>
                    <TableCell className="text-center">
                      <span className={task.percentComplete >= 100 ? 'text-green-600 font-bold' : ''}>
                        {task.percentComplete || 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{getStatusDot(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(task)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa de Cutover'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Atividade *</Label>
              <Input value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} />
            </div>
            <div>
              <Label>Predecessora</Label>
              <Input value={formData.predecessor} onChange={e => setFormData({...formData, predecessor: e.target.value})} />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} />
            </div>
            <div>
              <Label>Transação</Label>
              <Input value={formData.transaction} onChange={e => setFormData({...formData, transaction: e.target.value})} placeholder="Ex: FS15, PSPO" />
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <Label>Data Término</Label>
              <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div>
              <Label>Hora Início</Label>
              <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div>
              <Label>Hora Término</Label>
              <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
            </div>
            <div>
              <Label>Novo Prazo</Label>
              <Input type="date" value={formData.newDeadline} onChange={e => setFormData({...formData, newDeadline: e.target.value})} />
            </div>
            <div>
              <Label>Prazo Realizado</Label>
              <Input type="date" value={formData.actualDate} onChange={e => setFormData({...formData, actualDate: e.target.value})} />
            </div>
            <div>
              <Label>% Concluído</Label>
              <Input type="number" min="0" max="100" value={formData.percentComplete} onChange={e => setFormData({...formData, percentComplete: e.target.value})} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingTask ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
