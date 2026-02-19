'use client'

import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { updateProjectItem, deleteProjectItem } from '@/app/actions/project-items'

interface ProjectItemRowProps {
  item: any
  level: number
  hasChildren: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  projectId: string
}

export function ProjectItemRow({
  item,
  level,
  hasChildren,
  isExpanded,
  onToggleExpand,
  projectId
}: ProjectItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState({
    task: item.task || '',
    status: item.status || 'A iniciar',
    priority: item.priority || 'Média',
    responsible: item.responsible || ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Andamento':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Parado':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Atrasado':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'text-red-600'
      case 'Média':
        return 'text-yellow-600'
      case 'Baixa':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleSave = async () => {
    setLoading(true)

    const result = await updateProjectItem(item.id, {
      task: editData.task,
      status: editData.status,
      priority: editData.priority,
      responsible: editData.responsible
    })

    if (result.success) {
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao atualizar tarefa')
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Deseja realmente excluir a tarefa "${item.task}"?`)) {
      return
    }

    setLoading(true)

    const result = await deleteProjectItem(item.id)

    if (result.success) {
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao excluir tarefa')
    }

    setLoading(false)
  }

  if (isEditing) {
    return (
      <div 
        className="bg-blue-50 border-l-4 border-blue-500 p-4"
        style={{ paddingLeft: `${level * 2 + 1}rem` }}
      >
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Tarefa</label>
            <input
              type="text"
              value={editData.task}
              onChange={(e) => setEditData(prev => ({ ...prev, task: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="A iniciar">A iniciar</option>
              <option value="Andamento">Andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Parado">Parado</option>
              <option value="Atrasado">Atrasado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={editData.priority}
              onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
            <input
              type="text"
              value={editData.responsible}
              onChange={(e) => setEditData(prev => ({ ...prev, responsible: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Nome do responsável"
            />
          </div>

          <div className="col-span-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm"
            >
              <X className="w-3 h-3" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
      style={{ paddingLeft: `${level * 2}rem` }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Expand/Collapse */}
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          ) : (
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          )}
        </button>

        {/* ID */}
        <div className="w-24 flex-shrink-0">
          <span className="text-xs text-gray-500 font-mono">
            {item.externalId || item.id.slice(0, 8)}
          </span>
        </div>

        {/* Tarefa */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {item.task || 'Sem nome'}
          </div>
          {item.scenario && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {item.scenario}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="w-28 flex-shrink-0">
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* Prioridade */}
        <div className="w-20 flex-shrink-0">
          <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority || '-'}
          </span>
        </div>

        {/* Responsável */}
        <div className="w-32 flex-shrink-0">
          <span className="text-xs text-gray-600 truncate">
            {item.responsible || '-'}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:bg-gray-200 rounded text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 hover:bg-gray-200 rounded text-red-600 hover:text-red-800 disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
