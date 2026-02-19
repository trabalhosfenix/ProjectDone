'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectBudgetEditorProps {
  projectId: string
  currentBudget?: number
  currentActualCost?: number
  currentStartDate?: string
  currentEndDate?: string
}

export function ProjectBudgetEditor({ 
  projectId, 
  currentBudget = 0,
  currentActualCost = 0,
  currentStartDate,
  currentEndDate
}: ProjectBudgetEditorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    budget: currentBudget.toString(),
    actualCost: currentActualCost.toString(),
    startDate: currentStartDate ? currentStartDate.split('T')[0] : '',
    endDate: currentEndDate ? currentEndDate.split('T')[0] : ''
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: parseFloat(formData.budget) || 0,
          actualCost: parseFloat(formData.actualCost) || 0,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
        })
      })

      if (response.ok) {
        toast.success('Dados atualizados! Recarregue a página.')
        setOpen(false)
        // Forçar reload para atualizar os cálculos
        window.location.reload()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch (e) {
      toast.error('Erro de conexão')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Configurar EVA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Dados do Projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-500">
            Configure os valores base para os cálculos de EVA funcionarem corretamente.
          </p>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Orçamento Total (BAC)
            </Label>
            <Input 
              type="number"
              placeholder="Ex: 100000"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              Custo Real Atual (AC)
            </Label>
            <Input 
              type="number"
              placeholder="Ex: 45000"
              value={formData.actualCost}
              onChange={(e) => setFormData({...formData, actualCost: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Data Início
              </Label>
              <Input 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Data Fim Previsto
              </Label>
              <Input 
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <strong>Dica:</strong> O Progresso (EV) é calculado automaticamente das tarefas. 
            Você só precisa definir o orçamento e as datas para ver o SPI/CPI.
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
