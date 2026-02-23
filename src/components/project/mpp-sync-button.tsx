'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface MppSyncButtonProps {
  localProjectId: string
  syncMode?: 'append' | 'upsert' | 'replace'
  onSynced?: () => Promise<void> | void
  variant?: 'default' | 'outline'
  label?: string
}

export function MppSyncButton({
  localProjectId,
  syncMode = 'upsert',
  onSynced,
  variant = 'outline',
  label = 'Sincronizar MPP',
}: MppSyncButtonProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setSyncing(true)

      const contextResponse = await fetch(`/api/mpp/project-context/${localProjectId}`, { cache: 'no-store' })
      const context = await contextResponse.json()

      if (!contextResponse.ok || !context?.mppProjectId) {
        throw new Error(context?.error || 'Projeto MPP não vinculado para sincronização')
      }

      const syncResponse = await fetch('/api/mpp/sync-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mppProjectId: String(context.mppProjectId),
          localProjectId,
          syncMode,
        }),
      })
      const result = await syncResponse.json()

      if (!syncResponse.ok || !result.success) {
        throw new Error(result.error || 'Falha ao sincronizar projeto')
      }

      toast.success(`Sincronização concluída (${result.importedTasks || 0} tarefas atualizadas)`)

      if (onSynced) {
        await onSynced()
      }

      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao sincronizar projeto')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button variant={variant} onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {label}
    </Button>
  )
}

