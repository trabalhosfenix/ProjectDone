'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Target, TrendingUp, Calculator } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const criterios = [
  { id: 'strategic', label: 'Alinhamento Estratégico', peso: 3 },
  { id: 'financial', label: 'Retorno Financeiro', peso: 3 },
  { id: 'risk', label: 'Nível de Risco', peso: 2 },
  { id: 'complexity', label: 'Complexidade', peso: 1 },
  { id: 'urgency', label: 'Urgência', peso: 2 },
  { id: 'resources', label: 'Disponibilidade de Recursos', peso: 2 },
]

export default function ClassificacaoPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScores()
  }, [])

  const loadScores = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=classification`)
      const data = await res.json()
      if (data.success && data.data) {
        setScores(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = async (criterioId: string, value: string) => {
    const newScores = { ...scores, [criterioId]: parseInt(value) }
    setScores(newScores)
    
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'classification', value: newScores })
      })
    } catch (e) {
      toast.error('Erro ao salvar classificação')
    }
  }

  // Calcular pontuação ponderada
  const calculateTotal = () => {
    let total = 0
    let maxPossible = 0
    
    criterios.forEach(c => {
      if (scores[c.id]) {
        total += scores[c.id] * c.peso
      }
      maxPossible += 5 * c.peso // 5 é a nota máxima
    })
    
    return {
      total,
      maxPossible,
      percentage: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
    }
  }

  const result = calculateTotal()

  const getPriorityLabel = (percentage: number) => {
    if (percentage >= 80) return { label: 'Alta Prioridade', color: 'bg-green-500' }
    if (percentage >= 60) return { label: 'Média-Alta', color: 'bg-blue-500' }
    if (percentage >= 40) return { label: 'Média', color: 'bg-yellow-500' }
    return { label: 'Baixa Prioridade', color: 'bg-gray-500' }
  }

  const priority = getPriorityLabel(result.percentage)

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
           <Link href={`/dashboard/projetos/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Classificação e Priorização
            </h1>
            <p className="text-gray-500">Avalie o projeto em múltiplos critérios para calcular sua prioridade.</p>
          </div>
        </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Critérios */}
          <div className="lg:col-span-2 space-y-4">
            {criterios.map((criterio) => (
              <Card key={criterio.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{criterio.label}</Label>
                      <p className="text-xs text-gray-400">Peso: {criterio.peso}x</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => handleScoreChange(criterio.id, n.toString())}
                          className={`w-10 h-10 rounded-lg border-2 font-bold transition-all
                            ${scores[criterio.id] === n 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'bg-white border-gray-200 hover:border-blue-300'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resultado */}
          <div className="space-y-4">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-5xl font-bold text-blue-600">{result.percentage}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.total} / {result.maxPossible} pontos
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Badge className={`${priority.color} text-white px-4 py-2 text-sm`}>
                    {priority.label}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Interpretação:</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• 80-100%: Projeto estratégico prioritário</li>
                    <li>• 60-79%: Projeto importante</li>
                    <li>• 40-59%: Projeto de rotina</li>
                    <li>• 0-39%: Reconsiderar execução</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
