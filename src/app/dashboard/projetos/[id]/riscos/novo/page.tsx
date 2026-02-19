'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProjectRisk } from '@/app/actions/project-risks'
import { toast } from 'sonner'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { getProjectMembers } from '@/app/actions/project-members'

export default function NewRiskPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [formData, setFormData] = useState({
    description: '',
    type: 'Ameaça',
    category: 'Gerencial',
    causes: '',
    consequences: '',
    contingency: '',
    probability: '1',
    impact: '1',
    responseStrategy: 'Mitigar',
    responsePlan: '',
    status: 'Ativo',
    owner: ''
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createProjectRisk(projectId, formData)
    
    setLoading(false)
    if (result.success) {
      toast.success(result.message)
      router.push(`/dashboard/projetos/${projectId}/riscos`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Risco</h1>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            
            <div className="space-y-2">
                <Label>Descrição do Risco</Label>
                <Input 
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Atraso na entrega do fornecedor X"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Ameaça">Ameaça</SelectItem>
                    <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                
                <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({...formData, category: v})}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Gerencial">Gerencial</SelectItem>
                    <SelectItem value="Externo">Externo</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>

            {/* Novos campos: Causas, Consequências, Contingência */}
            <div className="space-y-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h3 className="font-medium text-yellow-800">Análise Detalhada</h3>
                
                <div className="space-y-2">
                <Label>Causas</Label>
                <Textarea 
                    value={formData.causes}
                    onChange={(e) => setFormData({...formData, causes: e.target.value})}
                    placeholder="Quais são as causas potenciais deste risco?"
                    rows={2}
                />
                </div>

                <div className="space-y-2">
                <Label>Consequências</Label>
                <Textarea 
                    value={formData.consequences}
                    onChange={(e) => setFormData({...formData, consequences: e.target.value})}
                    placeholder="O que acontece se o risco se materializar?"
                    rows={2}
                />
                </div>

                <div className="space-y-2">
                <Label>Plano de Contingência</Label>
                <Textarea 
                    value={formData.contingency}
                    onChange={(e) => setFormData({...formData, contingency: e.target.value})}
                    placeholder="Ações de contingência caso o risco ocorra"
                    rows={2}
                />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                <div className="space-y-2">
                <Label>Probabilidade (1-5)</Label>
                <Select 
                    value={formData.probability} 
                    onValueChange={(v) => setFormData({...formData, probability: v})}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="1">1 - Muito Baixa</SelectItem>
                    <SelectItem value="2">2 - Baixa</SelectItem>
                    <SelectItem value="3">3 - Média</SelectItem>
                    <SelectItem value="4">4 - Alta</SelectItem>
                    <SelectItem value="5">5 - Muito Alta</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                
                <div className="space-y-2">
                <Label>Impacto (1-5)</Label>
                <Select 
                    value={formData.impact} 
                    onValueChange={(v) => setFormData({...formData, impact: v})}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="1">1 - Muito Baixo</SelectItem>
                    <SelectItem value="2">2 - Baixo</SelectItem>
                    <SelectItem value="3">3 - Médio</SelectItem>
                    <SelectItem value="4">4 - Alto</SelectItem>
                    <SelectItem value="5">5 - Muito Alto</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Estratégia de Resposta</Label>
                <Select 
                value={formData.responseStrategy} 
                onValueChange={(v) => setFormData({...formData, responseStrategy: v})}
                >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Mitigar">Mitigar</SelectItem>
                    <SelectItem value="Evitar">Evitar</SelectItem>
                    <SelectItem value="Transferir">Transferir</SelectItem>
                    <SelectItem value="Aceitar">Aceitar</SelectItem>
                    <SelectItem value="Explorar">Explorar (Oportunidade)</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Plano de Ação (Resposta)</Label>
                <Textarea 
                value={formData.responsePlan}
                onChange={(e) => setFormData({...formData, responsePlan: e.target.value})}
                placeholder="O que será feito para lidar com este risco?"
                rows={4}
                />
            </div>

            <div className="space-y-2">
                <Label>Responsável (Owner)</Label>
                <Input 
                value={formData.owner}
                onChange={(e) => setFormData({...formData, owner: e.target.value})}
                placeholder="Nome do responsável"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Risco'}
                </Button>
            </div>
            </form>
        </div>
      </div>
    </div>
  )
}
