'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trash2, Target, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { createProjectGoal, deleteProjectGoal } from '@/app/actions/project-quality'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea' // Assuming shadcn textarea exists or standard
import Link from 'next/link'

interface ProjectGoalsListProps {
  projectId: string
  goals: any[]
  goalTypes?: any[]
}

export function ProjectGoalsList({ projectId, goals, goalTypes = [] }: ProjectGoalsListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [continueInserting, setContinueInserting] = useState(false)
  const [notifyStakeholders, setNotifyStakeholders] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric: '',
    targetValue: '',
    currentValue: '0',
    weight: '1',
    status: 'Em andamento',
    dueDate: '',
    expectedResult: '',
    strategicObjective: '',
    verificationMethod: '',
    category: '', // Legacy/Backup
    context: '',
    typeId: ''
  })

  const handleTypeChange = (typeId: string) => {
      const type = goalTypes.find(t => t.id === typeId)
      if (type) {
          setFormData(prev => ({
              ...prev, 
              typeId, 
              category: type.name, 
              metric: type.unit || prev.metric
          }))
      } else {
          setFormData(prev => ({...prev, typeId}))
      }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.typeId) {
        toast.error('Selecione um Tipo de Meta')
        return
    }
    if (!formData.targetValue) {
        toast.error('Informe a Meta (valor alvo)')
        return
    }

    // Name is optional in screenshot? "Meta: 50000". But I have "Nome da Meta (KPI)" in my schema.
    // I can infer name from Type + Value if empty? Or just make it 'Meta' + Type.
    // Screenshot 1 shows "No cadastro da Meta informar o de Meta" (sic).
    // Let's assume we need a name/KPI name. I'll reuse Type Name if empty.
    const finalName = formData.name || goalTypes.find(t => t.id === formData.typeId)?.name || 'Nova Meta'

    const result = await createProjectGoal(projectId, {
        ...formData,
        name: finalName
    })
    
    if (result.success) {
      toast.success(result.message)
      
      if (!continueInserting) {
          setIsOpen(false)
      }
      
      // Reset form (keep context? maybe not)
      setFormData({
        name: '', description: '', metric: '', targetValue: '',
        currentValue: '0', weight: '1', status: 'Em andamento', dueDate: '',
        expectedResult: '', strategicObjective: '', verificationMethod: '', category: '',
        context: '', typeId: ''
      })
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (confirm('Excluir esta meta?')) {
      const result = await deleteProjectGoal(goalId, projectId)
      if (result.success) toast.success(result.message)
      else toast.error(result.error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Atingida': return 'bg-green-500'
      case 'Não atingida': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0
    return Math.min(100, (current / target) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
         <Button variant="outline" asChild>
            <Link href={`/dashboard/projetos/${projectId}/metas/configuracao`}>
                <Settings className="w-4 h-4 mr-2" /> Configurar Tipos
            </Link>
         </Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Meta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              
              <div>
                <Label>Objetivo Estratégico/Resultado-Chave</Label>
                <Input 
                  value={formData.strategicObjective}
                  onChange={(e) => setFormData({...formData, strategicObjective: e.target.value})}
                  placeholder="Ex: Aumentar faturamento"
                />
              </div>

              <div>
                 <Label>Tipo <span className="text-red-500">*</span></Label>
                 <Select value={formData.typeId} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        {goalTypes.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 {goalTypes.length === 0 && (
                     <p className="text-xs text-red-500 mt-1">
                        Nenhum tipo cadastrado. <Link href={`/dashboard/projetos/${projectId}/metas/configuracao`} className="underline">Cadastre aqui.</Link>
                     </p>
                 )}
              </div>

              <div>
                <Label>Meta (Valor Alvo)</Label>
                <div className="flex gap-2">
                    <Input 
                      value={formData.targetValue}
                      onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                      placeholder="Ex: 50000"
                    />
                    {/* Indicador/Unidade, se vier do tipo, mostra apenas read-only ou input se quiser override */}
                    {formData.metric && (
                        <div className="flex items-center justify-center bg-gray-100 px-3 rounded border text-sm font-medium">
                            {formData.metric}
                        </div>
                    )}
                </div>
              </div>

              <div>
                 <Label>Indicador (Unidade)</Label>
                 <Input 
                    value={formData.metric}
                    onChange={(e) => setFormData({...formData, metric: e.target.value})}
                    placeholder="Ex: R$, %, un"
                    className="w-32"
                 />
              </div>

              <div>
                <Label>Meios de Verificação</Label>
                <Textarea 
                  value={formData.verificationMethod}
                  onChange={(e) => setFormData({...formData, verificationMethod: e.target.value})}
                  placeholder=""
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label>Contexto (premissas/suposições/restrições)</Label>
                <Textarea 
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  placeholder=""
                  className="min-h-[80px]"
                />
              </div>

              {/* Campos adicionais escondidos ou abaixo para calculo */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                 <div>
                    <Label>Valor Atual (Progresso)</Label>
                    <Input 
                        type="number" 
                        value={formData.currentValue}
                        onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
                    />
                 </div>
                 <div>
                    <Label>Resultado Esperado (Descrição)</Label>
                    <Input 
                        value={formData.expectedResult}
                        onChange={(e) => setFormData({...formData, expectedResult: e.target.value})}
                    />
                 </div>
              </div>


              <div className="space-y-2 pt-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="notify" checked={notifyStakeholders} onCheckedChange={(c) => setNotifyStakeholders(c === true)} />
                    <label htmlFor="notify" className="text-sm font-medium">Notificar envolvidos</label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="continue" checked={continueInserting} onCheckedChange={(c) => setContinueInserting(c === true)} />
                    <label htmlFor="continue" className="text-sm font-medium">Continuar inserindo metas</label>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>Confirmar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Metas de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Resultado Esperado</TableHead>
                <TableHead>Resultado Final</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Nenhuma meta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium align-top">
                      {goal.category || goal.name}
                    </TableCell>
                    <TableCell className="align-top">
                       <div className="font-medium">{goal.strategicObjective || goal.name}</div>
                       <div className="text-sm">
                           <span className="bg-yellow-100 px-1 rounded font-bold">Meta:</span> {goal.targetValue && goal.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {goal.metric}
                       </div>
                       {goal.expectedResult && <div className="text-gray-500 text-xs mt-1">{goal.expectedResult}</div>}
                    </TableCell>
                    <TableCell className="align-top">
                       {/* Resultado Final - usually currentValue if concluded? */}
                       {goal.currentValue && goal.currentValue > 0 ? (
                           <span>{goal.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {goal.metric}</span>
                       ) : '-'}
                    </TableCell>
                    <TableCell className="align-top">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
