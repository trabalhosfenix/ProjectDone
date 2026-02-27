'use client'

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronRight,
  LayoutGrid,
  MessageSquare,
  FileText,
  Link2,
  Box,
  Clock,
  Mail,
  Target,
  Users,
  AlertTriangle,
  Settings,
  FileCode,
  Upload
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface ProjectSidebarProps {
  projectId: string
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  items: {
    id: string
    label: string
    href: string
    badge?: number
  }[]
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  // Seções expandidas por padrão
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'visao-geral', 'escopo', 'integracao'
  ])
  const pathname = usePathname()

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const menuItems: MenuItem[] = [
    {
      id: 'visao-geral',
      label: 'Visão Geral',
      icon: <LayoutGrid className="w-4 h-4" />,
      items: [
        { id: 'monitorar', label: 'Monitorar (Dashboard)', href: `/dashboard/projetos/${projectId}/monitorar` },
        { id: 'kanban-projeto', label: 'Kanban Tarefas', href: `/dashboard/projetos/${projectId}/kanban` },
        { id: 'cronograma', label: 'Cronograma', href: `/dashboard/projetos/${projectId}/cronograma` },
        { id: 'realizar', label: 'Minhas Tarefas', href: `/dashboard/projetos/${projectId}/realizar` },
      ]
    },
    {
      id: 'escopo',
      label: 'Escopo',
      icon: <Box className="w-4 h-4" />,
      items: [
        { id: 'canvas', label: 'Project Canvas', href: `/dashboard/projetos/${projectId}/escopo/canvas` },
        { id: 'eap', label: 'EAP / Dicionário', href: `/dashboard/projetos/${projectId}/escopo/dicionario` },
        { id: 'novo-comp', label: 'Novo Componente', href: `/dashboard/projetos/${projectId}/escopo/novo` },
      ]
    },
    {
      id: 'tempo',
      label: 'Tempo',
      icon: <Clock className="w-4 h-4" />,
      items: [
        { id: 'calendario', label: 'Calendário', href: `/dashboard/projetos/${projectId}/calendario` },
        { id: 'criticos', label: 'Caminho Crítico', href: `/dashboard/projetos/${projectId}/criticos` },
        { id: 'importar-msp', label: 'Importar MS Project', href: `/dashboard/projetos/${projectId}/importar?type=msproject` }
      ]
    },
    {
      id: 'integracao',
      label: 'Integração',
      icon: <Link2 className="w-4 h-4" />,
      items: [
        { id: 'registros', label: 'Registros (Diário)', href: `/dashboard/projetos/${projectId}/registros` },
        { id: 'situacao', label: 'Situação / Status', href: `/dashboard/projetos/${projectId}/situacao` },
        { id: 'classificacao', label: 'Classificação', href: `/dashboard/projetos/${projectId}/classificacao` }
      ]
    },
    {
      id: 'qualidade',
      label: 'Qualidade',
      icon: <Target className="w-4 h-4" />,
      items: [
        { id: 'metas', label: 'Metas', href: `/dashboard/projetos/${projectId}/metas` },
        // { id: 'avaliacao', label: 'Avaliação de Qualidade', href: `/dashboard/projetos/${projectId}/avaliacao` },
        { id: 'licoes', label: 'Lições Aprendidas', href: `/dashboard/projetos/${projectId}/licoes-aprendidas` }
      ]
    },
    {
      id: 'rh',
      label: 'Recursos Humanos',
      icon: <Users className="w-4 h-4" />,
      items: [
        { id: 'envolvidos', label: 'Envolvidos', href: `/dashboard/projetos/${projectId}/envolvidos` },
        { id: 'alocacao', label: 'Alocação e Custos', href: `/dashboard/projetos/${projectId}/alocacao` },
        { id: 'substituicao', label: 'Substituição em Massa', href: `/dashboard/projetos/${projectId}/substituicao` }
      ]
    },
    {
      id: 'comunicacao',
      label: 'Comunicação',
      icon: <Mail className="w-4 h-4" />,
      items: [
        { id: 'documentos', label: 'Documentos', href: `/dashboard/projetos/${projectId}/documentos` },
        { id: 'notificacoes', label: 'Notificações', href: `/dashboard/projetos/${projectId}/notificacoes` },
        { id: 'relatorios', label: 'Central de Relatórios', href: `/dashboard/projetos/${projectId}/relatorios` },
      ]
    },
    {
      id: 'riscos',
      label: 'Riscos',
      icon: <AlertTriangle className="w-4 h-4" />,
      items: [
        { id: 'riscos-painel', label: 'Painel de Riscos', href: `/dashboard/projetos/${projectId}/riscos` }
      ]
    },
    {
      id: 'questoes',
      label: 'Questões (Issues)',
      icon: <MessageSquare className="w-4 h-4" />,
      items: [
        { id: 'questoes-painel', label: 'Painel de Questões', href: `/dashboard/projetos/${projectId}/questoes` },
      ]
    },
    {
      id: 'ferramentas',
      label: 'Ferramentas',
      icon: <Settings className="w-4 h-4" />,
      items: [
        { id: 'importar', label: 'Importar / Exportar', href: `/dashboard/projetos/${projectId}/importar` },
      ]
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((section) => {
            const isExpanded = expandedSections.includes(section.id)
            // Verificar se algum item da seção está ativo para manter expandido visualmente (opcional)
            const isActiveSection = section.items.some(item => pathname?.startsWith(item.href))
            const finalExpanded = isExpanded || isActiveSection
            
            return (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span>{section.label}</span>
                  </div>
                  {finalExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {finalExpanded && (
                  <div className="mt-1 ml-6 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors
                            ${isActive 
                              ? 'text-purple-700 bg-purple-50 font-medium' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
