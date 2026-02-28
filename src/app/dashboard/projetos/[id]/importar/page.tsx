'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileCode, Upload, Loader2 } from 'lucide-react'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportProjectToExcel, exportProjectToMSProject } from '@/lib/project-exporter'
import { Progress } from '@/components/ui/progress'
import { ProjectPageHeader } from '@/components/project/project-page-header'

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
type ImportPhase = 'mpp_upload' | 'mpp_processing' | 'local_sync'

function getProjectNameHintFromFileName(fileName: string): string | undefined {
  if (!fileName) return undefined
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '')
  const normalized = withoutExtension.replace(/\s+/g, ' ').trim()
  return normalized || undefined
}

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
  if (['completed', 'success', 'done', 'finished', 'synced'].includes(status)) return 'completed'
  if (['failed', 'error', 'canceled'].includes(status)) return 'error'
  if (['processing', 'running', 'in_progress', 'queued', 'pending'].includes(status)) return 'processing'
  return 'processing'
}

function mapProgressByPhase(phase: ImportPhase, value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
  if (phase === 'mpp_upload') return Math.max(5, Math.min(20, safe))
  if (phase === 'mpp_processing') return Math.max(20, Math.min(75, Math.round(20 + safe * 0.55)))
  return Math.max(75, Math.min(100, Math.round(75 + safe * 0.25)))
}

