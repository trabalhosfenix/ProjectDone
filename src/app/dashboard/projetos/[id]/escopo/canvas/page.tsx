'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Target, Truck, DollarSign, Clock, CheckCircle, AlertTriangle, Lightbulb, Plus, Shield, MessageSquare, Briefcase, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'
import { ProjectPageHeader } from '@/components/project/project-page-header'

// Definição das Colunas e Itens
const COLUMNS = [
    {
        title: 'POR QUÊ?',
        color: 'bg-[#2D2A4A] text-white',
        items: [
            { id: 'justification', label: 'Justificativa (Passado)', icon: Lightbulb, color: 'bg-blue-50 border-blue-100' },
            { id: 'objective', label: 'Objetivo SMART', icon: Target, color: 'bg-blue-50 border-blue-100' },
            { id: 'benefits', label: 'Benefícios (Futuro)', icon: CheckCircle, color: 'bg-blue-50 border-blue-100' },
        ]
    },
    {
        title: 'O QUÊ?',
        color: 'bg-[#2D2A4A] text-white',
        items: [
            { id: 'product', label: 'Produto', icon: Truck, color: 'bg-blue-50 border-blue-100', height: 'h-auto min-h-[140px]' },
            { id: 'requirements', label: 'Requisitos', icon: CheckCircle, color: 'bg-blue-50 border-blue-100', height: 'h-auto min-h-[200px]' },
        ]
    },
    {
        title: 'QUEM?',
        color: 'bg-[#4A476A] text-white',
        items: [
            { id: 'stakeholders', label: 'Stakeholders Externos', icon: Users, color: 'bg-blue-50 border-blue-100' },
            { id: 'team', label: 'Equipe', icon: Users, color: 'bg-blue-50 border-blue-100', height: 'h-auto min-h-[140px]' },
             { id: 'constraints', label: 'Restrições', icon: AlertTriangle, color: 'bg-blue-50 border-blue-100' },
        ]
    },
    {
        title: 'COMO?',
        color: 'bg-[#4A476A] text-white',
        items: [
            { id: 'premisses', label: 'Premissas', icon: Shield, color: 'bg-blue-50 border-blue-100' },
            { id: 'deliverables', label: 'Grupo de Entrega', icon: Truck, color: 'bg-blue-50 border-blue-100', height: 'h-auto min-h-[200px]' },
        ]
    },
    {
        title: 'QUANDO? QUANTO?',
        color: 'bg-[#2D2A4A] text-white',
        items: [
            { id: 'risks', label: 'Riscos', icon: AlertTriangle, color: 'bg-blue-50 border-blue-100' },
            { id: 'timeline', label: 'Linha do Tempo', icon: Clock, color: 'bg-blue-50 border-blue-100' },
            { id: 'costs', label: 'Custos', icon: DollarSign, color: 'bg-blue-50 border-blue-100' },
        ]
    }
]

