'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Save, ArrowLeft, Plus, Calendar as CalendarIcon, Settings, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { createCalendar, updateCalendar, addHoliday, deleteHoliday } from '@/app/actions/calendars'
import Link from 'next/link'
import { YearCalendar } from '@/components/settings/year-calendar'
import { isSameDay } from 'date-fns'

interface CalendarEditorProps {
  initialData: any
  isNew: boolean
}

export function CalendarEditor({ initialData, isNew }: CalendarEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'BUSINESS_DAYS',
    workHoursPerDay: initialData?.workHoursPerDay || 8.0,
    isDefault: initialData?.isDefault || false
  })

  // Feriados (apenas se não for novo ou já salvo)
  const [holidays, setHolidays] = useState<any[]>(initialData?.holidays || [])

  const handleSave = async () => {
    if (!data.name) return toast.error('Nome é obrigatório')
    
    setLoading(true)
    try {
      if (isNew) {
        const res = await createCalendar({
            name: data.name,
            description: data.description,
            type: data.type,
            workHoursPerDay: Number(data.workHoursPerDay)
        })
        if (res.success) {
          toast.success('Calendário criado!')
          router.push(`/dashboard/sistema/calendarios/${res.data.id}`)
        } else {
          toast.error('Erro ao criar')
        }
      } else {
        const res = await updateCalendar(initialData.id, {
            ...data,
            workHoursPerDay: Number(data.workHoursPerDay)
        })
        if (res.success) {
          toast.success('Calendário atualizado!')
          router.refresh()
        } else {
          toast.error('Erro ao atualizar')
        }
      }
    } catch (error) {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = async (date: Date) => {
      if (isNew) {
          toast.error('Salve o calendário antes de adicionar exceções.')
          return
      }

      // Verificar se já existe (remover) ou não (adicionar)
      const existing = holidays.find(h => isSameDay(new Date(h.date), date))
      
      if (existing) {
          try {
              const res = await deleteHoliday(existing.id)
              if (res.success) {
                  setHolidays(holidays.filter(h => h.id !== existing.id))
                  toast.success('Exceção removida')
              }
          } catch (e) { toast.error('Erro ao remover') }
      } else {
          try {
              const res = await addHoliday(initialData.id, {
                  name: 'Exceção Manual',
                  date: date
              })
              if (res.success) {
                  setHolidays([...holidays, res.data])
                  toast.success('Exceção adicionada')
              }
          } catch (e) { toast.error('Erro ao adicionar') }
      }
  }
  
  const handleDeleteHoliday = async (id: string) => {
     try {
         const res = await deleteHoliday(id)
         if (res.success) {
             setHolidays(holidays.filter(h => h.id !== id))
             toast.success('Removido')
         }
     } catch(e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sistema/calendarios">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{isNew ? 'Novo Modelo' : data.name}</h1>
            <p className="text-sm text-gray-500">{isNew ? 'Criando novo calendário' : 'Editando configurações de calendário'}</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="datas" className="space-y-4">
        <TabsList>
            <TabsTrigger value="geral" className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="datas" className="flex items-center gap-2">
                 <CalendarDays className="w-4 h-4" /> Datas e Exceções
            </TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid gap-2">
                <Label>Nome do Calendário</Label>
                <Input 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={data.type} 
                    onValueChange={v => setData({...data, type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSINESS_DAYS">Dias Úteis (Seg-Sex)</SelectItem>
                      <SelectItem value="RUNNING_DAYS">Dias Corridos (Seg-Dom)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Horas/Dia</Label>
                  <Input 
                    type="number" 
                    step="0.5"
                    value={data.workHoursPerDay} 
                    onChange={e => setData({...data, workHoursPerDay: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={data.description} 
                  onChange={e => setData({...data, description: e.target.value})} 
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="default-mode" 
                  checked={data.isDefault}
                  onCheckedChange={c => setData({...data, isDefault: c})}
                />
                <Label htmlFor="default-mode">Definir como Padrão</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datas">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                 {/* Visual Calendar */}
                 <div className="xl:col-span-3">
                     {isNew ? (
                         <div className="bg-yellow-50 p-8 text-center border border-yellow-200 rounded text-yellow-800">
                             Salve o calendário primeiro para gerenciar datas.
                         </div>
                     ) : (
                         <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Visualização Anual</h3>
                                <div className="flex gap-4 text-xs">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200"></div> Exceção/Feriado</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 border border-gray-200"></div> Fim de Semana</div>
                                </div>
                             </div>
                             <YearCalendar 
                                holidays={holidays.map(h => new Date(h.date))}
                                onDateClick={handleDateClick}
                                type={data.type as any}
                             />
                         </div>
                     )}
                 </div>

                 {/* Lista de Exceções */}
                 <div className="space-y-4">
                     <Card>
                         <CardHeader className="py-3 px-4">
                             <CardTitle className="text-base font-semibold">Exceções Cadastradas</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead className="w-[100px]">Data</TableHead>
                                         <TableHead>Nome</TableHead>
                                         <TableHead className="w-[40px]"></TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {holidays.length === 0 ? (
                                         <TableRow>
                                             <TableCell colSpan={3} className="text-center text-xs text-gray-500 py-4">Nenhuma exceção.</TableCell>
                                         </TableRow>
                                     ) : (
                                         holidays
                                          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                          .map(h => (
                                             <TableRow key={h.id}>
                                                 <TableCell className="text-xs font-medium">
                                                     {new Date(h.date).toLocaleDateString('pt-BR')}
                                                 </TableCell>
                                                 <TableCell className="text-xs text-gray-600 truncate max-w-[100px]">
                                                     {h.name}
                                                 </TableCell>
                                                 <TableCell>
                                                     <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-red-500"
                                                        onClick={() => handleDeleteHoliday(h.id)}
                                                     >
                                                         <Trash2 className="w-3 h-3" />
                                                     </Button>
                                                 </TableCell>
                                             </TableRow>
                                         ))
                                     )}
                                 </TableBody>
                             </Table>
                         </CardContent>
                     </Card>
                 </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
