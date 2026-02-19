'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileCode, ArrowLeft } from 'lucide-react'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportProjectToExcel, exportProjectToMSProject } from '@/lib/project-exporter'
import Link from 'next/link'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default function ImportarPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('excel')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'msproject') setActiveTab('msproject')
    else setActiveTab('excel')
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.replace(`/dashboard/projetos/${projectId}/importar?type=${value}`)
  }

  const handleExport = async (format: 'excel' | 'msproject') => {
    toast.info('Iniciando exportação...')
    try {
      const success = format === 'excel' 
        ? await exportProjectToExcel(projectId, 'Projeto_Exportado')
        : await exportProjectToMSProject(projectId, 'Projeto_Exportado')
      
      if (success) toast.success('Arquivo baixado com sucesso!')
      else toast.error('Falha na exportação')
    } catch (e) {
      toast.error('Erro ao exportar')
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <ProjectPageHeader 
             title="Exportar Projeto"
             description="Exporte dados para Excel ou MS Project."
             projectId={projectId}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel / Planilhas
            </TabsTrigger>
            <TabsTrigger value="msproject" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" /> Microsoft Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-500" /> Exportar para Excel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Gere uma planilha completa com todas as tarefas, datas, progresso e responsáveis atuais do projeto.
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-20 h-20 text-green-200" />
                  </div>

                  <Button onClick={() => handleExport('excel')} variant="outline" className="w-full border-green-200 hover:bg-green-50 text-green-700 h-11 text-base">
                    <Download className="w-5 h-5 mr-2" /> Baixar Planilha (.xlsx)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="msproject">
             <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-purple-500" /> Exportar Project (XML)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Exporte o cronograma atual para formato XML compatível com Microsoft Project.
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-center">
                    <FileCode className="w-20 h-20 text-purple-200" />
                  </div>

                  <Button onClick={() => handleExport('msproject')} variant="outline" className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-11 text-base">
                    <Download className="w-5 h-5 mr-2" /> Baixar XML do Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
