'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Upload, FileSpreadsheet, CheckCircle, Loader2, ArrowLeft, Download, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { importRisksExcel } from '@/app/actions/import-risks'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { ProjectPageHeader } from '@/components/project/project-page-header'

export default function ImportarRiscosPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Selecione um arquivo Excel')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    const res = await importRisksExcel(formData)
    setUploading(false)

    if (res.success) {
      toast.success(res.message)
      setResult(res.stats)
    } else {
      toast.error(res.error)
    }
  }

  const downloadTemplate = () => {
    const headers = ['Descrição', 'Tipo', 'Categoria', 'Probabilidade', 'Impacto', 'Estratégia', 'Plano de Ação', 'Responsável', 'Causas', 'Consequências', 'Contingência', 'Status']
    const sample = ['Atraso na entrega de materiais', 'Ameaça', 'Externo', '3', '4', 'Mitigar', 'Antecipar pedidos em 2 semanas', 'João Silva', 'Fornecedor com problemas logísticos', 'Atraso no cronograma', 'Buscar fornecedor alternativo', 'Ativo']
    
    // Create Workbook and Worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, sample])
    
    // Auto-width for columns (optional but nice)
    const wscols = headers.map(h => ({ wch: h.length + 5 }))
    ws['!cols'] = wscols

    XLSX.utils.book_append_sheet(wb, ws, 'Template Riscos')
    
    // Write and Download
    XLSX.writeFile(wb, 'template_riscos.xlsx')
    toast.success('Template baixado!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-2xl">
        <ProjectPageHeader 
             title="Importar Riscos"
             description="Importe riscos de uma planilha Excel."
             projectId={projectId}
             backLink={`/dashboard/projetos/${projectId}/riscos`}
        />

        {result ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" /> Importação Concluída!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-sm text-gray-500">Importados</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-sm text-gray-500">Ignorados</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-2xl font-bold text-gray-600">{result.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
              
              {result.errors?.length > 0 && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                  <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Erros:</p>
                  <ul className="list-disc pl-5 mt-2">
                    {result.errors.slice(0, 5).map((e: string, i: number) => <li key={i}>{e}</li>)}
                    {result.errors.length > 5 && <li>... e mais {result.errors.length - 5}</li>}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Link href={`/dashboard/projetos/${projectId}/riscos`} className="flex-1">
                  <Button className="w-full">Ver Riscos</Button>
                </Link>
                <Button variant="outline" onClick={() => { setResult(null); setFile(null); }}>
                  Nova Importação
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                Upload de Planilha
              </CardTitle>
              <CardDescription>
                Envie um arquivo .xlsx com os riscos do projeto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">.xlsx, .xls ou .csv</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                  <p className="font-semibold">Colunas esperadas:</p>
                  <p className="mt-1">Descrição, Tipo, Categoria, Probabilidade (1-5), Impacto (1-5), Estratégia, Plano de Ação, Responsável, Causas, Consequências, Contingência, Status</p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!file || uploading} className="flex-1">
                    {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</> : 'Importar Riscos'}
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" /> Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
