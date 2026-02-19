'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, ListTodo, Upload, Loader2, ArrowRight, Download, ArrowLeft, FileCode } from 'lucide-react'
import { toast } from 'sonner'
import { importProjectExcel } from '@/app/actions/import-project'
import { importMSProject } from '@/app/actions/import-msproject'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProjectSetupProps {
  projectId: string
}

export function ProjectSetup({ projectId }: ProjectSetupProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [isImportingMSP, setIsImportingMSP] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mspFileInputRef = useRef<HTMLInputElement>(null)
  
  // Função para upload do arquivo Excel
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
        setIsImporting(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro inesperado')
      setIsImporting(false)
    }
  }

  // Função para upload do arquivo MS Project
  const handleMSPFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImportingMSP(true)
    const formData = new FormData()
    formData.append('file', file)
    // projectId vai na URL agora

    try {
      const response = await fetch(`/api/projetos/${projectId}/import-mpp`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao importar MS Project')
        if (result.details) console.error(result.details)
        setIsImportingMSP(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro de conexão ou timeout')
      setIsImportingMSP(false)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerMSPFileUpload = () => {
    mspFileInputRef.current?.click()
  }

  const handleManualCreate = () => {
    toast.info('Modo manual ativado. Você pode adicionar tarefas pelo Kanban ou Lista.')
    router.push(`/dashboard/projetos/${projectId}/kanban`)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
      <div className="max-w-5xl w-full space-y-8 relative">
        <div className="absolute top-0 left-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
          </Link>
        </div>
        <div className="text-center pt-8">
          <h1 className="text-3xl font-bold text-gray-900">Vamos começar seu projeto!</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Escolha como você gostaria de iniciar o cronograma e as tarefas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card Importação Excel */}
          <Card 
            className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-100 cursor-pointer group relative overflow-hidden flex flex-col"
            onClick={triggerFileUpload}
          >
            <input 
              type="file" 
              accept=".xlsx" 
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

          {/* Card MS Project */}
          <Card 
            className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-100 cursor-pointer group relative overflow-hidden flex flex-col"
            onClick={triggerMSPFileUpload}
          >
            <input 
              type="file" 
              accept=".mpp,.mpx,.xml,.mpt" 
              className="hidden"
              ref={mspFileInputRef}
              onChange={handleMSPFileUpload}
              disabled={isImportingMSP}
            />
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
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Suporta .mpp e .xml
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Importa dependências
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Preserva WBS e % concluído
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" variant="outline" disabled={isImportingMSP}>
                {isImportingMSP ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
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

          {/* Card Manual */}
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
      </div>
    </div>
  )
}

