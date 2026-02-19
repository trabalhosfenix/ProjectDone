'use client'

import { useState, useEffect } from 'react'
import { User, Edit2, Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/app/actions/projects'
import { getProjectTypes } from '@/app/actions/project-types'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ProjectInfoPanelProps {
  project: {
    id: string
    name: string
    description?: string | null
    code?: string | null
    type?: string | null
    justification?: string | null
    objective?: string | null
    area?: string | null
    client?: string | null
    program?: string | null
    portfolio?: string | null
    assumptions?: string | null
    constraints?: string | null
    managerName?: string | null
    createdBy?: {
      name?: string | null
    } | null
  }
  members?: Array<{
    id: string
    user: {
      id: string
      name?: string | null
      email: string
    }
  }>
}

interface EditableFieldProps {
    field: string
    title: string
    value?: string | null
    type?: 'text' | 'textarea' | 'select'
    options?: string[]
    editingField: string | null
    tempValue: string
    onTempValueChange: (val: string) => void
    onStartEditing: (field: string, value: string | null | undefined) => void
    onCancelEditing: () => void
    onSave: (field: string) => void
    saving: boolean
}

function EditableField({ 
    field, title, value, type = 'text', options = [],
    editingField, tempValue, onTempValueChange, onStartEditing, onCancelEditing, onSave, saving
 }: EditableFieldProps) {
     const isEditing = editingField === field
     
     return (
       <div className="mb-6 group">
           <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
               {!isEditing && (
                   <button 
                       onClick={() => onStartEditing(field, value)}
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
                       title="Editar"
                   >
                       <Edit2 className="w-3 h-3" />
                   </button>
               )}
           </div>
           
           {isEditing ? (
               <div className="space-y-2">
                   {type === 'textarea' ? (
                       <Textarea 
                           value={tempValue} 
                           onChange={e => onTempValueChange(e.target.value)}
                           className="text-sm min-h-[100px]"
                       />
                   ) : type === 'select' ? (
                       <select 
                           className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                           value={tempValue}
                           onChange={e => onTempValueChange(e.target.value)}
                       >
                           <option value="">Selecione...</option>
                           {options.map(opt => (
                               <option key={opt} value={opt}>{opt}</option>
                           ))}
                       </select>
                   ) : (
                       <Input 
                           value={tempValue} 
                           onChange={e => onTempValueChange(e.target.value)}
                           className="h-8 text-sm"
                       />
                   )}
                   
                   <div className="flex gap-2 justify-end">
                       <Button size="sm" variant="ghost" onClick={onCancelEditing} disabled={saving} className="h-7 px-2">
                           <X className="w-4 h-4" />
                       </Button>
                       <Button size="sm" onClick={() => onSave(field)} disabled={saving} className="h-7 px-2">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin bg-black" /> : <Check className="w-4 h-4" />}
                       </Button>
                   </div>
               </div>
           ) : (
               <div 
                   className="text-sm text-gray-600 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1 transition-colors border border-transparent hover:border-gray-200"
                   onClick={() => onStartEditing(field, value)}
               >
                   {value || <span className="text-gray-400 italic">Não informado</span>}
               </div>
           )}
       </div>
     )
 }

export function ProjectInfoPanel({ project, members = [] }: ProjectInfoPanelProps) {
  const router = useRouter()
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [projectTypes, setProjectTypes] = useState<string[]>([])

  useEffect(() => {
    getProjectTypes().then(res => {
      if(res.success && res.types) {
        setProjectTypes(res.types.filter((t: any) => t.active).map((t: any) => t.name))
      }
    })
  }, [])

  const startEditing = (field: string, value: string | null | undefined) => {
    setEditingField(field)
    setTempValue(value || '')
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  const handleSave = async (field: string) => {
    setSaving(true)
    try {
      const payload = { [field]: tempValue }
      
      const res = await updateProject(project.id, payload)
      if (res.success) {
        toast.success('Atualizado com sucesso')
        setEditingField(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Erro ao atualizar')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  // Helper props factory
  const fieldProps = {
      editingField,
      tempValue,
      onTempValueChange: setTempValue,
      onStartEditing: startEditing,
      onCancelEditing: cancelEditing,
      onSave: handleSave,
      saving
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
           Projeto
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 relative group">
            <a href={`/dashboard/projetos/${project.id}/editar`} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity">
                <Edit2 className="w-4 h-4" />
            </a>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-red-700">Re</span>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{project.name}</div>
              {project.code && (
                <div className="text-xs text-gray-500 mt-1">Código: {project.code}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditableField 
        field="type" 
        title="Tipo de Projeto" 
        value={project.type} 
        type="select"
        options={projectTypes}
        {...fieldProps}
      />

      <EditableField field="area" title="Área Executora" value={project.area} {...fieldProps} />
      
      <EditableField field="client" title="Organização Cliente" value={project.client} {...fieldProps} />
      
      <EditableField field="program" title="Programa" value={project.program} {...fieldProps} />
      
      <EditableField field="portfolio" title="Portfólio" value={project.portfolio} {...fieldProps} />

      <EditableField field="justification" title="Justificativa" value={project.justification} type="textarea" {...fieldProps} />
      
      <EditableField field="objective" title="Objetivo" value={project.objective} type="textarea" {...fieldProps} />

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          <a href={`/dashboard/projetos/${project.id}/dependencias`} className="hover:text-blue-600 transition-colors">
            Dependência
          </a>
        </h3>
        <div className="text-sm text-gray-400 italic">Nenhuma dependência cadastrada</div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          <a href={`/dashboard/projetos/${project.id}/envolvidos`} className="hover:text-blue-600 transition-colors">
            Envolvidos
          </a>
        </h3>
        
        {members.length > 0 ? (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member, index) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                     <td className="px-3 py-2 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                             <User className="w-4 h-4 text-gray-400" />
                             <span className="text-sm">{member.user.name || member.user.email}</span>
                         </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">Nenhum envolvido cadastrado</div>
        )}
      </div>

      <EditableField field="description" title="Descrição" value={project.description} type="textarea" {...fieldProps} />

      <EditableField field="assumptions" title="Premissas" value={project.assumptions} type="textarea" {...fieldProps} />

      <EditableField field="constraints" title="Restrições" value={project.constraints} type="textarea" {...fieldProps} />

    </div>
  )
}
