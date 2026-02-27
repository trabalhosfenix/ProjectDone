'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CutoverDashboardProps {
  stats: {
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

export function CutoverDashboard({ stats }: CutoverDashboardProps) {
  const chartData = [
    { name: 'Concluído', value: stats.completed, color: '#22c55e' },
    { name: 'Em Andamento', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Atrasado', value: stats.delayed, color: '#ef4444' },
    { name: 'Pendente', value: stats.pending, color: '#9ca3af' },
  ].filter(d => d.value > 0)

  return (
    <Card className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900">
      <CardContent className="p-6">
        <div className="flex items-center gap-8">
          
          {/* Donut Chart */}
          <div className="w-[180px] h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{stats.delayed}</div>
              <div className="text-xs text-gray-300">Atrasado</div>
              <div className="text-xs text-red-400">{stats.delayedPercent}%</div>
            </div>
            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-gray-300">Novo Prazo</div>
            </div>
            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
              <div className="text-xs text-gray-300">Em Andamento</div>
              <div className="text-xs text-blue-400">{stats.inProgressPercent}%</div>
            </div>
            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-300">Concluído</div>
              <div className="text-xs text-green-400">{stats.completedPercent}%</div>
            </div>
          </div>

          {/* Analysis Title */}
          <div className="text-right">
            <h2 className="text-xl font-bold text-white">Análise de Desempenho</h2>
            <p className="text-sm text-gray-400">Status das Atividades</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
