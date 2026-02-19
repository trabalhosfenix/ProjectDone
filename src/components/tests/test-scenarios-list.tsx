'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
    Search, Plus, Upload, Trash2, Edit, FileSpreadsheet, 
    ChevronDown, ChevronUp, MoreHorizontal 
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteTestScenario, importTestScenarios } from '@/app/actions/project-tests'
import { TestScenarioForm } from './test-scenario-form'

interface TestScenariosListProps {
  projectId: string
  scenarios: any[]
}

export function TestScenariosList({ projectId, scenarios }: TestScenariosListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredScenarios = scenarios.filter(s => 
     s.scenario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     s.externalId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (scenario: any) => {
      setEditingScenario(scenario)
      setIsFormOpen(true)
  }

  const handleCreate = () => {
      setEditingScenario(null)
      setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
      if (confirm('Tem certeza que deseja excluir este cenário?')) {
          const result = await deleteTestScenario(id, projectId)
          if (result.success) toast.success('Cenário excluído')
          else toast.error('Erro ao excluir')
      }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)
      
      setIsUploading(true)
      const promise = importTestScenarios(projectId, formData)
      
      toast.promise(promise, {
          loading: 'Importando planilhas...',
          success: (data) => {
             setIsUploading(false)
             if (data.success) return data.message
             throw new Error(data.error)
          },
          error: (err) => {
             setIsUploading(false)
             return err.message || 'Erro na importação'
          }
      })
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getStatusBadge = (status: string) => {
      const map: Record<string, string> = {
          'Concluído': 'bg-green-500',
          'Sucesso': 'bg-green-500',
          'Passou': 'bg-green-500', 
          'Keyuser - Concluído': 'bg-green-500 hover:bg-green-600', // Excel example
          'Falhou': 'bg-red-500',
          'Erro': 'bg-red-500',
          'Bloqueado': 'bg-yellow-500 text-black',
          'Impedimento': 'bg-yellow-500 text-black',
          'Não liberado para testes': 'bg-gray-300 text-gray-800',
          'Não iniciado': 'bg-gray-400',
          'Em andamento': 'bg-blue-500'
      }
      return <Badge className={`${map[status] || 'bg-gray-500'} whitespace-nowrap`}>{status}</Badge>
  }

  return (
    <div className="space-y-4">
       {/* Actions Bar */}
       <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
             <Input 
                placeholder="Buscar cenários..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" asChild>
                <a href="/templates/Modelo_Importacao_PlanoTestes.xlsx" download>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Baixar Modelo
                </a>
             </Button>
             <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
             />
             <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Importando...' : 'Importar Excel'}
             </Button>
             <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cenário
             </Button>
          </div>
       </div>

       {/* Table */}
       <div className="rounded-md border bg-white overflow-hidden">
          <Table>
             <TableHeader>
                <TableRow className="bg-gray-50/50">
                   <TableHead className="w-[100px]">ID</TableHead>
                   <TableHead>Cenário</TableHead>
                   <TableHead>Tarefa</TableHead>
                   <TableHead>Responsável</TableHead>
                   <TableHead>Doc BEO</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {filteredScenarios.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Nenhum cenário encontrado.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredScenarios.map((scenario) => (
                        <TableRow key={scenario.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-xs text-gray-600">{scenario.externalId || '-'}</TableCell>
                            <TableCell>
                                <div className="font-medium text-sm">{scenario.scenario}</div>
                                {scenario.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">{scenario.description}</div>}
                            </TableCell>
                            <TableCell className="text-sm">{scenario.task}</TableCell>
                            <TableCell className="text-sm">{scenario.responsible}</TableCell>
                            <TableCell className="text-sm">{scenario.docBeo}</TableCell>
                            <TableCell>{getStatusBadge(scenario.status)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(scenario)}>
                                        <Edit className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(scenario.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
             </TableBody>
          </Table>
       </div>
       
       <div className="text-xs text-gray-500 text-right">
          Total: {filteredScenarios.length} cenários
       </div>

       {isFormOpen && (
           <TestScenarioForm 
              projectId={projectId}
              scenario={editingScenario}
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSuccess={() => {}}
           />
       )}
    </div>
  )
}
