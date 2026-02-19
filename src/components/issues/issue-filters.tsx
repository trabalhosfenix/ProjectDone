'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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
        <select
          id="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="INTERNAL">Interna</option>
          <option value="EXTERNAL">Externa</option>
        </select>
      </div>

      {/* Situação */}
      <div>
        <Label htmlFor="status">Situação</Label>
        <select
          id="status"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.statusId}
          onChange={(e) => handleChange('statusId', e.target.value)}
        >
          <option value="">Todas</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de Envolvimento */}
      <div>
        <Label htmlFor="role">Tipo de Envolvimento</Label>
        <select
          id="role"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.role}
          onChange={(e) => handleChange('role', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="RESPONSIBLE">Responsável</option>
          <option value="EXECUTOR">Executor</option>
          <option value="TEAM">Equipe</option>
          <option value="VALIDATES">Valida</option>
          <option value="EVALUATES">Avalia</option>
          <option value="COMMENTS">Comenta</option>
          <option value="OBSERVES">Observa</option>
        </select>
      </div>

      {/* Pessoa */}
      <div>
        <Label htmlFor="member">Pessoa</Label>
        <select
          id="member"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.memberId}
          onChange={(e) => handleChange('memberId', e.target.value)}
        >
          <option value="">Todas</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <Button onClick={handleApply} className="w-full">
        Aplicar Filtros
      </Button>
    </div>
  )
}
