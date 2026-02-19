'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRiskById, updateProjectRisk } from '@/app/actions/project-risks'
import { toast } from 'sonner'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditRiskPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const riskId = params.riskId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    loadRisk()
  }, [riskId])

  const loadRisk = async () => {
    const result = await getRiskById(riskId)
    if (result.success && result.data) {
      const risk = result.data
      setFormData({
        description: risk.description || '',
        type: risk.type || 'Ameaça',
        category: risk.category || 'Gerencial',
        causes: risk.causes || '',
        consequences: risk.consequences || '',
        contingency: risk.contingency || '',
        probability: risk.probability?.toString() || '1',
        impact: risk.impact?.toString() || '1',
        responseStrategy: risk.responseStrategy || 'Mitigar',
        responsePlan: risk.responsePlan || '',
        status: risk.status || 'Ativo',
        owner: risk.owner || ''
      })
    } else {
      toast.error('Risco não encontrado')
      router.push(`/dashboard/projetos/${projectId}/riscos`)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateProjectRisk(riskId, projectId, formData)
    
    setSaving(false)
    if (result.success) {
      toast.success(result.message)
      router.push(`/dashboard/projetos/${projectId}/riscos`)
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 container mx-auto p-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/dashboard/projetos/${projectId}/riscos`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Risco / Resposta</h1>
            <p className="text-gray-500">Atualize as informações e defina a resposta ao risco.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
          
          <div className="space-y-2">
            <Label>Descrição do Risco</Label>
            <Input 
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ameaça">Ameaça</SelectItem>
                  <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
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

          <div className="space-y-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h3 className="font-medium text-yellow-800">Análise Detalhada</h3>
            <div className="space-y-2">
              <Label>Causas</Label>
              <Textarea value={formData.causes} onChange={(e) => setFormData({...formData, causes: e.target.value})} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Consequências</Label>
              <Textarea value={formData.consequences} onChange={(e) => setFormData({...formData, consequences: e.target.value})} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Plano de Contingência</Label>
              <Textarea value={formData.contingency} onChange={(e) => setFormData({...formData, contingency: e.target.value})} rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
            <div className="space-y-2">
              <Label>Probabilidade (1-5)</Label>
              <Select value={formData.probability} onValueChange={(v) => setFormData({...formData, probability: v})}>
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
              <Select value={formData.impact} onValueChange={(v) => setFormData({...formData, impact: v})}>
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

          <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800">Resposta ao Risco</h3>
            <div className="space-y-2">
              <Label>Estratégia de Resposta</Label>
              <Select value={formData.responseStrategy} onValueChange={(v) => setFormData({...formData, responseStrategy: v})}>
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
              <Label>Plano de Ação</Label>
              <Textarea value={formData.responsePlan} onChange={(e) => setFormData({...formData, responsePlan: e.target.value})} rows={4} placeholder="Descreva as ações para responder ao risco..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Monitorado">Monitorado</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                    <SelectItem value="Ocorreu">Ocorreu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável (Owner)</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
