'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, CheckCircle, AlertCircle, Clock, ArrowLeft } from "lucide-react"
import Link from 'next/link'

interface PerformanceDashboardProps {
  items: any[]
  projectId?: string
  metrics?: any
}

import { ProjectPageHeader } from "../project/project-page-header"

export function PerformanceDashboard({ items, projectId, metrics }: PerformanceDashboardProps) {
  // Helpers...
  const formatDate = (date: string | Date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }
  // ... (keep logical vars)
  const now = new Date()
  const spi = metrics?.SPI || '0.00'
  const progress = metrics?.progress || '0.00'
  const delayDays = metrics?.delayDays || 0
  const spiColor = parseFloat(spi) < 1.0 ? 'text-red-600' : 'text-green-600'
  const spiBg = parseFloat(spi) < 1.0 ? 'bg-red-50' : 'bg-green-50'
  const delayColor = delayDays > 0 ? 'text-red-600' : 'text-green-600'
  
  return (
    <div className="space-y-6">
      {/* Header Standardized */}
      {projectId && (
        <ProjectPageHeader 
            title="Monitoramento & Controle" 
            description="Análise de Valor Agregado (EVA) e indicadores de desempenho."
            projectId={projectId}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SPI Card */}
          <div className={`rounded-xl p-6 shadow-sm border ${spiBg} border-opacity-50`}>
              <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold ${spiColor} uppercase`}>SPI</span>
                  <Clock className={`w-5 h-5 ${spiColor}`} />
              </div>
              <div className={`text-4xl font-bold ${spiColor} mb-1`}>{spi}</div>
              <div className={`text-xs ${spiColor} opacity-80`}>Schedule Performance Index</div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-gray-500 uppercase">Progresso</span>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-1">{progress}%</div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(progress || '0'), 100)}%` }} />
              </div>
          </div>

          {/* Delay Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-gray-500 uppercase">Atraso</span>
                  <AlertCircle className={`w-5 h-5 ${delayColor}`} />
              </div>
              <div className={`text-4xl font-bold ${delayColor} mb-1`}>{delayDays} dias</div>
              <div className="text-xs text-gray-400">Em relação ao cronograma base</div>
          </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Detalhamento de Atividades</h3>
        </div>
        <table className="w-full text-xs text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-tight">
                    <th className="p-3 border-b font-bold min-w-[200px]">Atividades</th>
                    <th className="p-3 border-b font-bold">Responsável</th>
                    <th className="p-3 border-b font-bold text-center">Duração</th>
                    <th className="p-3 border-b font-bold text-center">Início</th>
                    <th className="p-3 border-b font-bold text-center">Término</th>
                    <th className="p-3 border-b font-bold text-center">Novo Prazo</th>
                    <th className="p-3 border-b font-bold text-center">Término Real</th>
                    <th className="p-3 border-b font-bold text-center">% Concl</th>
                    <th className="p-3 border-b font-bold text-center">Stat</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {items.length === 0 && (
                    <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">Nenhuma atividade encontrada</td>
                    </tr>
                )}
                {items.map((item, idx) => {
                    const isDelayed = item.progress < 100 && item.datePlannedEnd && new Date(item.datePlannedEnd) < now
                    const statusColor = item.status === 'Concluído' || item.progress === 100 ? 'bg-green-500' : isDelayed ? 'bg-red-500' : 'bg-blue-500'
                    
                    return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium text-gray-900 truncate max-w-[250px]" title={item.task}>{item.task}</td>
                            <td className="p-3 text-gray-600 truncate max-w-[150px]">{item.responsible || '-'}</td>
                            <td className="p-3 text-center text-gray-600">{item.duration ? `${item.duration}d` : '-'}</td>
                            <td className="p-3 text-center text-gray-600">{formatDate(item.datePlanned)}</td>
                            <td className="p-3 text-center text-gray-600">{formatDate(item.datePlannedEnd)}</td>
                            <td className="p-3 text-center text-orange-600 font-medium">{item.metadata?.novoPrazo || '-'}</td>
                            <td className="p-3 text-center text-gray-600">{formatDate(item.dateActual)}</td>
                            <td className="p-3 text-center font-bold text-gray-700">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-8 text-right">{item.progress ?? 0}%</span>
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }} />
                                    </div>
                                </div>
                            </td>
                            <td className="p-3 text-center align-middle">
                                <div className={`w-2.5 h-2.5 rounded-full mx-auto ${statusColor}`} title={isDelayed ? 'Atrasado' : 'Em dia'} />
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
      </div>
    </div>
  )
}
