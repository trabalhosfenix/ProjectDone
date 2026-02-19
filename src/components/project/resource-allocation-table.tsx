'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ResourceAllocationTableProps {
  items: any[]
  members: any[]
}

export function ResourceAllocationTable({ items, members }: ResourceAllocationTableProps) {
  
  // Helper to find the member's role based on the responsible name in the task
  const findMemberRole = (responsibleName: string | null) => {
    if (!responsibleName) return '-'
    
    // Normalize string for comparison (remove accents, lowercase)
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    const target = normalize(responsibleName)

    const member = members.find(m => {
        const memberName = normalize(m.user.name || '')
        return memberName === target || memberName.includes(target) || target.includes(memberName)
    })

    // Return the "Job Title" (Cargo) from the User profile, or the Project Role if Job Title is missing
    return member?.user.jobTitle || member?.role || 'Não Def.'
  }

  // Filter only leaf tasks (not groups) that have dates
  // Or maybe show all? The image shows "Gerente de Projetos", "Desenha", etc. so likely leaf tasks.
  // We will show all items for now.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocação de Recursos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Recurso (Função)</TableHead>
              <TableHead className="w-[200px]">Nome</TableHead>
              <TableHead className="w-[150px]">Estado</TableHead>
              <TableHead className="w-[120px]">Data de Início</TableHead>
              <TableHead className="w-[120px]">Data Final</TableHead>
              <TableHead className="w-[100px]">Duração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhuma atividade encontrada neste cronograma.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-blue-700">
                    {findMemberRole(item.responsible)}
                  </TableCell>
                  <TableCell>
                    {item.responsible || 'Sem responsável'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.datePlanned ? new Date(item.datePlanned).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {item.datePlannedEnd ? new Date(item.datePlannedEnd).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {item.duration ? `${item.duration} dias` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return <span className="text-gray-400">-</span>
    
    let colorClass = 'bg-gray-100 text-gray-800'
    const s = status.toLowerCase()

    if (s.includes('conclu') || s.includes('complet')) colorClass = 'bg-green-100 text-green-800'
    else if (s.includes('andamento') || s.includes('progresso')) colorClass = 'bg-blue-100 text-blue-800'
    else if (s.includes('atras')) colorClass = 'bg-red-100 text-red-800'
    else if (s.includes('espera') || s.includes('aguard')) colorClass = 'bg-yellow-100 text-yellow-800'

    return (
        <Badge variant="outline" className={`${colorClass} border-none`}>
            {status}
        </Badge>
    )
}
