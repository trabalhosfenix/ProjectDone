'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Save, Edit2 } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default function CalendarioPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    calendar: 'Somente 2ª a 6ª',
    startDate: '',
    endDate: '',
    realStartDate: '',
    realEndDate: '',
    duration: 0
  })

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setProject(data.data)
        setFormData({
          calendar: data.data.calendar || 'Somente 2ª a 6ª',
          startDate: data.data.startDate ? new Date(data.data.startDate).toISOString().split('T')[0] : '',
          endDate: data.data.endDate ? new Date(data.data.endDate).toISOString().split('T')[0] : '',
          realStartDate: data.data.realStartDate ? new Date(data.data.realStartDate).toISOString().split('T')[0] : '',
          realEndDate: data.data.realEndDate ? new Date(data.data.realEndDate).toISOString().split('T')[0] : '',
          duration: data.data.duration || 0
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Calcular duração se tiver datas
      let calculatedDuration = formData.duration
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        calculatedDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendar: formData.calendar,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          realStartDate: formData.realStartDate ? new Date(formData.realStartDate).toISOString() : null,
          realEndDate: formData.realEndDate ? new Date(formData.realEndDate).toISOString() : null,
          duration: calculatedDuration
        })
      })

      if (res.ok) {
        toast.success('Calendário atualizado!')
        setIsEditing(false)
        loadProject()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch (e) {
      toast.error('Erro de conexão')
    }
    setSaving(false)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Não definida'
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return 'Não definida'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ProjectDetailTabs projectId={projectId} />
        <ProjectHorizontalMenu projectId={projectId} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader 
             title="Calendário do Projeto"
             description="Configurações de dias úteis e horários do projeto."
             projectId={projectId}
        >
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </ProjectPageHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuração Planejada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Configuração Planejada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Calendário</Label>
                {isEditing ? (
                  <select 
                    className="w-full border rounded-md p-2 mt-1"
                    value={formData.calendar}
                    onChange={(e) => setFormData({...formData, calendar: e.target.value})}
                  >
                    <option value="Somente 2ª a 6ª">Somente 2ª a 6ª</option>
                    <option value="2ª a Sábado">2ª a Sábado</option>
                    <option value="Todos os dias">Todos os dias</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                ) : (
                  <p className="font-medium mt-1">{project?.calendar || 'Somente 2ª a 6ª'}</p>
                )}
              </div>

              <div>
                <Label>Data de Início Prevista</Label>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{formatDate(project?.startDate)}</p>
                )}
              </div>

              <div>
                <Label>Data de Término Prevista</Label>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{formatDate(project?.endDate)}</p>
                )}
              </div>

              <div>
                <Label>Duração Prevista (dias)</Label>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                    className="mt-1"
                    placeholder="Calculado automaticamente"
                  />
                ) : (
                  <p className="font-medium mt-1">{project?.duration || 0} dias</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datas Reais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                Datas Reais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Início Real</Label>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={formData.realStartDate}
                    onChange={(e) => setFormData({...formData, realStartDate: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">
                    {project?.realStartDate ? formatDate(project.realStartDate) : 'Não iniciado'}
                  </p>
                )}
              </div>

              <div>
                <Label>Término Real</Label>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={formData.realEndDate}
                    onChange={(e) => setFormData({...formData, realEndDate: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">
                    {project?.realEndDate ? formatDate(project.realEndDate) : 'Em andamento'}
                  </p>
                )}
              </div>

              <div>
                <Label>Duração Real</Label>
                <p className="font-medium mt-1">{project?.realDuration || 0} dias</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feriados */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Feriados e Exceções</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 py-4">
              O calendário base considera feriados nacionais padrão automaticamente no cálculo do cronograma. Para exceções específicas do projeto, ajuste a duração ou as datas diretamente nas tarefas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
