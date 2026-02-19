'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Temporariamente usando localStorage até ter tabela no banco
export default function LicoesAprendidasPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLessons()
  }, [])

  const loadLessons = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=lessons`)
      const data = await res.json()
      if (data.success && data.data) {
        setLessons(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveLessons = async (updated: any[]) => {
    setLessons(updated)
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'lessons', value: updated })
      })
    } catch (e) {
      toast.error('Erro ao salvar no servidor')
    }
  }

  const [newLesson, setNewLesson] = useState({ 
    code: '', 
    title: '', 
    type: 'Controle',
    context: '',
    recommendation: '',
    description: '', 
    category: 'Sucesso' 
  })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!newLesson.title) {
      toast.error('Título é obrigatório')
      return
    }
    
    const lesson = {
      id: Date.now(),
      ...newLesson,
      createdAt: new Date().toISOString()
    }
    
    const updated = [lesson, ...lessons]
    saveLessons(updated)
    setNewLesson({ code: '', title: '', type: 'Controle', context: '', recommendation: '', description: '', category: 'Sucesso' })
    setShowForm(false)
    toast.success('Lição registrada!')
  }
  
  const handleDelete = (id: number) => {
    const updated = lessons.filter(l => l.id !== id)
    saveLessons(updated)
    toast.success('Lição removida')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/projetos/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lições Aprendidas</h1>
              <p className="text-gray-500">Registre aprendizados para projetos futuros.</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Lição
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código</Label>
                  <Input 
                    value={newLesson.code}
                    onChange={(e) => setNewLesson({...newLesson, code: e.target.value})}
                    placeholder="Ex: 01"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select 
                    className="w-full border rounded-md p-2"
                    value={newLesson.type}
                    onChange={(e) => setNewLesson({...newLesson, type: e.target.value})}
                  >
                    <option value="Iniciação">Iniciação</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Execução">Execução</option>
                    <option value="Controle">Controle</option>
                    <option value="Encerramento">Encerramento</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input 
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="Ex: Comunicação com stakeholders"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select 
                  className="w-full border rounded-md p-2"
                  value={newLesson.category}
                  onChange={(e) => setNewLesson({...newLesson, category: e.target.value})}
                >
                  <option value="Sucesso">O que deu certo</option>
                  <option value="Melhoria">O que pode melhorar</option>
                  <option value="Evitar">O que evitar</option>
                </select>
              </div>
              <div>
                <Label>Contexto</Label>
                <Textarea 
                  value={newLesson.context}
                  onChange={(e) => setNewLesson({...newLesson, context: e.target.value})}
                  placeholder="Em que situação isso ocorreu?"
                  rows={2}
                />
              </div>
              <div>
                <Label>Recomendação</Label>
                <Textarea 
                  value={newLesson.recommendation}
                  onChange={(e) => setNewLesson({...newLesson, recommendation: e.target.value})}
                  placeholder="O que você recomenda para os próximos projetos?"
                  rows={2}
                />
              </div>
              <div>
                <Label>Descrição Detalhada</Label>
                <Textarea 
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="Descreva a lição aprendida..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleAdd}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma lição registrada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full 
                      ${lesson.category === 'Sucesso' ? 'bg-green-100 text-green-800' : 
                        lesson.category === 'Evitar' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {lesson.category}
                    </span>
                    <CardTitle className="mt-2 text-lg">{lesson.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{lesson.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(lesson.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
