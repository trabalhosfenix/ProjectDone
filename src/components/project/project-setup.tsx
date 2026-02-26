'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileSpreadsheet,
  ListTodo,
  Upload,
  Loader2,
  ArrowRight,
  Download,
  ArrowLeft,
  FileCode,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { importProjectExcel } from '@/app/actions/import-project'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProjectSetupProps {
  projectId: string
  projectName?: string
}

type ImportStatus = 'idle' | 'processing' | 'completed' | 'error'

function extractProjectId(payload: Record<string, unknown>) {
  const direct = payload.project_id || payload.projectId
  if (direct) return String(direct)

  const nested = payload.result || payload.data
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>
    const nestedId = nestedRecord.project_id || nestedRecord.projectId
    if (nestedId) return String(nestedId)
  }

  return undefined
}

function normalizeStatus(value: unknown): ImportStatus {
  const status = String(value || '').toLowerCase()
  if (['completed', 'success', 'done', 'finished'].includes(status)) return 'completed'
  if (['failed', 'error', 'canceled'].includes(status)) return 'error'
  if (['processing', 'running', 'in_progress', 'queued', 'pending'].includes(status)) return 'processing'
  return 'processing'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ProjectSetup({ projectId, projectName }: ProjectSetupProps) {
  const router = useRouter()

  const [isImporting, setIsImporting] = useState(false)
  const [isImportingMSP, setIsImportingMSP] = useState(false)
  const [mspMessage, setMspMessage] = useState('')
  const [mspProgress, setMspProgress] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mspFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    try {
      const result = await importProjectExcel(formData)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao importar')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro inesperado')
    } finally {
      setIsImporting(false)
    }
  }

  const handleMSPFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['mpp', 'mpx', 'xml', 'mpt']
    if (!validExts.includes(ext || '')) {
      toast.error('Formato não suportado. Use .mpp, .mpx, .xml ou .mpt')
      return
    }

    const toastId = `mpp-import-${projectId}`
    setIsImportingMSP(true)
    setMspProgress(0)
    setMspMessage('Enviando arquivo para processamento...')
    toast.loading('Importando arquivo MPP...', { id: toastId })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await fetch('/api/mpp/import-mpp', {
        method: 'POST',
        body: formData,
      })
      const startResult = await response.json()

      if (!response.ok || !startResult.job_id) {
        throw new Error(startResult.error || 'Erro ao iniciar importação do MS Project')
      }

      const jobId = String(startResult.job_id)
      let mppProjectId = extractProjectId(startResult as Record<string, unknown>)
      const timeoutAt = Date.now() + 10 * 60_000

      setMspMessage('Arquivo recebido. Processando importação...')
      toast.loading('Arquivo recebido. Processando importação...', { id: toastId })

      while (Date.now() < timeoutAt) {
        const jobResponse = await fetch(`/api/mpp/jobs/${jobId}`, { cache: 'no-store' })
        const jobData = await jobResponse.json()
        const status = normalizeStatus(jobData.status)

        const nextProgress = Number(jobData.progress || jobData.percent || 0)
        setMspProgress(Number.isFinite(nextProgress) ? nextProgress : null)
        setMspMessage(jobData.message || 'Processando arquivo MPP...')

        const jobProjectId = extractProjectId(jobData as Record<string, unknown>)
        if (jobProjectId) {
          mppProjectId = jobProjectId
        }

        if (status === 'completed') {
          if (!mppProjectId) {
            throw new Error('Importação concluída sem identificar o projeto MPP')
          }

          setMspMessage('Importação concluída. Sincronizando tarefas no projeto...')
          toast.loading('Importação concluída. Sincronizando tarefas...', { id: toastId })

          const syncResponse = await fetch('/api/mpp/sync-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mppProjectId,
              localProjectId: projectId,
              syncMode: 'upsert',
              projectNameHint: file.name,
            }),
          })

          const syncResult = await syncResponse.json()
          if (!syncResponse.ok || !syncResult.success) {
            throw new Error(syncResult.error || 'Falha ao sincronizar tarefas importadas')
          }

          const importedTasks = Number(syncResult.importedTasks || syncResult.createdTasks || 0)
          setMspProgress(100)
          setMspMessage('Concluído. Redirecionando para o cronograma...')
          toast.success(`Importação concluída: ${importedTasks} tarefas sincronizadas.`, { id: toastId })

          router.push(`/dashboard/projetos/${projectId}/cronograma`)
          return
        }

        if (status === 'error') {
          throw new Error(jobData.error || 'Falha ao processar arquivo .MPP')
        }

        await sleep(1500)
      }

      throw new Error('Tempo de processamento excedido. Tente novamente em instantes.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de integração com MPP Platform API'
      setMspMessage(message)
      toast.error(message, { id: toastId })
    } finally {
      setIsImportingMSP(false)
    }
  }

  const triggerFileUpload = () => fileInputRef.current?.click()
  const triggerMSPFileUpload = () => mspFileInputRef.current?.click()

  const handleManualCreate = () => {
    toast.info('Modo manual ativado. Você pode adicionar tarefas pelo Kanban ou Lista.')
    router.push(`/dashboard/projetos/${projectId}/kanban`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl w-full space-y-8 relative">
        <div className="flex items-center gap-4 pb-4 border-b">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
          </Link>
          {/* <div>
            <h1 className="text-2xl font-bold text-gray-900">{projectName || 'Configurar Projeto'}</h1>
            <p className="text-gray-500 text-sm">ID: {projectId}</p>
          </div> */}
        </div>

        <div className="text-center pt-4">
          <h1 className="text-3xl font-bold text-gray-900">Como deseja iniciar?</h1>
          <p className="text-gray-500 mt-2 text-lg">Escolha a melhor forma para importar ou criar seu cronograma</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-100 cursor-pointer group relative overflow-hidden flex flex-col"
            onClick={triggerFileUpload}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isImporting}
            />
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Importar Excel</CardTitle>
              <CardDescription>Use um arquivo Excel (.xlsx) para carregar tarefas automaticamente.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Importação rápida
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Preserva datas e responsáveis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <a
                    href="/templates/Modelo_Cronograma.xlsx"
                    download
                    className="text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                    target="_blank"
                  >
                    Modelo padrão
                    <Download className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" variant="outline" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Excel
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card
            className={`hover:shadow-lg transition-shadow border-2 relative overflow-hidden flex flex-col ${
              isImportingMSP ? 'border-purple-300 bg-purple-50/30' : 'border-transparent hover:border-purple-100 cursor-pointer'
            }`}
            onClick={!isImportingMSP ? triggerMSPFileUpload : undefined}
          >
            <input
              type="file"
              accept=".mpp,.mpx,.xml,.mpt"
              className="hidden"
              ref={mspFileInputRef}
              onChange={handleMSPFileUpload}
              disabled={isImportingMSP}
            />

            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-1 rounded-full">NOVO</span>
            </div>

            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Importar MS Project</CardTitle>
              <CardDescription>Importe diretamente do Microsoft Project (.mpp, .xml).</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Suporta .mpp, .xml, .mpx
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Importa dependências e WBS
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Calendários customizados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Baselines e caminho crítico
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <Clock className="w-3 h-3" />
                  Arquivos grandes podem levar alguns minutos
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" variant={isImportingMSP ? 'default' : 'outline'} disabled={isImportingMSP}>
                {isImportingMSP ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mspMessage || 'Importando...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar .mpp
                  </>
                )}
              </Button>
              {isImportingMSP && (
                <p className="text-xs text-center text-gray-500 w-full">
                  {mspMessage}
                  {typeof mspProgress === 'number' ? ` (${mspProgress}%)` : ''}
                </p>
              )}
            </CardFooter>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100 cursor-pointer group"
            onClick={handleManualCreate}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ListTodo className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Criar Manualmente</CardTitle>
              <CardDescription>Comece do zero e adicione tarefas no quadro Kanban.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Controle total
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Ideal para projetos ágeis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Colunas personalizáveis
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Ir para o Projeto
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-400 pt-8">
          <p>Após a importação, você será direcionado ao cronograma com as tarefas importadas.</p>
        </div>
      </div>
    </div>
  )
}
