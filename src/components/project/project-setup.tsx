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
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { importProjectExcel } from '@/app/actions/import-project'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProjectSetupProps {
  projectId: string
  projectName?: string
}

interface ImportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
}

export function ProjectSetup({ projectId, projectName }: ProjectSetupProps) {
  const router = useRouter()
  
  // Estados para importação
  const [isImporting, setIsImporting] = useState(false)
  const [isImportingMSP, setIsImportingMSP] = useState(false)
  const [importJob, setImportJob] = useState<ImportJob | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Refs para inputs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mspFileInputRef = useRef<HTMLInputElement>(null)

  // Função para limpar polling
  const clearPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // Função para verificar status do job
  const pollJobStatus = async (jobId: string) => {
    try {
      const result = await checkImportStatus(jobId)
      
      setImportJob({
        id: jobId,
        status: result.status,
        progress: result.progress || 0,
        message: result.message
      })

      if (result.status === 'completed') {
        clearPolling()
        toast.success('Importação concluída com sucesso!')
        router.refresh()
        setTimeout(() => {
          router.push(`/dashboard/projetos/${projectId}/gantt`)
        }, 1500)
      } else if (result.status === 'error') {
        clearPolling()
        toast.error(result.message || 'Erro na importação')
        setIsImportingMSP(false)
        setImportJob(null)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  // Upload Excel (mantido similar)
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

  // Upload MS Project com polling
  const handleMSPFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar extensão
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['mpp', 'mpx', 'xml', 'mpt']
    if (!validExts.includes(ext || '')) {
      toast.error('Formato não suportado. Use .mpp, .mpx, .xml ou .mpt')
      return
    }

    setIsImportingMSP(true)
    setImportJob({
      id: 'starting',
      status: 'pending',
      progress: 0,
      message: 'Iniciando importação...'
    })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/mpp/import-mpp', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.job_id) {
        toast.error(result.error || 'Erro ao iniciar importação MS Project')
        setIsImportingMSP(false)
        return
      }

      toast.info('Importação iniciada. Processando arquivo .MPP...')

      const timeoutAt = Date.now() + 120000
      while (Date.now() < timeoutAt) {
        const jobResponse = await fetch(`/api/mpp/jobs/${result.job_id}`)
        const job = await jobResponse.json()
        const status = String(job.status || '').toLowerCase()

        if (status === 'completed' || status === 'success' || status === 'done') {
          toast.success('Importação do MS Project concluída!')
          router.refresh()
          setIsImportingMSP(false)
          return
        }

        if (status === 'failed' || status === 'error') {
          toast.error(job.error || 'Falha ao processar arquivo .MPP')
          setIsImportingMSP(false)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      toast.error('Tempo de processamento excedido. Verifique o status da API.')
      setIsImportingMSP(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro de conexão com a MPP Platform API')
      setIsImportingMSP(false)
      setImportJob(null)
    }
  }

  // Cancelar importação
  const handleCancelImport = () => {
    clearPolling()
    setIsImportingMSP(false)
    setImportJob(null)
    toast.info('Importação cancelada')
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
        {/* Header com título do projeto */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {projectName || 'Configurar Projeto'}
            </h1>
            <p className="text-gray-500 text-sm">
              ID: {projectId}
            </p>
          </div>
        </div>

        {/* Status da importação em andamento */}
        {importJob && importJob.status !== 'completed' && (
          <Alert className={importJob.status === 'error' ? 'bg-red-50' : 'bg-blue-50'}>
            <div className="flex items-start gap-3">
              {importJob.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <p className="font-medium">
                    {importJob.message || 'Processando...'}
                  </p>
                  {importJob.status === 'processing' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCancelImport}
                      className="text-red-500 hover:text-red-700"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
                {importJob.status === 'processing' && (
                  <>
                    <Progress value={importJob.progress} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {importJob.progress}% concluído
                    </p>
                  </>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Cards de opções */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Como deseja iniciar?
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Escolha a melhor forma para importar ou criar seu cronograma
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card Excel - Mantido */}
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
              <CardDescription>
                Use um arquivo Excel (.xlsx) para carregar tarefas automaticamente.
              </CardDescription>
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
                    onClick={(e) => e.stopPropagation()}
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

          {/* Card MS Project - MELHORADO */}
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
            
            {/* Badge de destaque */}
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-1 rounded-full">
                NOVO
              </span>
            </div>

            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Importar MS Project</CardTitle>
              <CardDescription>
                Importe diretamente do Microsoft Project (.mpp, .xml).
              </CardDescription>
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
              <Button 
                className="w-full" 
                variant={isImportingMSP ? "default" : "outline"}
                disabled={isImportingMSP}
              >
                {isImportingMSP ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {importJob?.message || 'Importando...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar .mpp
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Card Manual - Mantido */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-100 cursor-pointer group" onClick={handleManualCreate}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ListTodo className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Criar Manualmente</CardTitle>
              <CardDescription>
                Comece do zero e adicione tarefas no quadro Kanban.
              </CardDescription>
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

        {/* Informações adicionais */}
        <div className="text-center text-sm text-gray-400 pt-8">
          <p>
            Após a importação, você poderá visualizar o Gantt, editar tarefas no Kanban
            e acompanhar o progresso pelo dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}