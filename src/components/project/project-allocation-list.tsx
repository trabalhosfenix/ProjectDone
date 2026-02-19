'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Save, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { updateMemberAllocation } from '@/app/actions/project-members'

interface ProjectAllocationProps {
  projectId: string
  members: any[]
}

export function ProjectAllocationList({ projectId, members }: ProjectAllocationProps) {
  const [editingValues, setEditingValues] = useState<Record<string, { cost: string, effort: string, revenue: string }>>({})

  const handleInputChange = (memberId: string, field: 'cost' | 'effort' | 'revenue', value: string) => {
    const member = members.find(m => m.id === memberId)
    setEditingValues(prev => ({
      ...prev,
      [memberId]: {
        cost: prev[memberId]?.cost ?? member?.cost?.toString() ?? '0',
        effort: prev[memberId]?.effort ?? member?.effort?.toString() ?? '0',
        revenue: prev[memberId]?.revenue ?? member?.revenue?.toString() ?? '0',
        [field]: value
      }
    }))
  }

  const handleSave = async (memberId: string) => {
    const values = editingValues[memberId]
    if (!values) return

    const cost = parseFloat(values.cost)
    const effort = parseInt(values.effort)
    const revenue = parseFloat(values.revenue)

    if (isNaN(cost) || isNaN(effort) || isNaN(revenue)) {
      toast.error('Valores inválidos')
      return
    }

    const result = await updateMemberAllocation(memberId, projectId, { cost, effort, revenue })
    
    if (result.success) {
      toast.success('Alocação salva!')
    } else {
      toast.error(result.error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Matriz de Alocação de Recursos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Recurso (Membro)</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Custo/Hora (R$)</TableHead>
              <TableHead>Receita/Hora (R$)</TableHead>
              <TableHead>Horas Alocadas</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Receita Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhum membro encontrado. Adicione pessoas na aba "Envolvidos".
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const isEditing = editingValues[member.id]
                const costValue = isEditing ? isEditing.cost : member.cost?.toString() || '0'
                const effortValue = isEditing ? isEditing.effort : member.effort?.toString() || '0'
                const revenueValue = isEditing ? isEditing.revenue : member.revenue?.toString() || '0'
                
                const totalCost = parseFloat(costValue) * parseInt(effortValue)
                const totalRevenue = parseFloat(revenueValue) * parseInt(effortValue)
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{member.user?.name || 'Sem nome'}</div>
                          <div className="text-xs text-gray-500">{member.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="relative w-28">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-red-500" />
                        <Input 
                          type="number" 
                          className="pl-8 text-sm" 
                          value={costValue}
                          onChange={(e) => handleInputChange(member.id, 'cost', e.target.value)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative w-28">
                        <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                        <Input 
                          type="number" 
                          className="pl-8 text-sm" 
                          value={revenueValue}
                          onChange={(e) => handleInputChange(member.id, 'revenue', e.target.value)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative w-24">
                        <Clock className="absolute left-2 top-2.5 h-4 w-4 text-blue-500" />
                        <Input 
                          type="number" 
                          className="pl-8 text-sm" 
                          value={effortValue}
                          onChange={(e) => handleInputChange(member.id, 'effort', e.target.value)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(totalCost)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(totalRevenue)}
                    </TableCell>
                    <TableCell>
                      {editingValues[member.id] && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(member.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        
        {members.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end gap-8 text-sm">
              <div>
                <span className="text-gray-500">Custo Total: </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(members.reduce((acc, m) => {
                    const editing = editingValues[m.id]
                    const cost = editing ? parseFloat(editing.cost) : (m.cost || 0)
                    const effort = editing ? parseInt(editing.effort) : (m.effort || 0)
                    return acc + (cost * effort)
                  }, 0))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Receita Total: </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(members.reduce((acc, m) => {
                    const editing = editingValues[m.id]
                    const revenue = editing ? parseFloat(editing.revenue) : (m.revenue || 0)
                    const effort = editing ? parseInt(editing.effort) : (m.effort || 0)
                    return acc + (revenue * effort)
                  }, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
