'use client'

import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { ProjectItemRow } from './project-item-row'
import { createProjectItem } from '@/app/actions/project-items'

interface ProjectEAPTreeProps {
  projectId: string
  initialItems: any[]
}

export function ProjectEAPTree({ projectId, initialItems }: ProjectEAPTreeProps) {
  const [items, setItems] = useState(initialItems)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [newItemData, setNewItemData] = useState({
    task: '',
    scenario: '',
    status: 'A iniciar',
    priority: 'Média'
  })

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (items: any[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id)
          collectIds(item.children)
        }
      })
    }
    collectIds(items)
    setExpandedIds(allIds)
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleCreateItem = async () => {
    if (!newItemData.task.trim()) {
      alert('Por favor, informe o nome da tarefa.')
      return
    }

    setLoading(true)

    const result = await createProjectItem({
      projectId,
      task: newItemData.task,
      scenario: newItemData.scenario,
      status: newItemData.status,
      priority: newItemData.priority
    })

    if (result.success) {
      // Recarregar página para atualizar lista
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao criar tarefa')
    }

    setLoading(false)
  }

  const filterItems = (items: any[]): any[] => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.externalId?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !statusFilter || item.status === statusFilter

      return matchesSearch && matchesStatus
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : []
    }))
  }

  const renderTree = (items: any[], level: number = 0) => {
    const filtered = filterItems(items)

    return filtered.map(item => {
      const hasChildren = item.children && item.children.length > 0
      const isExpanded = expandedIds.has(item.id)

      return (
        <div key={item.id}>
          <ProjectItemRow
            item={item}
            level={level}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleExpand(item.id)}
            projectId={projectId}
          />
          
          {hasChildren && isExpanded && (
            <div>
              {renderTree(item.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Expandir Tudo
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Colapsar Tudo
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos os status</option>
            <option value="A iniciar">A iniciar</option>
            <option value="Andamento">Andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Parado">Parado</option>
            <option value="Atrasado">Atrasado</option>
          </select>

          {/* Botão Nova Tarefa */}
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Formulário Nova Tarefa */}
      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Nova Tarefa</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Tarefa *
              </label>
              <input
                type="text"
                value={newItemData.task}
                onChange={(e) => setNewItemData(prev => ({ ...prev, task: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Ex: Implementar módulo de autenticação"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cenário
              </label>
              <input
                type="text"
                value={newItemData.scenario}
                onChange={(e) => setNewItemData(prev => ({ ...prev, scenario: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Ex: Desenvolvimento, Produção..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newItemData.status}
                onChange={(e) => setNewItemData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="A iniciar">A iniciar</option>
                <option value="Andamento">Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Parado">Parado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                value={newItemData.priority}
                onChange={(e) => setNewItemData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateItem}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Árvore de Tarefas */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
            <p className="text-sm mt-2">Clique em "Nova Tarefa" para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {renderTree(items)}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Parado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Atrasado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>A Iniciar</span>
        </div>
      </div>
    </div>
  )
}
