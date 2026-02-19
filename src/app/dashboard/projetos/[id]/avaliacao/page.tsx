'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, CircleDot } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'

const qualityChecklist = [
  { id: '1', category: 'Escopo', item: 'A EAP está completa e aprovada', impact: 'Alto' },
  { id: '2', category: 'Escopo', item: 'O dicionário da EAP está documentado', impact: 'Médio' },
  { id: '3', category: 'Tempo', item: 'O cronograma está atualizado', impact: 'Alto' },
  { id: '4', category: 'Tempo', item: 'O caminho crítico foi identificado', impact: 'Alto' },
  { id: '5', category: 'Custo', item: 'O orçamento foi aprovado', impact: 'Alto' },
  { id: '6', category: 'Custo', item: 'Os custos reais estão sendo registrados', impact: 'Médio' },
  { id: '7', category: 'Qualidade', item: 'As metas de qualidade foram definidas', impact: 'Alto' },
  { id: '8', category: 'Riscos', item: 'A matriz de riscos está atualizada', impact: 'Alto' },
  { id: '9', category: 'Comunicação', item: 'Os stakeholders estão identificados', impact: 'Médio' },
  { id: '10', category: 'RH', item: 'A equipe está alocada', impact: 'Alto' },
]

export default function AvaliacaoPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvaluation()
  }, [])

  const loadEvaluation = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=evaluation`)
      const data = await res.json()
      if (data.success && data.data) {
        setChecked(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async (id: string, value: boolean) => {
    const updated = { ...checked, [id]: value }
    setChecked(updated)
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'evaluation', value: updated })
      })
    } catch (e) {
      toast.error('Erro ao salvar avaliação')
    }
  }

  const completedCount = Object.values(checked).filter(Boolean).length
  const totalCount = qualityChecklist.length
  const percentage = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avaliação de Qualidade</h1>
            <p className="text-gray-500">Checklist de conformidade do projeto.</p>
          </div>
          <Badge className={`text-lg px-4 py-2 ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
            {percentage}% Completo
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Itens de Verificação ({completedCount}/{totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityChecklist.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                    ${checked[item.id] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  <Checkbox 
                    checked={checked[item.id] || false}
                    onCheckedChange={(v) => handleCheck(item.id, v as boolean)}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${checked[item.id] ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {item.item}
                    </p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <Badge variant="outline" className={
                    item.impact === 'Alto' ? 'border-red-300 text-red-600' : 
                    item.impact === 'Médio' ? 'border-yellow-300 text-yellow-600' : 
                    'border-gray-300'
                  }>
                    {item.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
