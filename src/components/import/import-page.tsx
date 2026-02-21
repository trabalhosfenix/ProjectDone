'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, Loader2, FileCode, ArrowRight, CircleCheck, AlertTriangle } from 'lucide-react'

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

function getProjectNameHintFromFile(file: File | null): string | undefined {
  if (!file?.name) return undefined
  const withoutExtension = file.name.replace(/\.[^/.]+$/, '')
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
  if (['completed', 'success', 'done', 'finished'].includes(status)) return 'completed'
  if (['failed', 'error', 'canceled'].includes(status)) return 'error'
  if (['processing', 'running', 'in_progress', 'queued', 'pending'].includes(status)) return 'processing'
  return 'processing'
}

export default function ImportProjectPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [localProjectId, setLocalProjectId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string>('')
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  const [syncMode, setSyncMode] = useState<'append' | 'upsert' | 'replace'>('upsert')
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string; code: string | null; status: string }>>([])
  const [selectedLocalProjectId, setSelectedLocalProjectId] = useState<string>('')

  const persistMppLink = (legacyProjectId: string, mppProjectId: string) => {
    try {
      const current = JSON.parse(sessionStorage.getItem('mppProjectMap') || '{}')
      current[legacyProjectId] = mppProjectId
      sessionStorage.setItem('mppProjectMap', JSON.stringify(current))
    } catch {
      // noop
    }
  }

  const canUpload = useMemo(() => selectedFile && status !== 'uploading' && status !== 'processing', [selectedFile, status])

  const loadProjectOptions = async () => {
    try {
      const response = await fetch('/api/projects/lookup', { cache: 'no-store' })
      const payload = await response.json()
      if (response.ok && payload.success) {
        setProjectOptions(Array.isArray(payload.data) ? payload.data : [])
      }
    } catch {
      // noop
    }
  }

  useEffect(() => {
    void loadProjectOptions()
  }, [])

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['mpp', 'mpx', 'xml', 'mpt'].includes(ext)) {
      toast.error('Formato inválido. Use .mpp, .mpx, .xml ou .mpt')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setStatus('idle')
    setJobId(null)
    setProjectId(null)
    setProgress(0)
    setMessage('Arquivo selecionado e pronto para envio.')
  }

  const pollJob = async (id: string) => {
    const timeoutAt = Date.now() + 10 * 60_000

    while (Date.now() < timeoutAt) {
      const response = await fetch(`/api/mpp/jobs/${id}`, { cache: 'no-store' })
      const data = await response.json()

      const nextStatus = normalizeStatus(data.status)
      const nextProgress = Number(data.progress || data.percent || 0)

      setStatus(nextStatus)
      setProgress(Number.isFinite(nextProgress) ? Math.max(0, Math.min(100, nextProgress)) : 0)
      setMessage(data.message || data.detail || data.error || '')

      const resolvedProjectId = extractProjectId(data as Record<string, unknown>)
      if (resolvedProjectId) {
        setProjectId(String(resolvedProjectId))
      }

      if (nextStatus === 'completed') {
        const targetMppProjectId = resolvedProjectId || projectId
        if (targetMppProjectId) {
          const syncResponse = await fetch('/api/mpp/sync-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mppProjectId: targetMppProjectId,
              localProjectId: importMode === 'existing' ? selectedLocalProjectId || undefined : undefined,
              syncMode,
              projectNameHint: getProjectNameHintFromFile(selectedFile),
            }),
          })
          const syncResult = await syncResponse.json()
          if (syncResponse.ok && syncResult.success) {
            setLocalProjectId(String(syncResult.localProjectId))
          } else {
            toast.error(syncResult.error || 'Falha ao sincronizar projeto importado')
          }
        }
        toast.success('Importação concluída com sucesso')
        return
      }

      if (nextStatus === 'error') {
        toast.error(data.error || 'Falha na importação do MPP')
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    setStatus('error')
    setMessage('Tempo limite de processamento excedido.')
    toast.error('Tempo limite de processamento excedido')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setStatus('uploading')
      setMessage('Enviando arquivo para processamento...')

      const formData = new FormData()
      formData.append('file', selectedFile)
      if (importMode === 'existing' && selectedLocalProjectId) {
        formData.append('projectId', selectedLocalProjectId)
      }

      const response = await fetch('/api/mpp/import-mpp', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok || !data.job_id) {
        throw new Error(data.error || 'Falha ao iniciar importação')
      }

      setJobId(String(data.job_id))
      const resolvedProjectId = extractProjectId(data as Record<string, unknown>)
      if (resolvedProjectId) {
        setProjectId(String(resolvedProjectId))
      }
      setStatus('processing')
      setMessage(data.message || 'Arquivo recebido. Processando no backend...')

      await pollJob(String(data.job_id))
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erro de integração')
      toast.error(error instanceof Error ? error.message : 'Erro de integração')
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Importar Microsoft Project (.mpp)</h1>
          <p className="text-sm text-gray-600">Upload assíncrono com acompanhamento de job para transparência do processamento.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" /> Gerenciamento de arquivo MPP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="rounded border p-3 text-sm cursor-pointer">
              <input
                type="radio"
                name="importMode"
                className="mr-2"
                checked={importMode === 'new'}
                onChange={() => setImportMode('new')}
              />
              Criar novo projeto local
            </label>
            <label className="rounded border p-3 text-sm cursor-pointer">
              <input
                type="radio"
                name="importMode"
                className="mr-2"
                checked={importMode === 'existing'}
                onChange={() => setImportMode('existing')}
              />
              Importar para projeto existente
            </label>
          </div>

          {importMode === 'existing' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto de destino</label>
              <select
                value={selectedLocalProjectId}
                onChange={(e) => setSelectedLocalProjectId(e.target.value)}
                className="w-full rounded border bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione um projeto...</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.code ? `(${project.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
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

          <input
            ref={fileInputRef}
            type="file"
            accept=".mpp,.mpx,.xml,.mpt"
            className="hidden"
            onChange={handleSelectFile}
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Selecionar arquivo
            </Button>
            <Button onClick={handleUpload} disabled={!canUpload || (importMode === 'existing' && !selectedLocalProjectId)}>
              {status === 'uploading' || status === 'processing' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Iniciar importação
            </Button>
          </div>

          {selectedFile && (
            <div className="rounded border bg-gray-50 p-3 text-sm">
              <p><strong>Arquivo:</strong> {selectedFile.name}</p>
              <p><strong>Tamanho:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {status !== 'idle' && (
            <div className="rounded border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {status === 'completed' ? <CircleCheck className="w-4 h-4 text-green-600" /> : status === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                <span><strong>Status:</strong> {status}</span>
              </div>
              {(status === 'processing' || status === 'uploading') && <Progress value={progress} className="h-2" />}
              {message && <p className="text-sm text-gray-700">{message}</p>}
              {jobId && <p className="text-xs text-gray-500">Job ID: {jobId}</p>}
              {(localProjectId || projectId) && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const targetMppProjectId = projectId ? String(projectId) : ''
                      const targetLocalProjectId = localProjectId ? String(localProjectId) : targetMppProjectId
                      if (!targetLocalProjectId) {
                        toast.error('Projeto local ainda não disponível')
                        return
                      }
                      persistMppLink(targetLocalProjectId, targetMppProjectId)
                      router.push(
                        targetMppProjectId
                          ? `/dashboard/projetos/${targetLocalProjectId}/gantt?mppProjectId=${targetMppProjectId}`
                          : `/dashboard/projetos/${targetLocalProjectId}/gantt`
                      )
                    }}
                  >
                    Abrir Gantt do projeto
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
