'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, AlertCircle, XCircle, Clock, Target, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface TestDashboardProps {
  stats: {
    total: number
    completed: number
    pending: number
    blocked: number
    failed: number
    medical: number // % Saude
    byResponsible: Record<string, { total: number, completed: number, percentage: number }>
    byStatus: Record<string, number>
    chartData: Array<{ date: string, concluido: number, meta: number }>
    dailyTable: Array<{ date: string, completed: number, accumulated: number, meta: number, saldo: number }>
    targetDate: string
    businessDaysRemaining: number
    metaPerDay: number
  }
}

export function TestDashboard({ stats }: TestDashboardProps) {

  // Prepare Responsible Data
  const respData = Object.entries(stats.byResponsible || {})
    .map(([name, data]) => ({ name, total: data.total, completed: data.completed, percentage: data.percentage }))
    .sort((a, b) => b.total - a.total)

  // Prepare Status Data
  const statusData = Object.entries(stats.byStatus || {}).map(([name, value]) => ({ name, value }))
    
  return (
    <div className="space-y-6">
       
       {/* KPI Cards - Top Row */}
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
             <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Geral</p>
             </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">Concluídos</p>
             </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
             </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.blocked}</div>
                <p className="text-xs text-muted-foreground mt-1">Bloqueados</p>
             </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">Falharam</p>
             </CardContent>
          </Card>
          <Card className="bg-blue-50">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.medical}%</div>
                <p className="text-xs text-muted-foreground mt-1">Saúde do Projeto</p>
             </CardContent>
          </Card>
       </div>

       {/* Main Content: Chart + Meta do Dia */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline Chart - 2/3 */}
          <Card className="lg:col-span-2">
             <CardHeader>
                <CardTitle>Outbound - Testes Homologados</CardTitle>
                <CardDescription>Evolução de testes concluídos vs meta planejada</CardDescription>
             </CardHeader>
             <CardContent className="h-[350px]">
                {stats.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={11} tickFormatter={val => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                            <YAxis fontSize={12} />
                            <Tooltip labelFormatter={val => new Date(val).toLocaleDateString('pt-BR')} />
                            <Legend />
                            <Line type="monotone" dataKey="concluido" name="Concluído" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="meta" name="Meta" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Insuficiente dados para o gráfico
                    </div>
                )}
             </CardContent>
          </Card>

          {/* Meta do Dia Card - 1/3 */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Target className="w-5 h-5 text-orange-600" />
                   Meta do Dia
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                   <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Expectativa conclusão</p>
                   <p className="text-lg font-bold text-gray-800">{new Date(stats.targetDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                   <p className="text-xs text-gray-500">Dias úteis até conclusão</p>
                   <p className="text-2xl font-bold text-orange-600">{stats.businessDaysRemaining}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                   <p className="text-xs text-gray-500">Testes Pendentes</p>
                   <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg shadow-sm border border-orange-300">
                   <p className="text-xs text-orange-700 font-semibold">Meta para o dia</p>
                   <p className="text-3xl font-bold text-orange-700">{stats.metaPerDay}</p>
                </div>
             </CardContent>
          </Card>

       </div>

       {/* Responsible Table */}
       <Card>
          <CardHeader>
             <CardTitle>Status por Responsável</CardTitle>
             <CardDescription>Quantidade de testes e % concluído por Keyuser</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead className="w-[200px]">Responsável</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Concluídos</TableHead>
                      <TableHead className="text-center">%</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {respData.slice(0, 15).map((row, idx) => (
                      <TableRow key={idx}>
                         <TableCell className="font-medium">{row.name}</TableCell>
                         <TableCell className="text-center">{row.total}</TableCell>
                         <TableCell className="text-center text-green-600">{row.completed}</TableCell>
                         <TableCell className="text-center">
                            <Badge variant={row.percentage >= 80 ? 'default' : row.percentage >= 50 ? 'secondary' : 'outline'}>
                               {row.percentage}%
                            </Badge>
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </CardContent>
       </Card>

       {/* Daily Breakdown Table */}
       <Card>
          <CardHeader>
             <CardTitle>Evolução Diária</CardTitle>
             <CardDescription>Detalhamento por data: Concluídos, Meta e Saldo</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Concluído/Dia</TableHead>
                      <TableHead className="text-center">Acumulado</TableHead>
                      <TableHead className="text-center">Meta</TableHead>
                      <TableHead className="text-center">Saldo</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {stats.dailyTable.map((row, idx) => (
                      <TableRow key={idx}>
                         <TableCell>{new Date(row.date).toLocaleDateString('pt-BR')}</TableCell>
                         <TableCell className="text-center">{row.completed}</TableCell>
                         <TableCell className="text-center font-medium">{row.accumulated}</TableCell>
                         <TableCell className="text-center text-orange-600">{row.meta}</TableCell>
                         <TableCell className={`text-center font-bold ${row.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.saldo >= 0 ? '+' : ''}{row.saldo}
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </CardContent>
       </Card>

       {/* Status Detail */}
        <Card>
            <CardHeader>
                <CardTitle>Detalhamento por Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statusData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="font-medium text-sm">{item.name}</span>
                            <Badge variant="secondary">{item.value}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

    </div>
  )
}
