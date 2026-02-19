'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createTestScenario, updateTestScenario } from '@/app/actions/project-tests'

interface TestScenarioFormProps {
  projectId: string
  scenario?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TestScenarioForm({ projectId, scenario, open, onOpenChange, onSuccess }: TestScenarioFormProps) {
  const [formData, setFormData] = useState({
    externalId: scenario?.externalId || '',
    scenario: scenario?.scenario || '',
    task: scenario?.task || '',
    sequence: scenario?.sequence || '',
    description: scenario?.description || '',
    responsible: scenario?.responsible || '',
    docBeo: scenario?.docBeo || '',
    status: scenario?.status || 'Não iniciado',
    startDate: scenario?.startDate ? new Date(scenario.startDate).toISOString().split('T')[0] : '',
    endDate: scenario?.endDate ? new Date(scenario.endDate).toISOString().split('T')[0] : '',
  })

  const handleSubmit = async () => {
    if (!formData.scenario) {
        toast.error('O nome do cenário é obrigatório')
        return
    }

    const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null
    }

    let result
    if (scenario) {
        result = await updateTestScenario(scenario.id, projectId, payload)
    } else {
        result = await createTestScenario(projectId, payload)
    }

    if (result.success) {
        toast.success(result.message)
        onSuccess()
        onOpenChange(false)
    } else {
        toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? 'Editar Cenário' : 'Novo Cenário de Teste'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label>ID (Excel)</Label>
                   <Input 
                      value={formData.externalId} 
                      onChange={e => setFormData({...formData, externalId: e.target.value})}
                      placeholder="Ex: OUT-T002_9"
                   />
                </div>
                <div>
                   <Label>Sequência</Label>
                   <Input 
                      value={formData.sequence} 
                      onChange={e => setFormData({...formData, sequence: e.target.value})}
                   />
                </div>
            </div>

            <div>
               <Label>Cenário <span className="text-red-500">*</span></Label>
               <Input 
                  value={formData.scenario} 
                  onChange={e => setFormData({...formData, scenario: e.target.value})}
                  placeholder="Ex: Venda Etanol Hidratado D.E (Y002)"
               />
            </div>

            <div>
               <Label>Tarefa</Label>
               <Input 
                  value={formData.task} 
                  onChange={e => setFormData({...formData, task: e.target.value})}
                  placeholder="Ex: Realizar validação Titular Financeiro"
               />
            </div>

            <div>
               <Label>Descrição</Label>
               <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label>Responsável</Label>
                  <Input 
                      value={formData.responsible} 
                      onChange={e => setFormData({...formData, responsible: e.target.value})}
                   />
               </div>
               <div>
                  <Label>DOC BEO</Label>
                  <Input 
                      value={formData.docBeo} 
                      onChange={e => setFormData({...formData, docBeo: e.target.value})}
                   />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Não iniciado">Não iniciado</SelectItem>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                        <SelectItem value="Falhou">Falhou</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div>
                  <Label>Data Início</Label>
                  <Input 
                      type="date"
                      value={formData.startDate} 
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                   />
               </div>
               <div>
                  <Label>Data Conclusão</Label>
                  <Input 
                      type="date"
                      value={formData.endDate} 
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                   />
               </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>Salvar</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
