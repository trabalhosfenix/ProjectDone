'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { batchReplaceResource, getProjectResources } from '@/app/actions/batch-operations'

export default function SubstituicaoPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  
  const [resources, setResources] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [selectedOld, setSelectedOld] = useState('')
  const [newResourceName, setNewResourceName] = useState('')

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    setLoading(true)
    const res = await getProjectResources(projectId)
    if (res.success && res.data) {
      setResources(res.data)
    }
    setLoading(false)
  }

  const handleReplace = async () => {
    if (!selectedOld || !newResourceName) {
      toast.error('Selecione o recurso atual e o novo nome')
      return
    }

    setSubmitting(true)
    try {
      const result = await batchReplaceResource(projectId, selectedOld, newResourceName)
      
      if (result.success) {
        toast.success(result.message)
        setNewResourceName('')
        setSelectedOld('')
        // Recarregar lista para ver se o antigo sumiu (pode não sumir se tiver histórico, mas vamos atualizar)
        loadResources()
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error('Erro ao processar substituição')
    }
    setSubmitting(false)
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Substituição de Recursos
          </h1>
          <p className="text-gray-500">
            Ferramenta para transferir responsabilidades em massa. Substitui o responsável em todas as tarefas associadas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Realizar Substituição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              
              <div className="space-y-2">
                <Label>Recurso Atual (De)</Label>
                <Select value={selectedOld} onValueChange={setSelectedOld} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Carregando..." : "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                    {resources.length === 0 && !loading && (
                      <div className="p-2 text-sm text-gray-500 text-center">Nenhum recurso encontrado</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center pb-3">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <div className="space-y-2">
                <Label>Novo Recurso (Para)</Label>
                <Input 
                  placeholder="Nome do novo responsável" 
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                />
              </div>

            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
              <p className="font-semibold mb-1">Atenção:</p>
              <p>Esta ação irá atualizar imediatamente todas as tarefas onde <strong>{selectedOld || '...'}</strong> é o responsável principal. A ação não pode ser desfeita facilmente.</p>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleReplace} 
                disabled={submitting || !selectedOld || !newResourceName}
                className="w-full sm:w-auto"
              >
                {submitting ? 'Processando...' : 'Confirmar Substituição'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Recursos Atuais */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recursos Ativos no Projeto</h3>
          <div className="bg-white rounded-lg border p-4">
            {resources.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resources.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {r.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum recurso alocado nas tarefas ainda.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
