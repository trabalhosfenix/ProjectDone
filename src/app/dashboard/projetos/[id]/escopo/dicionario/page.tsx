'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FolderTree, ChevronRight, ChevronDown, Plus, Trash2, Edit2, Save } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'
import { ProjectPageHeader } from '@/components/project/project-page-header'

interface EAPItem {
  id: string
  code: string
  name: string
  description: string
  level: number
  children: EAPItem[]
  expanded?: boolean
}

export default function DicionarioEAPPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [eap, setEap] = useState<EAPItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEAP()
  }, [])

  const loadEAP = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=eap`)
      const data = await res.json()
      if (data.success && data.data) {
        setEap(data.data)
      } else {
        // Inicializar com padrão se não existir
        setEap([
          {
            id: '1',
            code: '1',
            name: 'Projeto',
            description: 'Componente raiz do projeto',
            level: 0,
            expanded: true,
            children: [
              { id: '1.1', code: '1.1', name: 'Gerenciamento', description: 'Atividades de gestão', level: 1, children: [], expanded: true },
              { id: '1.2', code: '1.2', name: 'Entregas', description: 'Produtos do projeto', level: 1, children: [], expanded: true },
            ]
          }
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const saveEAP = async (newEap: EAPItem[]) => {
    setEap(newEap)
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'eap', value: newEap })
      })
    } catch (e) {
      toast.error('Erro ao salvar no servidor')
    }
  }

  const toggleExpand = (id: string) => {
    const toggle = (items: EAPItem[]): EAPItem[] =>
      items.map(item => ({
        ...item,
        expanded: item.id === id ? !item.expanded : item.expanded,
        children: toggle(item.children)
      }))
    saveEAP(toggle(eap))
  }

  const addChild = (parentId: string) => {
    const addToParent = (items: EAPItem[]): EAPItem[] =>
      items.map(item => {
        if (item.id === parentId) {
          const newCode = `${item.code}.${item.children.length + 1}`
          return {
            ...item,
            expanded: true,
            children: [
              ...item.children,
              { id: newCode, code: newCode, name: 'Novo componente', description: '', level: item.level + 1, children: [] }
            ]
          }
        }
        return { ...item, children: addToParent(item.children) }
      })
    saveEAP(addToParent(eap))
    toast.success('Componente adicionado')
  }

  const startEdit = (item: EAPItem) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, description: item.description })
  }

  const saveEdit = () => {
    const update = (items: EAPItem[]): EAPItem[] =>
      items.map(item => {
        if (item.id === editingId) {
          return { ...item, name: editForm.name, description: editForm.description }
        }
        return { ...item, children: update(item.children) }
      })
    saveEAP(update(eap))
    setEditingId(null)
    toast.success('Componente atualizado')
  }

  const deleteItem = (id: string) => {
    const remove = (items: EAPItem[]): EAPItem[] =>
      items.filter(item => item.id !== id).map(item => ({
        ...item,
        children: remove(item.children)
      }))
    saveEAP(remove(eap))
    toast.success('Componente removido')
  }

  const renderItem = (item: EAPItem) => (
    <div key={item.id} className="border-l-2 border-gray-200 pl-4 ml-2">
      <div className="flex items-center gap-2 py-2 group">
        {item.children.length > 0 ? (
          <button onClick={() => toggleExpand(item.id)} className="p-1 hover:bg-gray-100 rounded">
            {item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-6" />
        )}
        
        <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
        
        {editingId === item.id ? (
          <div className="flex-1 flex gap-2">
            <Input 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="h-8"
              placeholder="Nome"
            />
            <Input 
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="h-8"
              placeholder="Descrição"
            />
            <Button size="sm" onClick={saveEdit}><Save className="w-4 h-4" /></Button>
          </div>
        ) : (
          <>
            <span className="font-medium">{item.name}</span>
            {item.description && <span className="text-gray-500 text-sm">- {item.description}</span>}
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}>
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addChild(item.id)}>
                <Plus className="w-3 h-3" />
              </Button>
              {item.level > 0 && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      
      {item.expanded && item.children.map(child => renderItem(child))}
    </div>
  )

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
            <ProjectPageHeader 
                title="EAP / Dicionário da EAP" 
                description="Estrutura Analítica do Projeto - decomposição hierárquica do escopo."
                projectId={projectId}
            />
        </div>

        <Card>
          <CardContent className="pt-6">
            {eap.map(item => renderItem(item))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
