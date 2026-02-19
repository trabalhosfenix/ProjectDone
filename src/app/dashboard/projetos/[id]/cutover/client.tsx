'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CutoverDashboard } from '@/components/cutover/cutover-dashboard'
import { CutoverTaskTable } from '@/components/cutover/cutover-task-table'

interface CutoverPageClientProps {
  projectId: string
  initialTasks: any[]
  initialStats: {
    total: number
    completed: number
    inProgress: number
    delayed: number
    pending: number
    completedPercent: number
    inProgressPercent: number
    delayedPercent: number
  }
}

export function CutoverPageClient({ projectId, initialTasks, initialStats }: CutoverPageClientProps) {
  const router = useRouter()
  
  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <CutoverDashboard stats={initialStats} />
      <CutoverTaskTable 
        projectId={projectId} 
        tasks={initialTasks} 
        onRefresh={handleRefresh} 
      />
    </>
  )
}
