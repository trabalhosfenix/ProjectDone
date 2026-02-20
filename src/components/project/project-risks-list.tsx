/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertTriangle, Edit } from 'lucide-react'
import { deleteProjectRisk } from '@/app/actions/project-risks'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProjectRisksListProps {
  projectId: string
  risks: any[]
  dashboard?: {
    total?: number
    byLevel?: { Crítico: number; Alto: number; Médio: number; Baixo: number }
    byStatus?: Record<string, number>
  }
}

export function ProjectRisksList({ projectId, risks, dashboard }: ProjectRisksListProps) {
  const handleDelete = async (riskId: string) => {
    if (confirm('Excluir este risco?')) {
      const result = await deleteProjectRisk(riskId, projectId)
      if (result.success) toast.success(result.message)
      else toast.error(result.error)
    }
  }

  const getSeverityColor = (sev: number) => {
    if (sev >= 15) return 'bg-red-500 hover:bg-red-600'
    if (sev >= 10) return 'bg-orange-500 hover:bg-orange-600'
    if (sev >= 5) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-green-500 hover:bg-green-600'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Riscos Totais</p>
            <p className="text-2xl font-bold">{dashboard?.total ?? risks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Críticos</p>
            <p className="text-2xl font-bold text-red-600">{dashboard?.byLevel?.Crítico ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Altos</p>
            <p className="text-2xl font-bold text-orange-600">{dashboard?.byLevel?.Alto ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Médios</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboard?.byLevel?.Médio ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Baixos</p>
            <p className="text-2xl font-bold text-green-600">{dashboard?.byLevel?.Baixo ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projetos/${projectId}/riscos/importar`}>Importar Riscos</Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/projetos/${projectId}/riscos/novo`}>Novo Risco</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Matriz de Riscos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prob. x Impacto</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum risco identificado.
                  </TableCell>
                </TableRow>
              ) : (
                risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">
                      {risk.description}
                      <span className="block text-xs text-muted-foreground mt-1">{risk.category}</span>
                    </TableCell>
                    <TableCell>{risk.type}</TableCell>
                    <TableCell>
                      {risk.probability} x {risk.impact}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-semibold">{risk.responseStrategy}</span>
                        {risk.responsePlan && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]" title={risk.responsePlan}>
                            {risk.responsePlan}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{risk.owner || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/projetos/${projectId}/riscos/${risk.id}/editar`}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(risk.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
