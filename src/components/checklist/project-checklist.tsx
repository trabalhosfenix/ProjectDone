'use client'

import { useState } from 'react'
import { Check, Clock, Plus, Trash2, Calendar } from 'lucide-react'
import { createChecklistItem, toggleChecklistItem, deleteChecklistItem } from '@/app/actions/checklist'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from "sonner"

interface ChecklistItem {
  id: string
  task: string
  status: string
  responsible: string | null
}

interface ProjectChecklistProps {
  projectId: string
  initialItems: ChecklistItem[]
}

export function ProjectChecklist({ projectId, initialItems }: ProjectChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)

  const totalItems = items.length
  const completedItems = items.filter(i => i.status === 'Concluído').length
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  async function handleAddItem() {
    if (!newTask.trim()) return

    setLoading(true)
    const result = await createChecklistItem(projectId, newTask)
    
    if (result.success && result.data) {
      setItems([...items, result.data as ChecklistItem])
      setNewTask('')
      toast.success("Item adicionado com sucesso")
    } else {
      toast.error("Erro ao adicionar item")
    }
    setLoading(false)
  }

  async function handleToggle(id: string) {
    // Optimistic update
    const newItems = items.map(i => 
      i.id === id ? { ...i, status: i.status === 'Concluído' ? 'Pendente' : 'Concluído' } : i
    )
    setItems(newItems)

    const result = await toggleChecklistItem(id, projectId)
    if (!result.success) {
      // Revert if error
      setItems(items)
      toast.error("Erro ao atualizar item")
    }
  }

  async function handleDelete(id: string) {
    const backupItems = [...items]
    setItems(items.filter(i => i.id !== id))

    const result = await deleteChecklistItem(id, projectId)
    if (!result.success) {
        setItems(backupItems)
        toast.error("Erro ao remover item")
    }
  }

  const renderList = (filterItems: ChecklistItem[]) => (
    <div className="space-y-4">
      {filterItems.map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4">
             <button
                onClick={() => handleToggle(item.id)}
                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                  item.status === 'Concluído' 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}
             >
                {item.status === 'Concluído' && <Check className="w-4 h-4" />}
             </button>
             
             <div>
                <p className={`font-medium text-gray-900 ${item.status === 'Concluído' ? 'line-through text-gray-400' : ''}`}>
                    {item.task}
                </p>
                {item.responsible && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                         {item.responsible}
                    </p>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Badge variant={item.status === 'Concluído' ? 'default' : 'outline'} className={item.status === 'Concluído' ? 'bg-green-600 hover:bg-green-700' : ''}>
                {item.status}
             </Badge>
             <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
             </Button>
          </div>
        </div>
      ))}
      {filterItems.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
            Nenhum item encontrado nesta lista.
        </div>
      )}
    </div>
  )

  const pendingItems = items.filter(i => i.status !== 'Concluído')
  const doneItems = items.filter(i => i.status === 'Concluído')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Realizar Atividades</CardTitle>
          <p className="text-gray-500 text-sm">Marque as atividades conforme forem sendo executadas.</p>
        </CardHeader>
        <CardContent>
            {/* Progresso */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
                    <span>Progresso Geral</span>
                    <span>{completedItems} / {totalItems} tarefas</span>
                </div>
                <Progress value={progress} className="h-4" indicatorClassName="bg-blue-600" />
                <div className="text-center mt-2 text-2xl font-bold text-blue-600">
                    {progress}%
                </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-8">
                <Input 
                    placeholder="Descreva a nova atividade..." 
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    className="flex-1"
                />
                <Button onClick={handleAddItem} disabled={loading || !newTask.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pendentes" className="w-full">
                <TabsList>
                    <TabsTrigger value="pendentes">Pendentes ({pendingItems.length})</TabsTrigger>
                    <TabsTrigger value="concluidas">Concluídas ({doneItems.length})</TabsTrigger>
                    <TabsTrigger value="todas">Todas ({items.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pendentes" className="mt-4">
                    {renderList(pendingItems)}
                </TabsContent>
                <TabsContent value="concluidas" className="mt-4">
                    {renderList(doneItems)}
                </TabsContent>
                <TabsContent value="todas" className="mt-4">
                    {renderList(items)}
                </TabsContent>
            </Tabs>

        </CardContent>
      </Card>
    </div>
  )
}
