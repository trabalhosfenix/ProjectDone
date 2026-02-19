'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createProjectGoalType, deleteProjectGoalType } from '@/app/actions/project-goal-types'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface GoalTypesConfigProps {
  projectId: string
  types: any[]
}

export function GoalTypesConfig({ projectId, types }: GoalTypesConfigProps) {
  const [formData, setFormData] = useState({
    name: '',
    dataType: 'Quantidade Numérica',
    unit: ''
  })
  const [continueInserting, setContinueInserting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name) {
       toast.error('O Tipo de Meta é obrigatório')
       return
    }

    const res = await createProjectGoalType(projectId, formData)
    
    if (res.success) {
      toast.success(res.message)
      if (!continueInserting) {
          // Reset form usually, but maybe user wants to leave? 
          // The prompt screenshot has "Continuar inserindo".
      }
      setFormData({ name: '', dataType: 'Quantidade Numérica', unit: '' })
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async (id: string) => {
     if(confirm('Excluir este tipo de meta?')) {
        const res = await deleteProjectGoalType(id, projectId)
        if (res.success) toast.success(res.message)
        else toast.error(res.error)
     }
  }

  return (
    <div className="space-y-8">
       <Card>
          <CardHeader>
             <CardTitle>Tipos de Meta Cadastrados</CardTitle>
             <CardDescription>Permitir que o cliente cadastre os tipos de metas.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
                <div className="grid grid-cols-3 gap-4 p-4 font-medium bg-gray-50 border-b">
                   <div>Tipo de Meta</div>
                   <div>Tipo de Dado</div>
                   <div>Unidade</div>
                   {/* Actions column implicit */}
                </div>
                {types.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum tipo cadastrado.</div>
                ) : (
                    types.map((type) => (
                        <div key={type.id} className="grid grid-cols-3 gap-4 p-4 border-b last:border-0 items-center hover:bg-gray-50">
                           <div>{type.name}</div>
                           <div>{type.dataType}</div>
                           <div className="flex justify-between items-center">
                               <span>{type.unit || '-'}</span>
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                               </Button>
                           </div>
                        </div>
                    ))
                )}
             </div>
          </CardContent>
       </Card>

       <Card>
          <CardHeader>
             <CardTitle className="bg-gray-100 p-2 rounded">Novo Tipo de Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div>
                <Label>Tipo de Meta <span className="text-red-500">*</span></Label>
                <Input 
                   value={formData.name} 
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Ex: Financeira"
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label>Tipo de Dado</Label>
                    <Select value={formData.dataType} onValueChange={(v) => setFormData({...formData, dataType: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Valor Monetário">Valor Monetário</SelectItem>
                            <SelectItem value="Percentual">Percentual</SelectItem>
                            <SelectItem value="Data">Data</SelectItem>
                            <SelectItem value="Quantidade Numérica">Quantidade Numérica</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 
                 {['Valor Monetário', 'Percentual', 'Quantidade Numérica'].includes(formData.dataType) && (
                     <div>
                        <Label>Unidade</Label>
                        <Input 
                           value={formData.unit} 
                           onChange={(e) => setFormData({...formData, unit: e.target.value})}
                           placeholder="Ex: R$, %, un, kg"
                           className="w-20"
                        />
                     </div>
                 )}
             </div>

             <div className="flex items-center space-x-2">
                <Checkbox 
                    id="continue" 
                    checked={continueInserting} 
                    onCheckedChange={(c) => setContinueInserting(c === true)} 
                />
                <label htmlFor="continue" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Continuar inserindo tipos de meta
                </label>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                 <Button variant="outline" onClick={() => setFormData({ name: '', dataType: 'Quantidade Numérica', unit: '' })}>
                    Cancelar
                 </Button>
                 <Button onClick={handleSubmit}>Confirmar</Button>
             </div>
          </CardContent>
       </Card>
    </div>
  )
}