export default function CanvasPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [canvas, setCanvas] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCanvas()
  }, [])

  const loadCanvas = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=canvas`)
      const data = await res.json()
      if (data.data) {
         setCanvas(typeof data.data === 'object' ? data.data : {})
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Edit State
  const [editingItem, setEditingItem] = useState<{ areaId: string, index: number } | null>(null)
  const [editValue, setEditValue] = useState('')

  // Add State
  const [editingArea, setEditingArea] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')

  const saveCanvas = async (updated: Record<string, string[]>) => {
    setCanvas(updated)
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'canvas', value: updated })
      })
    } catch (e) {
      toast.error('Erro ao salvar no servidor')
    }
  }

  const addItem = (areaId: string) => {
    if (!newItem.trim()) return
    const updated = { ...canvas, [areaId]: [...(canvas[areaId] || []), newItem.trim()] }
    saveCanvas(updated)
    setNewItem('')
    setEditingArea(null)
    toast.success('Item adicionado')
  }

  const removeItem = (areaId: string, index: number) => {
    const updated = { ...canvas, [areaId]: (canvas[areaId] || []).filter((_, i) => i !== index) }
    saveCanvas(updated)
    if (editingItem?.areaId === areaId && editingItem?.index === index) setEditingItem(null)
  }

  const startEditing = (areaId: string, index: number, currentValue: string) => {
    setEditingItem({ areaId, index })
    setEditValue(currentValue)
  }

  const saveEdit = (areaId: string, index: number) => {
    if (editValue.trim() === '') {
        setEditingItem(null)
        return
    }
    const newItems = [...(canvas[areaId] || [])]
    newItems[index] = editValue.trim()
    const updated = { ...canvas, [areaId]: newItems }
    saveCanvas(updated)
    setEditingItem(null)
    toast.success('Alteração salva')
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 w-full p-6 overflow-x-auto">
         {/* Back Button & Title */}
         <div className="mb-6">
            <ProjectPageHeader 
                title="Project Model Canvas" 
                description="Metodologia visual para definição do projeto."
                projectId={projectId}
            />
         </div>

         <div className="min-w-[1400px] pb-6">
            {/* Cabeçalho do Diagrama */}
            <div className="grid grid-cols-5 gap-2 mb-2">
                {COLUMNS.map((col, i) => (
                    <div key={i} className={`${col.color} p-2 text-center rounded-t-lg font-bold text-sm tracking-wider shadow-sm`}>
                        {col.title}
                    </div>
                ))}
            </div>

            {/* Colunas de Conteúdo */}
            <div className="grid grid-cols-5 gap-2 h-full items-stretch">
                {COLUMNS.map((col, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        {col.items.map((area) => (
                         <Card key={area.id} className={`${area.color} border shadow-sm flex-1 flex flex-col ${area.height || 'h-auto'}`}>
                           <CardHeader className="pb-2 p-3">
                             <CardTitle className="text-xs flex items-center gap-2 font-bold text-gray-800 uppercase tracking-tight">
                               <area.icon className="w-3.5 h-3.5" />
                               {area.label}
                             </CardTitle>
                           </CardHeader>
                           <CardContent className="p-2 pt-0 flex-1">
                             <div className="space-y-1.5 min-h-[80px]">
                               {(canvas[area.id] || []).map((item, idx) => (
                                 <div 
                                   key={idx} 
                                   className="bg-white/80 p-1.5 rounded text-[11px] shadow-sm group border border-transparent hover:border-gray-300 transition-all flex flex-col"
                                 >
                                   {editingItem?.areaId === area.id && editingItem?.index === idx ? (
                                       <div className="w-full">
                                           <Input 
                                             value={editValue}
                                             onChange={(e) => setEditValue(e.target.value)}
                                             onKeyDown={(e) => {
                                                 if(e.key === 'Enter') saveEdit(area.id, idx)
                                                 if(e.key === 'Escape') setEditingItem(null)
                                             }}
                                             autoFocus
                                             className="h-6 text-[11px] w-full px-1"
                                             onBlur={() => saveEdit(area.id, idx)}
                                           />
                                       </div>
                                   ) : (
                                       <div className="flex justify-between items-start gap-1 w-full">
                                          <span 
                                             onClick={() => startEditing(area.id, idx, item)}
                                             className="cursor-pointer hover:text-blue-700 flex-1 break-words whitespace-pre-wrap select-text leading-tight"
                                             title="Clique para editar"
                                          >
                                             {item}
                                          </span>
                                          <button 
                                             onClick={(e) => { e.stopPropagation(); removeItem(area.id, idx) }}
                                             className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 font-bold px-1"
                                          >
                                            ×
                                          </button>
                                       </div>
                                   )}
                                 </div>
                               ))}
                               
                               {editingArea === area.id ? (
                                 <div className="space-y-1">
                                   <Input 
                                     value={newItem}
                                     onChange={(e) => setNewItem(e.target.value)}
                                     placeholder="Digite..."
                                     className="text-[11px] h-7 bg-white"
                                     onKeyDown={(e) => {
                                         if (e.key === 'Enter') addItem(area.id)
                                         if (e.key === 'Escape') setEditingArea(null)
                                     }}
                                     autoFocus
                                   />
                                   <div className="flex gap-1">
                                     <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => addItem(area.id)}>OK</Button>
                                     <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingArea(null)}>X</Button>
                                   </div>
                                 </div>
                               ) : (
                                 <button 
                                   onClick={() => { setEditingArea(area.id); setNewItem(''); setEditingItem(null) }}
                                   className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 mt-1 p-1 hover:bg-white/40 w-full rounded transition-colors"
                                 >
                                   <Plus className="w-3 h-3" /> Adicionar
                                 </button>
                               )}
                             </div>
                           </CardContent>
                         </Card>
                        ))}
                    </div>
                ))}
            </div>
            
            <p className="text-center text-gray-400 text-xs mt-4">
               Project Model Canvas (PMC) - Baseado na metodologia de José Finocchio Jr.
            </p>
        </div>
      </div>
    </div>
  )
}
