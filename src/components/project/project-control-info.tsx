'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ProjectControlInfoProps {
  project: {
    id: string
    status?: string | null
    strategicWeight?: number | string | null
    progress?: number | string | null
    baseStartDate?: Date | null
    baseEndDate?: Date | null
    baseDuration?: number | string | null
    startDate?: Date | null
    endDate?: Date | null
    duration?: number | string | null
    realStartDate?: Date | null
    realEndDate?: Date | null
    realDuration?: number | string | null
    baseProfit?: number | string | null
    baseBudget?: number | string | null
    budget?: number | string | null
    actualCost?: number | string | null
    baseRevenue?: number | string | null
    actualRevenue?: number | string | null
    actualProfit?: number | string | null
    baseEffort?: number | string | null
    plannedEffort?: number | string | null
    actualEffort?: number | string | null
    createdAt?: Date | null
    createdBy?: {
      name?: string | null
      email?: string | null
    } | null
  }
}

export function ProjectControlInfo({ project }: ProjectControlInfoProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['integracao'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    return `R$ ${toNumber(value).toFixed(2).replace('.', ',')}`
  }

  const Section = ({ 
    id, 
    title, 
    children 
  }: { 
    id: string
    title: string
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.includes(id)
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2 text-sm">
            {children}
          </div>
        )}
      </div>
    )
  }

  const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between py-1">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        <h4 className="font-bold text-gray-900">Informações de Controle</h4>
      </div>

      {/* Integração */}
      <Section id="integracao" title="Integração">
        <InfoRow label="Status" value={project.status || 'Não definido'} />
        <InfoRow label="Peso Estratégico" value={toNumber(project.strategicWeight)} />
      </Section>

      {/* Escopo */}
      <Section id="escopo" title="Escopo">
        <InfoRow label="% Previsto" value={`${toNumber(project.progress)}%`} />
        <InfoRow label="% Realizado" value={`${toNumber(project.progress)}%`} />
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(toNumber(project.progress), 100)}%` }}
            ></div>
          </div>
        </div>
      </Section>

      {/* Tempo */}
      <Section id="tempo" title="Tempo">
        <div className="space-y-3">
          {/* Base */}
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs font-semibold text-gray-700 mb-1">BASE</div>
            <InfoRow label="Início" value={formatDate(project.baseStartDate)} />
            <InfoRow label="Fim" value={formatDate(project.baseEndDate)} />
            <InfoRow label="Duração" value={`${toNumber(project.baseDuration)} dias`} />
          </div>

          {/* Previsto */}
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs font-semibold text-gray-700 mb-1">PREVISTO</div>
            <InfoRow label="Início" value={formatDate(project.startDate)} />
            <InfoRow label="Fim" value={formatDate(project.endDate)} />
            <InfoRow label="Duração" value={`${toNumber(project.duration)} dias`} />
          </div>

          {/* Real */}
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs font-semibold text-gray-700 mb-1">REAL</div>
            <InfoRow label="Início" value={formatDate(project.realStartDate)} />
            <InfoRow label="Fim" value={formatDate(project.realEndDate)} />
            <InfoRow label="Duração" value={`${toNumber(project.realDuration)} dias`} />
          </div>
        </div>
      </Section>

      {/* Lucro */}
      <Section id="lucro" title="Lucro">
        <InfoRow label="Base" value={formatCurrency(project.baseProfit)} />
        <InfoRow label="Real" value={formatCurrency(project.actualProfit)} />
      </Section>

      {/* Custos */}
      <Section id="custos" title="Custos">
        <InfoRow label="Base" value={formatCurrency(project.baseBudget)} />
        <InfoRow label="Previsto" value={formatCurrency(project.budget)} />
        <InfoRow label="Real" value={formatCurrency(project.actualCost)} />
        <div className="mt-2 pt-2 border-t border-gray-200">
          <InfoRow 
            label="Variação" 
            value={formatCurrency(toNumber(project.budget) - toNumber(project.actualCost))} 
          />
        </div>
      </Section>

      {/* Receita */}
      <Section id="receita" title="Receita">
        <InfoRow label="Base" value={formatCurrency(project.baseRevenue)} />
        <InfoRow label="Real" value={formatCurrency(project.actualRevenue)} />
      </Section>

      {/* Recursos Humanos */}
      <Section id="rh" title="Recursos Humanos (Esforço)">
        <InfoRow label="Base" value={`${project.baseEffort || 0}h`} />
        <InfoRow label="Previsto" value={`${project.plannedEffort || 0}h`} />
        <InfoRow label="Real" value={`${project.actualEffort || 0}h`} />
        <div className="mt-2 pt-2 border-t border-gray-200">
          <InfoRow 
            label="Variação" 
            value={`${(project.plannedEffort || 0) - (project.actualEffort || 0)}h`} 
          />
        </div>
      </Section>

      {/* Criado por */}
      <Section id="criacao" title="Criação">
        <InfoRow 
          label="Criado por" 
          value={project.createdBy?.name || project.createdBy?.email || 'Sistema'} 
        />
        <InfoRow label="Data" value={formatDate(project.createdAt)} />
      </Section>
    </div>
  )
}
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'))
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      const parsed = (value as { toNumber: () => number }).toNumber()
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }
