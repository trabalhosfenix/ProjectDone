'use client'

import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectHorizontalMenuProps {
  projectId: string
}

export function ProjectHorizontalMenu({ projectId }: ProjectHorizontalMenuProps) {
  // true = funciona, false = placeholder em cinza ("Em Breve")
  const menuSections = [
    {
      id: 'detalhes',
      label: 'Detalhes',
      items: [
        { label: 'Cronograma', href: `/dashboard/projetos/${projectId}/cronograma`, implemented: true },
        { label: 'Importar Excel', href: `/dashboard/projetos/${projectId}/importar?type=excel`, implemented: true },
        { label: 'Importar MS Project', href: `/dashboard/projetos/${projectId}/importar?type=msproject`, implemented: true },
        { label: 'Exportar Excel', href: `/dashboard/projetos/${projectId}/importar?type=excel&mode=export`, implemented: true },
        { label: 'Exportar MS Project', href: `/dashboard/projetos/${projectId}/importar?type=msproject&mode=export`, implemented: true },
        { label: 'Dashboard', href: `/dashboard/projetos/${projectId}/relatorios`, implemented: true },
        { label: 'Minha Conta', href: `/dashboard/minha-conta`, implemented: true },
      ]
    },
    {
      id: 'planejar_executar',
      label: 'Planejar e Executar',
      items: [
        { label: 'Canvas', href: `/dashboard/projetos/${projectId}/escopo/canvas`, implemented: true },
        { label: 'Envolvidos', href: `/dashboard/projetos/${projectId}/envolvidos`, implemented: true },
        { label: 'Alocação', href: `/dashboard/projetos/${projectId}/alocacao`, implemented: true },
        { label: 'EAP / Dicionário', href: `/dashboard/projetos/${projectId}/escopo/dicionario`, implemented: true },
        { label: 'Metas', href: `/dashboard/projetos/${projectId}/metas`, implemented: true },
        { label: 'Riscos - Listar', href: `/dashboard/projetos/${projectId}/riscos`, implemented: true },
        { label: 'Riscos - Novo', href: `/dashboard/projetos/${projectId}/riscos/novo`, implemented: true },
        { label: 'Riscos - Importar', href: `/dashboard/projetos/${projectId}/riscos/importar`, implemented: true },
        { label: 'Questões - Listar', href: `/dashboard/projetos/${projectId}/questoes`, implemented: true },
        { label: 'Questões - Nova', href: `/dashboard/projetos/${projectId}/questoes/nova`, implemented: true },
        { label: 'Kanban do Projeto', href: `/dashboard/projetos/${projectId}/kanban`, implemented: true },
        { label: 'Calendário Editar', href: `/dashboard/projetos/${projectId}/calendario`, implemented: true },
      ]
    },
    {
      id: 'monitorar_controlar',
      label: 'Monitorar e Controlar',
      items: [
        { label: 'Status do Projeto', href: `/dashboard/projetos/${projectId}/situacao`, implemented: true },
        { label: 'Gráfico de Gantt', href: `/dashboard/projetos/${projectId}/gantt`, implemented: true },
        { label: 'Documentos do Projeto', href: `/dashboard/projetos/${projectId}/documentos`, implemented: true },
        { label: 'Relatórios', href: `/dashboard/projetos/${projectId}/relatorios`, implemented: true },
        { label: 'Testes Integrados', href: `/dashboard/projetos/${projectId}/testes`, implemented: true },
        { label: 'Go ou No Go', href: `/dashboard/projetos/${projectId}/go-no-go`, implemented: false },
        { label: 'Plano de Cutover', href: `/dashboard/projetos/${projectId}/cutover`, implemented: true },
      ]
    },
    {
      id: 'encerrar',
      label: 'Encerrar',
      items: [
        { label: 'Lições Aprendidas', href: `/dashboard/projetos/${projectId}/licoes-aprendidas`, implemented: true },
        { label: 'Termo de Encerramento', href: `/dashboard/projetos/${projectId}/termo-encerramento`, implemented: false },
      ]
    }
  ]

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 px-6 py-2 overflow-x-auto min-h-[50px]">
        {menuSections.map((section) => (
          <DropdownMenu key={section.id}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors whitespace-nowrap outline-none focus:bg-gray-100"
              >
                {section.label}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-[220px]">
              {section.items.map((item, idx) => (
                <DropdownMenuItem key={idx} asChild disabled={!item.implemented}>
                  <a 
                    href={item.implemented ? item.href : '#'}
                    className={`flex justify-between items-center w-full cursor-pointer ${!item.implemented ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={!item.implemented ? (e) => e.preventDefault() : undefined}
                  >
                    <span>{item.label}</span>
                    {!item.implemented && (
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Em breve
                      </span>
                    )}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    </div>
  )
}

