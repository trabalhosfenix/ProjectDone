'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateProject } from '@/app/actions/projects'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default function EditarProjetoPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    loadProject()
  }, [])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setFormData(data.data)
      }
    } catch (e) {
      toast.error('Erro ao carregar dados do projeto')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Filtrar campos para enviar apenas o que a action espera
      const { id, createdAt, updatedAt, items, ...dataToSend } = formData
      
      const res = await updateProject(projectId, dataToSend)
      if (res.success) {
        toast.success('Projeto atualizado com sucesso!')
        router.refresh()
      } else {
        toast.error(typeof res.error === 'string' ? res.error : 'Erro ao atualizar')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader 
             title="Editar Projeto"
             description="Atualize as informações cadastrais do projeto."
             projectId={projectId}
        >
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
            </Button>
        </ProjectPageHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nome do Projeto</Label>
                <Input value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              
              <div>
                <Label>Código</Label>
                <Input value={formData.code || ''} onChange={(e) => handleChange('code', e.target.value)} />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'A iniciar'} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A iniciar">A iniciar</SelectItem>
                    <SelectItem value="Em planejamento">Em Planejamento</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Parado">Parado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Definição Estratégica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Justificativa do Projeto</Label>
                <Textarea 
                  value={formData.justification || ''} 
                  onChange={(e) => handleChange('justification', e.target.value)} 
                  placeholder="Por que este projeto está sendo executado?"
                />
              </div>

              <div>
                <Label>Objetivo (SMART)</Label>
                <Textarea 
                  value={formData.objective || ''} 
                  onChange={(e) => handleChange('objective', e.target.value)} 
                  placeholder="O que será entregue ao final?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                   <Label>Premissas</Label>
                   <Textarea 
                      value={formData.assumptions || ''} 
                      onChange={(e) => handleChange('assumptions', e.target.value)} 
                      placeholder="Hipóteses assumidas como verdadeiras"
                    />
                </div>
                <div>
                   <Label>Restrições</Label>
                   <Textarea 
                      value={formData.constraints || ''} 
                      onChange={(e) => handleChange('constraints', e.target.value)} 
                      placeholder="Limitações (orçamento, tempo, recursos)"
                    />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classificação e Organização</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tipo de Projeto</Label>
                <Input value={formData.type || ''} onChange={(e) => handleChange('type', e.target.value)} />
              </div>
              <div>
                <Label>Área Executora</Label>
                <Input value={formData.area || ''} onChange={(e) => handleChange('area', e.target.value)} />
              </div>
              <div>
                <Label>Cliente / Solicitante</Label>
                <Input value={formData.client || ''} onChange={(e) => handleChange('client', e.target.value)} />
              </div>
              <div>
                <Label>Programa</Label>
                <Input value={formData.program || ''} onChange={(e) => handleChange('program', e.target.value)} />
              </div>
              <div>
                <Label>Portfólio</Label>
                <Input value={formData.portfolio || ''} onChange={(e) => handleChange('portfolio', e.target.value)} />
              </div>
              <div>
                <Label>Prioridade</Label>
                 <Select value={formData.priority || 'Média'} onValueChange={(v) => handleChange('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
