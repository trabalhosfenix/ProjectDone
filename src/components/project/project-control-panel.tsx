'use client'

import { useEffect, useState } from 'react'
import { calculateProjectMetrics } from '@/app/actions/project-details'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { ProjectBudgetEditor } from './project-budget-editor'

interface ProjectControlPanelProps {
  projectId: string
  project: {
    progress?: number | string | null
    budget?: number | string | null
    actualCost?: number | string | null
    startDate?: string | Date | null
    endDate?: string | Date | null
  }
}

export function ProjectControlPanel({ projectId, project }: ProjectControlPanelProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'EVA' | 'PB'>('EVA')

  useEffect(() => {
    loadMetrics()
  }, [projectId])

  const loadMetrics = async () => {
    setLoading(true)
    const result = await calculateProjectMetrics(projectId)
    if (result.success && result.data) {
      setMetrics(result.data)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <TrendingUp className="w-4 h-4" />
      case 'warning':
        return <Minus className="w-4 h-4" />
      case 'critical':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
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

  const progressValue = toNumber(project.progress)
  const budgetValue = toNumber(project.budget)
  const actualCostValue = toNumber(project.actualCost)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle EVA/PB */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setViewMode('EVA')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
            viewMode === 'EVA'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          EVA
        </button>
        <button
          onClick={() => setViewMode('PB')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
            viewMode === 'PB'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          PB
        </button>
      </div>

      {/* Painel de Controle */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Painel de Controle</h3>
          <ProjectBudgetEditor 
            projectId={projectId}
            currentBudget={budgetValue}
            currentActualCost={actualCostValue}
            currentStartDate={project.startDate?.toString()}
            currentEndDate={project.endDate?.toString()}
          />
        </div>

        {viewMode === 'EVA' && metrics ? (
          <div className="space-y-4">
            {/* SPI e CPI */}
            <div className="grid grid-cols-2 gap-4">
              {/* SPI */}
              <div className={`border rounded-lg p-4 ${getStatusColor(metrics.scheduleStatus)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">SPI</span>
                  {getStatusIcon(metrics.scheduleStatus)}
                </div>
                <div className="text-3xl font-bold">{metrics.SPI}</div>
                <div className="text-xs mt-1">Schedule Performance</div>
              </div>

              {/* CPI */}
              <div className={`border rounded-lg p-4 ${getStatusColor(metrics.costStatus)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">CPI</span>
                  {getStatusIcon(metrics.costStatus)}
                </div>
                <div className="text-3xl font-bold">{metrics.CPI}</div>
                <div className="text-xs mt-1">Cost Performance</div>
              </div>
            </div>

            {/* Valores EVA */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">BAC (Budget at Completion):</span>
                <span className="font-semibold">R$ {metrics.BAC}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">EV (Earned Value):</span>
                <span className="font-semibold">R$ {metrics.EV}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PV (Planned Value):</span>
                <span className="font-semibold">R$ {metrics.PV}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">AC (Actual Cost):</span>
                <span className="font-semibold">R$ {metrics.AC}</span>
              </div>
            </div>

            {/* Variâncias */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">VARIÂNCIAS</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SV (Schedule Variance):</span>
                <span className={`font-semibold ${parseFloat(metrics.SV) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {metrics.SV}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CV (Cost Variance):</span>
                <span className={`font-semibold ${parseFloat(metrics.CV) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {metrics.CV}
                </span>
              </div>
            </div>

            {/* Estimativas */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">ESTIMATIVAS</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">EAC (Estimate at Completion):</span>
                <span className="font-semibold">R$ {metrics.EAC}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ETC (Estimate to Complete):</span>
                <span className="font-semibold">R$ {metrics.ETC}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAC (Variance at Completion):</span>
                <span className={`font-semibold ${parseFloat(metrics.VAC) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {metrics.VAC}
                </span>
              </div>
            </div>

            {/* Progresso */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progresso:</span>
                <span className="font-semibold">{metrics.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(parseFloat(metrics.progress), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Atraso */}
            {metrics.delayDays !== 0 && (
              <div className={`border rounded-lg p-4 ${metrics.delayDays > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="text-sm">
                  <span className="text-gray-600">Atraso:</span>
                  <span className={`ml-2 font-bold ${metrics.delayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.delayDays > 0 ? `+${metrics.delayDays}` : metrics.delayDays} dias
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Modo PB (Percentuais)
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center text-gray-500 text-sm">
                Modo PB (Percentuais)
                <div className="mt-2 text-xs text-gray-400">
                  Visualização simplificada com percentuais de escopo, tempo e custos
                </div>
              </div>
            </div>

            {/* Progresso Geral */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progresso Geral:</span>
                <span className="font-semibold">{progressValue}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(progressValue, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Orçamento */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Orçamento:</span>
                <span className="font-semibold">R$ {budgetValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Custo Real:</span>
                <span className="font-semibold">R$ {actualCostValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Utilização:</span>
                <span className={`font-semibold ${
                  actualCostValue > budgetValue ? 'text-red-600' : 'text-green-600'
                }`}>
                  {budgetValue > 0 ? ((actualCostValue / budgetValue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
