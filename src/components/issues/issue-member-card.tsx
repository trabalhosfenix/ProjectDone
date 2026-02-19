'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeIssueMember } from '@/app/actions/issues'
import { toast } from 'sonner'
import { useState } from 'react'

interface IssueMemberCardProps {
  member: any
  projectId: string
  issueId: string
  canRemove?: boolean
}

const roleColors: Record<string, string> = {
  RESPONSIBLE: 'bg-red-100 text-red-800',
  EXECUTOR: 'bg-purple-100 text-purple-800',
  TEAM: 'bg-blue-100 text-blue-800',
  VALIDATES: 'bg-yellow-100 text-yellow-800',
  EVALUATES: 'bg-orange-100 text-orange-800',
  COMMENTS: 'bg-cyan-100 text-cyan-800',
  OBSERVES: 'bg-green-100 text-green-800',
}

const roleLabels: Record<string, string> = {
  RESPONSIBLE: 'Responsável',
  EXECUTOR: 'Executor',
  TEAM: 'Equipe',
  VALIDATES: 'Valida',
  EVALUATES: 'Avalia',
  COMMENTS: 'Comenta',
  OBSERVES: 'Observa',
}

export function IssueMemberCard({ member, projectId, issueId, canRemove = false }: IssueMemberCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`Remover ${member.user.name} como ${roleLabels[member.role]}?`)) {
      return
    }

    setIsRemoving(true)

    const result = await removeIssueMember(member.id, projectId, issueId)

    if (result.success) {
      toast.success('Envolvido removido')
    } else {
      toast.error(result.error || 'Erro ao remover envolvido')
    }

    setIsRemoving(false)
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
        {member.user.name?.substring(0, 2).toUpperCase() || 'U'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{member.user.name}</p>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}>
          {roleLabels[member.role] || member.role}
        </span>
      </div>

      {/* Remove button */}
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
        </Button>
      )}
    </div>
  )
}
