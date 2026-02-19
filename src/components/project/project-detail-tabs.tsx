'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ProjectDetailTabsProps {
  projectId: string
}

const tabs = [
  { id: 'detalhes', label: 'Detalhes', href: '' },
  { id: 'monitorar', label: 'Monitorar', href: '/monitorar' },
  { id: 'planejar', label: 'Planejar', href: '/planejar' },
  { id: 'envolvidos', label: 'Envolvidos', href: '/envolvidos' },
  { id: 'alocacao', label: 'Alocação', href: '/alocacao' },
  { id: 'realizar', label: 'Realizar', href: '/realizar' },
  { id: 'registros', label: 'Registros', href: '/registros' }
]

export function ProjectDetailTabs({ projectId }: ProjectDetailTabsProps) {
  // Menu ocultado conforme solicitação
  return null
  
  const pathname = usePathname()
  
  const getIsActive = (tabHref: string) => {
    const basePath = `/dashboard/projetos/${projectId}`
    if (tabHref === '') {
      return pathname === basePath
    }
    return pathname === `${basePath}${tabHref}`
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex gap-1 px-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = getIsActive(tab.href)
          const href = `/dashboard/projetos/${projectId}${tab.href}`
          
          return (
            <Link
              key={tab.id}
              href={href}
              className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
