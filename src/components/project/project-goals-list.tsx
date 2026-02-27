'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Target, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { createProjectGoal, deleteProjectGoal } from '@/app/actions/project-quality'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface GoalType {
  id: string
  name: string
  unit?: string | null
}

interface ProjectGoal {
  id: string
  name: string
  category?: string | null
  metric?: string | null
  targetValue?: number | null
  currentValue?: number | null
  expectedResult?: string | null
  strategicObjective?: string | null
  status?: string | null
}

interface ProjectGoalsListProps {
  projectId: string
  goals: ProjectGoal[]
  goalTypes?: GoalType[]
}

type GoalFormData = {
  name: string
  description: string
  metric: string
  targetValue: string
  currentValue: string
  weight: string
  status: string
  dueDate: string
  expectedResult: string
  strategicObjective: string
  verificationMethod: string
  category: string
  context: string
  typeId: string
}

const INITIAL_FORM_DATA: GoalFormData = {
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
  category: '',
  context: '',
  typeId: '',
}

function toNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatMetricValue(value: unknown, metric?: string | null): string {
  const number = toNumber(value)
  const base = number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return metric ? `${base} ${metric}` : base
}

export function ProjectGoalsList({ projectId, goals, goalTypes = [] }: ProjectGoalsListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [continueInserting, setContinueInserting] = useState(false)
  const [notifyStakeholders, setNotifyStakeholders] = useState(false)
  const [formData, setFormData] = useState<GoalFormData>(INITIAL_FORM_DATA)

  const goalsWithPresentation = useMemo(
    () =>
      goals.map((goal) => {
        const targetValue = toNumber(goal.targetValue)
        const currentValue = toNumber(goal.currentValue)
        const progress = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0

        return {
          ...goal,
          targetValue,
          currentValue,
          progress,
        }
      }),
    [goals]
  )

  const handleTypeChange = (typeId: string) => {
    const selectedType = goalTypes.find((type) => type.id === typeId)

    setFormData((previous) => ({
      ...previous,
      typeId,
      category: selectedType?.name || previous.category,
      metric: selectedType?.unit || previous.metric,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.typeId) {
      toast.error('Selecione um tipo de meta')
      return
    }

    if (!formData.targetValue.trim()) {
      toast.error('Informe a meta (valor alvo)')
      return
    }

    const selectedType = goalTypes.find((type) => type.id === formData.typeId)
    const finalName = formData.name.trim() || selectedType?.name || 'Nova Meta'

    const result = await createProjectGoal(projectId, {
      ...formData,
      name: finalName,
      notifyStakeholders,
    })

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(result.message)

    if (!continueInserting) {
      setIsOpen(false)
    }

    setFormData(INITIAL_FORM_DATA)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Excluir esta meta?')) return

    const result = await deleteProjectGoal(goalId, projectId)
    if (result.success) {
      toast.success(result.message)
      return
    }

    toast.error(result.error)
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
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Meta
            </Button>
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
                  onChange={(event) => setFormData({ ...formData, strategicObjective: event.target.value })}
                  placeholder="Ex: Aumentar faturamento"
                />
              </div>

              <div>
                <Label>
                  Tipo <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.typeId} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {goalTypes.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Nenhum tipo cadastrado.{' '}
                    <Link href={`/dashboard/projetos/${projectId}/metas/configuracao`} className="underline">
                      Cadastre aqui.
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <Label>Nome da Meta (KPI)</Label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Ex: Faturamento Mensal"
                />
              </div>

              <div>
                <Label>
                  Meta (Valor Alvo) <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.targetValue}
                    onChange={(event) => setFormData({ ...formData, targetValue: event.target.value })}
                    placeholder="Ex: 50000"
                  />
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
                  onChange={(event) => setFormData({ ...formData, metric: event.target.value })}
                  placeholder="Ex: R$, %, un"
                  className="w-32"
                />
              </div>

              <div>
                <Label>Meios de Verificação</Label>
                <Textarea
                  value={formData.verificationMethod}
                  onChange={(event) => setFormData({ ...formData, verificationMethod: event.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label>Contexto (premissas/suposições/restrições)</Label>
                <Textarea
                  value={formData.context}
                  onChange={(event) => setFormData({ ...formData, context: event.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label>Valor Atual (Progresso)</Label>
                  <Input
                    type="number"
                    value={formData.currentValue}
                    onChange={(event) => setFormData({ ...formData, currentValue: event.target.value })}
                  />
                </div>
                <div>
                  <Label>Resultado Esperado (Descrição)</Label>
                  <Input
                    value={formData.expectedResult}
                    onChange={(event) => setFormData({ ...formData, expectedResult: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="notify" checked={notifyStakeholders} onCheckedChange={(checked) => setNotifyStakeholders(checked === true)} />
                  <label htmlFor="notify" className="text-sm font-medium">
                    Notificar envolvidos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="continue" checked={continueInserting} onCheckedChange={(checked) => setContinueInserting(checked === true)} />
                  <label htmlFor="continue" className="text-sm font-medium">
                    Continuar inserindo metas
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
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
                <TableHead className="w-[110px] text-right">Progresso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goalsWithPresentation.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhuma meta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                goalsWithPresentation.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium align-top">{goal.category || goal.name}</TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium">{goal.strategicObjective || goal.name}</div>
                      <div className="text-sm">
                        <span className="bg-yellow-100 px-1 rounded font-bold">Meta:</span>{' '}
                        {formatMetricValue(goal.targetValue, goal.metric)}
                      </div>
                      {goal.expectedResult && <div className="text-gray-500 text-xs mt-1">{goal.expectedResult}</div>}
                    </TableCell>
                    <TableCell className="align-top">{formatMetricValue(goal.currentValue, goal.metric)}</TableCell>
                    <TableCell className="align-top text-right font-medium">{Math.round(goal.progress)}%</TableCell>
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
