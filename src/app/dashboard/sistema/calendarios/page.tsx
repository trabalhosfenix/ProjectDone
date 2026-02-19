import { getCalendars } from '@/app/actions/calendars'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Plus, Clock, Info } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarsPage() {
  const { data: calendars } = await getCalendars()

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Calendários de Projeto</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie os modelos de calendário, jornadas de trabalho e feriados.
          </p>
        </div>
        <Link href="/dashboard/sistema/calendarios/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Calendário
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Lista de Calendários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!calendars || calendars.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum calendário cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Jornada (Horas/Dia)</TableHead>
                  <TableHead>Feriados Cadastrados</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendars.map((cal) => (
                  <TableRow key={cal.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{cal.name}</span>
                        {cal.description && (
                          <span className="text-xs text-muted-foreground">{cal.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        cal.type === 'BUSINESS_DAYS' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {cal.type === 'BUSINESS_DAYS' ? 'Dias Úteis (Seg-Sex)' : 'Dias Corridos'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        {cal.workHoursPerDay}h
                      </div>
                    </TableCell>
                    <TableCell>
                       {cal._count.holidays} feriados
                    </TableCell>
                    <TableCell>
                      {cal.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Padrão
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/sistema/calendarios/${cal.id}`}>
                        <Button variant="ghost" size="sm">
                          Gerenciar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div>
           <p className="font-semibold mb-1">Como funciona o cálculo de duração?</p>
           <p>
             O sistema usa o calendário associado ao projeto para calcular a data de término (Fim) com base na data de Início e Duração (dias).
             <br/>
             - <strong>Dias Úteis:</strong> Ignora Sábados, Domingos e os Feriados cadastrados no calendário.
             <br/>
             - <strong>Dias Corridos:</strong> Conta todos os dias, ignorando apenas os limites de horas se configurado.
           </p>
        </div>
      </div>
    </div>
  )
}