export default function ImportarPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const router = useRouter()

  const mode = searchParams.get('mode') || 'import'

  const [status, setStatus] = useState<ImportStatus>('idle')
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [resolvedMppProjectId, setResolvedMppProjectId] = useState<string | null>(null)
  const [syncMode, setSyncMode] = useState<'append' | 'upsert' | 'replace'>('upsert')
  const [phase, setPhase] = useState<ImportPhase>('mpp_upload')
  const fileRef = useRef<HTMLInputElement>(null)

  const persistMppLink = (legacyProjectId: string, mppProjectId: string) => {
    try {
      const current = JSON.parse(sessionStorage.getItem('mppProjectMap') || '{}')
      current[legacyProjectId] = mppProjectId
      sessionStorage.setItem('mppProjectMap', JSON.stringify(current))
    } catch {
      // noop
    }
  }

  const activeTab = useMemo(() => {
    const type = searchParams.get('type') || 'excel'
    if (mode === 'export') return type === 'msproject' ? 'export-msproject' : 'export-excel'
    return 'import-mpp'
  }, [mode, searchParams])

  const handleTabChange = (value: string) => {
    if (value === 'import-mpp') {
      router.replace(`/dashboard/projetos/${projectId}/importar?type=msproject&mode=import`)
      return
    }

    if (value === 'export-excel') {
      router.replace(`/dashboard/projetos/${projectId}/importar?type=excel&mode=export`)
      return
    }

    router.replace(`/dashboard/projetos/${projectId}/importar?type=msproject&mode=export`)
  }

  const handleExport = async (format: 'excel' | 'msproject') => {
    toast.info('Iniciando exportação...')
    try {
      const success = format === 'excel'
        ? await exportProjectToExcel(projectId, 'Projeto_Exportado')
        : await exportProjectToMSProject(projectId, 'Projeto_Exportado')

      if (success) toast.success('Arquivo baixado com sucesso!')
      else toast.error('Falha na exportação')
    } catch {
      toast.error('Erro ao exportar')
    }
  }

  const pollSyncJob = async (syncJobId: string, targetMppProjectId: string) => {
    const timeoutAt = Date.now() + 20 * 60_000

    while (Date.now() < timeoutAt) {
      const response = await fetch(`/api/projects/imports/${syncJobId}`, { cache: 'no-store' })
      const data = await response.json()

      const nextStatus = normalizeStatus(data.status)
      const nextProgress = Number(data.progress || 0)

      setStatus(nextStatus)
      setProgress(mapProgressByPhase('local_sync', nextProgress))
      setMessage(data.message || 'Sincronizando dados no projeto local...')

      if (nextStatus === 'completed') {
        toast.success('Importação e sincronização concluídas com sucesso!')
        const localProjectId = String(data.projectId || projectId)
        router.push(`/dashboard/projetos/${localProjectId}/gantt?mppProjectId=${targetMppProjectId}`)
        return
      }

      if (nextStatus === 'error') {
        toast.error(data.error || data.message || 'Falha ao sincronizar projeto importado com base local')
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    setStatus('error')
    setMessage('Tempo limite da sincronização excedido.')
    toast.error('Tempo limite da sincronização excedido')
  }

  const pollJob = async (id: string) => {
    const timeoutAt = Date.now() + 10 * 60_000

    while (Date.now() < timeoutAt) {
      const response = await fetch(`/api/mpp/jobs/${id}`, { cache: 'no-store' })
      const data = await response.json()
      const nextStatus = normalizeStatus(data.status)
      const nextProgress = Number(data.progress || data.percent || 0)
      setStatus(nextStatus)
      setProgress(mapProgressByPhase('mpp_processing', nextProgress))
      setMessage(data.message || data.error || '')

      const extractedProjectId = extractProjectId(data as Record<string, unknown>)
      if (extractedProjectId) {
        setResolvedMppProjectId(String(extractedProjectId))
        persistMppLink(projectId, String(extractedProjectId))
      }

      if (nextStatus === 'completed') {
        setPhase('local_sync')
        setStatus('processing')
        setProgress(mapProgressByPhase('local_sync', 5))
        setMessage('Arquivo importado. Iniciando sincronização das tarefas no projeto local...')

        const targetMppProjectId = extractedProjectId || resolvedMppProjectId || projectId
        const syncResponse = await fetch('/api/mpp/sync-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mppProjectId: targetMppProjectId,
            localProjectId: projectId,
            syncMode,
            projectNameHint: getProjectNameHintFromFileName(fileName),
          }),
        })
        const syncResult = await syncResponse.json()

        if (!syncResponse.ok || !syncResult.success || !syncResult.syncJobId) {
          toast.error(syncResult.error || 'Falha ao iniciar sincronização do projeto importado')
          setStatus('error')
          setMessage(syncResult.error || 'Falha ao iniciar sincronização')
          return
        }

        await pollSyncJob(String(syncResult.syncJobId), String(syncResult.mppProjectId || targetMppProjectId))
        return
      }

      if (nextStatus === 'error') {
        toast.error(data.error || 'Falha ao processar arquivo')
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    setStatus('error')
    setMessage('Tempo limite de processamento excedido.')
  }

  const handleMppUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['mpp', 'mpx', 'xml', 'mpt'].includes(ext)) {
      toast.error('Formato inválido. Use .mpp, .mpx, .xml ou .mpt')
      return
    }

    setFileName(file.name)

    try {
      setPhase('mpp_upload')
      setStatus('uploading')
      setProgress(mapProgressByPhase('mpp_upload', 10))
      setMessage('Enviando arquivo para processamento...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await fetch('/api/mpp/import-mpp', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok || !data.job_id) {
        throw new Error(data.error || 'Falha ao iniciar importação')
      }

      setJobId(String(data.job_id || data.jobId))
      const extractedProjectId = extractProjectId(data as Record<string, unknown>)
      if (extractedProjectId) {
        setResolvedMppProjectId(String(extractedProjectId))
        persistMppLink(projectId, String(extractedProjectId))
      }

      setPhase('mpp_processing')
      setStatus('processing')
      setProgress(mapProgressByPhase('mpp_processing', 5))
      setMessage('Processando arquivo no backend...')
      await pollJob(String(data.job_id || data.jobId))
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erro de integração')
      toast.error(error instanceof Error ? error.message : 'Erro de integração')
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader
          title="Importar / Exportar Projeto"
          description="Fluxo unificado de importação MPP e exportações do cronograma."
          projectId={projectId}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="import-mpp" className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Importar MPP
            </TabsTrigger>
            <TabsTrigger value="export-excel" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
            </TabsTrigger>
            <TabsTrigger value="export-msproject" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" /> Exportar Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import-mpp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" /> Importação Microsoft Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".mpp,.mpx,.xml,.mpt"
                  onChange={handleMppUpload}
                />

                <p className="text-sm text-gray-600">
                  Envie o arquivo para processamento assíncrono. O status do job será exibido nesta tela.
                </p>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Estratégia de merge</label>
                  <select
                    value={syncMode}
                    onChange={(e) => setSyncMode(e.target.value as 'append' | 'upsert' | 'replace')}
                    className="w-full rounded border bg-white px-3 py-2 text-sm"
                  >
                    <option value="upsert">Upsert (atualiza existentes e cria novas)</option>
                    <option value="append">Append (só adiciona novas)</option>
                    <option value="replace">Replace (substitui tarefas importadas da fonte)</option>
                  </select>
                </div>

                <Button onClick={() => fileRef.current?.click()} disabled={status === 'uploading' || status === 'processing'}>
                  {status === 'uploading' || status === 'processing' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Selecionar e importar arquivo
                </Button>

                {!!fileName && <p className="text-sm text-gray-700"><strong>Arquivo:</strong> {fileName}</p>}
                {!!jobId && <p className="text-xs text-gray-500"><strong>Job ID:</strong> {jobId}</p>}
                {!!message && <p className="text-sm text-gray-700">{message}</p>}
                {(status === 'uploading' || status === 'processing') && <Progress value={Math.max(0, Math.min(100, progress))} className="h-2" />}
                {(status === 'uploading' || status === 'processing') && (
                  <p className="text-xs text-gray-500">
                    Etapa: {phase === 'mpp_upload' ? 'Upload' : phase === 'mpp_processing' ? 'Importação MPP' : 'Sincronização local'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export-excel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-500" /> Exportar para Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Gere uma planilha com tarefas, datas, progresso e responsáveis.</p>
                <Button onClick={() => handleExport('excel')} variant="outline" className="w-full border-green-200 hover:bg-green-50 text-green-700 h-11 text-base">
                  <Download className="w-5 h-5 mr-2" /> Baixar Planilha (.xlsx)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export-msproject">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-purple-500" /> Exportar Project (XML)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Exporte o cronograma atual para formato XML compatível com Microsoft Project.</p>
                <Button onClick={() => handleExport('msproject')} variant="outline" className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-11 text-base">
                  <Download className="w-5 h-5 mr-2" /> Baixar XML do Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
