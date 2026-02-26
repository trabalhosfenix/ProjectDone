'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronRight, ChevronDown } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { updateProjectItem } from '@/app/actions/project-items'
import { recalculateProjectSchedule } from '@/app/actions/scheduling'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProjectTableProps {
  items: any[]
  members?: any[]
}

export function ProjectTable({ items, members = [] }: ProjectTableProps) {
  const [filter, setFilter] = useState('')
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null)
  const [editValue, setEditValue] = useState<any>('')
  const [isRecalculating, setIsRecalculating] = useState(false)
  
  // State for collapsed WBS parent nodes
  const [collapsedWbs, setCollapsedWbs] = useState<Set<string>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  
  // 1. Process items to identify Parent/Child relationships and visibility
  const processedItems = useMemo(() => {
    // Basic filter first
    let filtered = items.filter(item => 
        (item.task?.toLowerCase() || '').includes(filter.toLowerCase()) ||
        (item.responsible?.toLowerCase() || '').includes(filter.toLowerCase()) ||
        (item.wbs?.toLowerCase() || '').includes(filter.toLowerCase())
    )

    if (filter) return { visibleItems: filtered, itemMap: {}, hasFilter: true }

    // Identify parents: An item is a parent if the *next* items start with its WBS + "."
    const itemsWithMeta = filtered.map((item, index) => {
        const wbs = item.wbs || ''
        const nextItem = filtered[index + 1]
        const isParent = nextItem && nextItem.wbs?.startsWith(wbs + '.')
        
        const depth = wbs.split('.').length - 1 // 1 -> 0, 1.1 -> 1
        
        return {
            ...item,
            isParent,
            depth
        }
    })

    // Filter out collapsed items
    const visible: any[] = []
    
    itemsWithMeta.forEach(item => {
        const wbs = item.wbs || ''
        let hidden = false
        const parts = wbs.split('.')
        let currentPrefix = parts[0]
        if (collapsedWbs.has(currentPrefix) && wbs !== currentPrefix) {
             hidden = true
        } else {
            for (let i = 1; i < parts.length; i++) {
                currentPrefix += '.' + parts[i]
                if (collapsedWbs.has(currentPrefix) && wbs !== currentPrefix) {
                    hidden = true; break;
                }
            }
        }
        
        if (!hidden) visible.push(item)
    })

    return { visibleItems: visible, itemMap: {}, hasFilter: false }
  }, [items, filter, collapsedWbs])

  const { visibleItems, hasFilter } = processedItems as any

  // Edit Logic
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const startEdit = (id: string, field: string, value: any) => {
    setEditingCell({ id, field })
    if (field.includes('date') && value) {
        setEditValue(new Date(value).toISOString().split('T')[0])
    } else {
        setEditValue(value)
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }
  
  const handleRecalculate = async () => {
      setIsRecalculating(true)
      try {
          if (items.length > 0) {
             await recalculateProjectSchedule(items[0].projectId!)
             toast.success('Cronograma recalculado')
          }
      } catch (e) {
          toast.error('Erro ao recalcular')
      } finally {
          setIsRecalculating(false)
      }
  }

  const saveEdit = async () => {
    if (!editingCell) return
    const { id, field } = editingCell
    let payload: any = {}
    
    if (field === 'task') {
      if (!editValue?.trim()) return
      payload = { task: editValue }
    } else if (field === 'duration') {
       const durationNum = parseFloat(editValue)
       if (isNaN(durationNum) || durationNum < 0) return
       payload = { duration: durationNum }
    } else if (['datePlanned', 'datePlannedEnd', 'dateActualStart', 'dateActual'].includes(field)) {
       const dateVal = editValue ? new Date(editValue) : null
       payload = { [field]: dateVal }
    } else if (field === 'progress') {
       const num = parseFloat(editValue)
       if (isNaN(num)) return
       const normalizedProgress = Math.max(0, Math.min(100, num))
       const normalizedStatus = normalizedProgress >= 100 ? 'Concluído' : normalizedProgress > 0 ? 'Em andamento' : 'A iniciar'
       payload = { 
         metadata: { progress: normalizedProgress / 100 },
         status: normalizedStatus
       }
    } else if (field === 'responsible') {
       payload = { responsible: editValue }
    } else if (field === 'predecessors') {
       payload = { metadata: { predecessors: editValue } }
    }

    try {
      const result = await updateProjectItem(id, payload)
      if (result.success) {
        toast.success(`Atualizado`)
        setEditingCell(null)
      } else {
        toast.error('Erro ao atualizar')
      }
    } catch {
      toast.error('Erro')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const toggleWbs = (wbs: string) => {
      const newSet = new Set(collapsedWbs)
      if (newSet.has(wbs)) {
          newSet.delete(wbs)
      } else {
          newSet.add(wbs)
      }
      setCollapsedWbs(newSet)
  }

  const formatDate = (date: any) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
    } catch { return '-' }
  }

  const getProgress = (val: any) => {
     if (val === undefined || val === null) return 0
     const num = Number(val)
     if (isNaN(num)) return 0
     return num <= 1 && num > 0 ? num * 100 : num === 0 ? 0 : num
  }

  const renderDateCell = (item: any, field: string, label: string) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field
    const value = item[field]
    return (
        <TableCell className="py-1 relative p-0 h-10 border-r border-gray-100 last:border-0">
            {isEditing ? (
                 <div className="absolute inset-0 p-1 flex items-center">
                     <Input 
                        type="date"
                        autoFocus
                        value={editValue || ''} 
                        onChange={e => setEditValue(e.target.value)} 
                        onBlur={saveEdit} 
                        onKeyDown={handleKeyDown}
                        className="h-7 w-full text-xs px-1"
                     />
                 </div>
            ) : (
                 <div 
                    className="cursor-pointer h-full w-full flex items-center justify-center text-gray-600 text-xs whitespace-nowrap hover:bg-gray-50"
                    onClick={() => startEdit(item.id, field, value)}
                 >
                    {formatDate(value)}
                 </div>
            )}
        </TableCell>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4 flex-1">
             <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Filtrar..." 
                className="pl-9 h-9 bg-white text-sm" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={isRecalculating}>
                {isRecalculating ? 'Calculando...' : 'Recalcular Cronograma'}
            </Button>
        </div>
        <div className="text-xs text-gray-500">
          {visibleItems.length} visíveis
        </div>
      </div>

      <div className="flex-1 overflow-auto relative min-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
            <TableRow className="hover:bg-transparent text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <TableHead className="w-[80px] pl-4 font-bold bg-white text-left">EDT</TableHead>
              <TableHead className="w-[30%] min-w-[250px] font-bold bg-white">Nome da Tarefa</TableHead>
              <TableHead className="w-[60px] text-center font-bold bg-white">Duração</TableHead>
              <TableHead className="w-[90px] text-center font-bold bg-white">Início Plan.</TableHead>
              <TableHead className="w-[90px] text-center font-bold bg-white text-orange-600">Início Real</TableHead>
              <TableHead className="w-[90px] text-center font-bold bg-white">Término Plan.</TableHead>
              <TableHead className="w-[90px] text-center font-bold bg-white text-orange-600">Término Real</TableHead>
              <TableHead className="w-[80px] text-center font-bold bg-white bg-yellow-50/50">Predec.</TableHead>
              <TableHead className="w-[70px] text-center font-bold bg-white">% Concl.</TableHead>
              <TableHead className="w-[150px] font-bold bg-white">Recursos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={10} className="h-24 text-center text-gray-500 text-sm">
                   Nenhuma tarefa encontrada.
                 </TableCell>
               </TableRow>
            ) : (
              visibleItems.map((item: any) => {
                const metadata = item.metadata as any || {}
                const progressDisplay = getProgress(metadata.progress)
                const isCellEditing = (field: string) => editingCell?.id === item.id && editingCell?.field === field
                
                const isParent = item.isParent
                const depth = item.depth || 0
                const isCollapsed = collapsedWbs.has(item.wbs)
                const rowFont = isParent ? 'font-bold text-gray-900' : 'font-normal text-gray-700'
                const rowBg = isParent ? 'bg-gray-50/50' : ''
                
                return (
                  <TableRow key={item.id} className={`hover:bg-blue-50/30 border-b border-gray-100 last:border-0 text-sm ${rowBg}`}>
                    
                    {/* EDT Column */}
                    <TableCell className="pl-4 py-1 h-10 font-mono text-xs text-gray-500 align-middle">
                        {item.wbs}
                    </TableCell>

                    {/* TASK NAME */}
                    <TableCell className="py-1 relative p-0 h-10">
                      {isCellEditing('task') ? (
                         <div className="absolute inset-0 p-1 flex items-center" style={{ paddingLeft: `${Math.max(4, depth * 20)}px` }}>
                            <Input 
                                autoFocus
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={saveEdit} 
                                onKeyDown={handleKeyDown}
                                className="h-7 w-full text-xs"
                            />
                         </div>
                      ) : (
                        <div 
                            className="flex items-center h-full w-full pr-2" 
                            style={{ paddingLeft: `${Math.max(8, depth * 24)}px` }}
                        >   
                           {isParent && !hasFilter && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); toggleWbs(item.wbs); }}
                                 className="mr-1 p-0.5 hover:bg-gray-200 rounded"
                               >
                                   {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                               </button>
                           )}
                           {!isParent && !hasFilter && <div className="w-4 mr-1" />}
                           
                           <span 
                             onClick={() => startEdit(item.id, 'task', item.task)}
                             className={`truncate cursor-pointer ${rowFont} hover:text-blue-600 transition-colors`} 
                             title={item.task}
                           >
                             {item.task || 'Sem nome'}
                           </span>
                        </div>
                      )}
                    </TableCell>

                    {/* DURATION */}
                    <TableCell className="py-1 relative p-0 h-10 border-r border-gray-100">
                       {isCellEditing('duration') ? (
                         <div className="absolute inset-0 p-1 flex items-center">
                            <Input 
                                autoFocus
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={saveEdit} 
                                onKeyDown={handleKeyDown}
                                className="h-7 w-full text-center text-xs"
                            />
                         </div>
                       ) : (
                         <div className="cursor-pointer h-full w-full flex items-center justify-center text-gray-600 text-xs"
                              onClick={() => startEdit(item.id, 'duration', metadata.duration)}>
                            {metadata.duration || '-'}
                         </div>
                       )}
                    </TableCell>

                    {/* DATES */}
                    {renderDateCell(item, 'datePlanned', 'Início Previsto')}
                    {renderDateCell(item, 'dateActualStart', 'Início Real')}
                    {renderDateCell(item, 'datePlannedEnd', 'Término Previsto')}
                    {renderDateCell(item, 'dateActual', 'Término Real')}

                    {/* PREDECESSORS */}
                    <TableCell className="py-1 relative p-0 h-10 border-r border-gray-100 bg-yellow-50/10">
                       {isCellEditing('predecessors') ? (
                         <div className="absolute inset-0 p-1 flex items-center">
                            <Input 
                                autoFocus
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={saveEdit} 
                                onKeyDown={handleKeyDown}
                                className="h-7 w-full text-center text-xs"
                            />
                         </div>
                       ) : (
                         <div className="cursor-pointer h-full w-full flex items-center justify-center text-gray-600 text-xs"
                              onClick={() => startEdit(item.id, 'predecessors', metadata.predecessors)}>
                            {metadata.predecessors || '-'}
                         </div>
                       )}
                    </TableCell>

                    {/* PROGRESS */}
                    <TableCell className="py-1 relative p-0 h-10 border-r border-gray-100" onClick={() => !editingCell && startEdit(item.id, 'progress', progressDisplay)}>
                       {isCellEditing('progress') ? (
                         <div className="absolute inset-0 p-1 flex items-center justify-center">
                             <Input 
                                autoFocus
                                type="number"
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={saveEdit} 
                                onKeyDown={handleKeyDown}
                                className="h-7 w-12 text-center text-xs font-bold"
                            />
                             <span className="text-[10px] ml-1">%</span>
                         </div>
                       ) : (
                         <div className="cursor-pointer h-full w-full flex items-center justify-center">
                            <div className="w-full px-2">
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="font-bold">{Math.round(progressDisplay)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${progressDisplay === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, progressDisplay)}%` }} />
                                </div>
                            </div>
                         </div>
                       )}
                    </TableCell>

                    {/* RESOURCES */}
                    <TableCell className="py-1 relative p-0 h-10">
                       {isCellEditing('responsible') ? (
                         <div className="absolute inset-0 p-1 flex items-center">
                            <Select 
                                value={editValue} 
                                onValueChange={(val) => {
                                    setEditValue(val)
                                    setEditingCell({ id: item.id, field: 'responsible' }) 
                                    const payload = { responsible: val }
                                    updateProjectItem(item.id, payload).then(() => {
                                        toast.success('Atualizado')
                                        setEditingCell(null)
                                    })
                                }}
                                open={true}
                                onOpenChange={(open) => !open && cancelEdit()}
                            >
                                <SelectTrigger className="h-7 w-full text-xs">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.user.name || m.user.email} className="text-xs">
                                            {m.user.name || m.user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                       ) : (
                         <div 
                            className="cursor-pointer h-full w-full flex items-center text-gray-600 text-xs pl-2"
                            onClick={() => startEdit(item.id, 'responsible', item.responsible)}
                         >
                            {item.responsible ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] font-bold border border-indigo-100">
                                        {item.responsible.substring(0,1).toUpperCase()}
                                    </div>
                                    <span className="truncate max-w-[100px]">{item.responsible}</span>
                                </div>
                            ) : (
                                <span className="text-gray-300 italic text-[10px]">Atribuir</span>
                            )}
                         </div>
                       )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
