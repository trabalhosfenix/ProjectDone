'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FolderPlus, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default function NovoComponentePage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  })

  interface EAPItem {
    id: string
    code: string
    name: string
    description: string
    level: number
    children: EAPItem[]
    expanded?: boolean
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      // Carregar EAP atual do servidor
      let currentEap: EAPItem[] = []
      const res = await fetch(`/api/projects/${projectId}/metadata?key=eap`)
      const data = await res.json()
      
      if (data.success && data.data) {
        currentEap = data.data
      }

      // Se estiver vazia, inicializar padrão
      if (currentEap.length === 0) {
        currentEap = [
          {
            id: '1',
            code: '1',
            name: 'Projeto',
            description: 'Raiz do Projeto',
            level: 0,
            children: [],
            expanded: true
          }
        ]
      }

      // Adicionar como filho do primeiro item (Raiz)
      const root = currentEap[0]
      const newCode = formData.code || `1.${root.children.length + 1}`
      
      const newItem: EAPItem = {
        id: Date.now().toString(),
        code: newCode,
        name: formData.name,
        description: formData.description,
        level: 1,
        children: [],
        expanded: true
      }

      root.children.push(newItem)
      
      // Salvar de volta
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'eap', value: currentEap })
      })

      toast.success('Componente criado com sucesso')
      router.push(`/dashboard/projetos/${projectId}/escopo/dicionario`)
    } catch (e) {
      toast.error('Erro ao salvar componente')
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-2xl">
        <ProjectPageHeader 
             title="Novo Componente de Escopo"
             description="Adicione um novo pacote de trabalho ou entrega à EAP."
             projectId={projectId}
             backLink={`/dashboard/projetos/${projectId}/escopo/dicionario`}
        />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Nome do Componente</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Desenvolvimento Backend"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Código EAP (Opcional)</Label>
              <Input 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="Se vazio, será gerado automaticamente (ex: 1.3)"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Descrição / Dicionário</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o escopo, critérios de aceitação e entregáveis..."
                className="mt-1"
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Salvar Componente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
