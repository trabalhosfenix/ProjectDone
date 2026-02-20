'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { MppSyncButton } from '@/components/project/mpp-sync-button'

type ProjectContextResponse = {
  success: boolean
  linked?: boolean
  localProjectId?: string
  importedProjectId?: string
  mppProjectId?: string
  source?: string
  updatedAt?: string
  error?: string
}

interface ProjectMppContextProps {
  projectId: string
  compact?: boolean
  onSynced?: () => Promise<void> | void
}

export function ProjectMppContext({ projectId, compact = false, onSynced }: ProjectMppContextProps) {
  const [context, setContext] = useState<ProjectContextResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadContext = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/mpp/project-context/${projectId}`, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Falha ao consultar contexto MPP')
      }

      const payload = (await response.json()) as ProjectContextResponse
      setContext(payload)
    } catch (error) {
      setContext({
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao carregar contexto MPP',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadContext()
  }, [projectId])

  if (isLoading || !context) {
    return <div className="text-xs text-gray-500">Carregando contexto MPP...</div>
  }

  if (!context.success) {
    return <div className="text-xs text-red-600">{context.error || 'Erro no contexto MPP'}</div>
  }

  if (!context.linked) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">Sem vínculo MPP</Badge>
      </div>
    )
  }

  return (
    <div className={`flex ${compact ? 'items-center' : 'items-start'} gap-2 flex-wrap`}>
      <Badge variant="secondary">MPP vinculado</Badge>
      {context.mppProjectId && <Badge variant="outline">MPP: {context.mppProjectId.slice(0, 8)}...</Badge>}
      {context.source && <Badge variant="outline">Fonte: {context.source}</Badge>}
      {context.updatedAt && (
        <span className="text-xs text-gray-500">
          Última sync: {new Date(context.updatedAt).toLocaleString('pt-BR')}
        </span>
      )}
      <MppSyncButton
        localProjectId={projectId}
        onSynced={async () => {
          await loadContext()
          await onSynced?.()
        }}
        label="Sincronizar MPP"
      />
    </div>
  )
}
