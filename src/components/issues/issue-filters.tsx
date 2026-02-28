'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

interface IssueFiltersProps {
  onFilterChange: (filters: any) => void
  statuses: any[]
  members: any[]
}

export function IssueFilters({ onFilterChange, statuses, members }: IssueFiltersProps) {
  const [filters, setFilters] = useState({
    type: '',
    statusId: '',
    memberId: '',
    role: '',
    search: ''
  })

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApply = () => {
    onFilterChange(filters)
  }

  const handleClear = () => {
    const clearedFilters = {
      type: '',
      statusId: '',
      memberId: '',
      role: '',
      search: ''
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Busca */}
      <div>
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Título, código ou descrição..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />
      </div>

      {/* Tipo */}
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select value={filters.type || '__all'} onValueChange={(value) => handleChange('type', value === '__all' ? '' : value)}>
          <SelectTrigger id="type" className="h-10 w-full mt-1">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos</SelectItem>
            <SelectItem value="INTERNAL">Interna</SelectItem>
            <SelectItem value="EXTERNAL">Externa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Situação */}
      <div>
        <Label htmlFor="status">Situação</Label>
        <Select value={filters.statusId || '__all'} onValueChange={(value) => handleChange('statusId', value === '__all' ? '' : value)}>
          <SelectTrigger id="status" className="h-10 w-full mt-1">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todas</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de Envolvimento */}
      <div>
        <Label htmlFor="role">Tipo de Envolvimento</Label>
        <Select value={filters.role || '__all'} onValueChange={(value) => handleChange('role', value === '__all' ? '' : value)}>
          <SelectTrigger id="role" className="h-10 w-full mt-1">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos</SelectItem>
            <SelectItem value="RESPONSIBLE">Responsável</SelectItem>
            <SelectItem value="EXECUTOR">Executor</SelectItem>
            <SelectItem value="TEAM">Equipe</SelectItem>
            <SelectItem value="VALIDATES">Valida</SelectItem>
            <SelectItem value="EVALUATES">Avalia</SelectItem>
            <SelectItem value="COMMENTS">Comenta</SelectItem>
            <SelectItem value="OBSERVES">Observa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pessoa */}
      <div>
        <Label htmlFor="member">Pessoa</Label>
        <Select value={filters.memberId || '__all'} onValueChange={(value) => handleChange('memberId', value === '__all' ? '' : value)}>
          <SelectTrigger id="member" className="h-10 w-full mt-1">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todas</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={String(member.id)}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleApply} className="w-full">
        Aplicar Filtros
      </Button>
    </div>
  )
}
