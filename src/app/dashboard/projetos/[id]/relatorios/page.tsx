'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import {
  Download,
  Loader2,
  BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProjectPageHeader } from '@/components/project/project-page-header'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ProjectItem = {
  id: string
  wbs: string | null
  task: string | null
  status: string | null
  responsible: string | null
  originSheet: string
  datePlanned: string | null
  datePlannedEnd: string | null
  dateActual: string | null
  metadata: unknown
}

type ProjectMember = {
  role: string
  effort: number | null
  revenue: number | null
  user: {
    name: string | null
    email: string
  }
}

type ProjectRisk = {
  description: string
  type: string
  probability: number
  impact: number
  severity: number
  responseStrategy: string | null
  owner: string | null
  status: string
}

type LessonItem = {
  title?: string
  category?: string
  type?: string
  description?: string
  recommendation?: string
}

type ProjectContext = {
  project: {
    id: string
    name: string
    code: string | null
    status: string
    type: string | null
    description: string | null
    justification: string | null
    objective: string | null
    assumptions: string | null
    constraints: string | null
    progress: number
    budget: number
    actualCost: number
    startDate: string | null
    endDate: string | null
    realStartDate: string | null
    realEndDate: string | null
    managerName: string | null
    client: string | null
    createdAt: string
    updatedAt: string
  }
  items: ProjectItem[]
  members: ProjectMember[]
  risks: ProjectRisk[]
  lessons: LessonItem[]
}

type ReportType = {
  id: string
  title: string
  description: string
  icon: any
  available: boolean
  countLabel: string
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('pt-BR')
}

const formatCurrency = (value?: number | null) => `R$ ${(Number(value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const itemProgress = (item: ProjectItem) => {
  const metadata = item.metadata && typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : {}
  const raw = Number(metadata.progress ?? 0)
  const baseProgress = Number.isFinite(raw) ? (raw <= 1 ? raw * 100 : raw) : 0
  const statusText = String(item.status || '').toLowerCase()
  if (statusText.includes('concl') || statusText.includes('done') || statusText.includes('completed')) return 100
  return Math.max(0, Math.min(100, Math.round(baseProgress)))
}

const addPdfHeader = (doc: jsPDF, title: string, context: ProjectContext) => {
  doc.setFontSize(16)
  doc.text(title, 40, 40)

  doc.setFontSize(11)
  doc.text(`Projeto: ${context.project.name}`, 40, 62)
  doc.text(`Codigo: ${context.project.code || '-'}`, 40, 78)
  doc.text(`Status: ${context.project.status}`, 40, 94)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 40, 110)

  return 130
}

export default function RelatoriosPage() {
  const params = useParams()
  const projectId = params.id as string

  const [generating, setGenerating] = useState<string | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [context, setContext] = useState<ProjectContext | null>(null)

  const loadContext = async () => {
    setLoadingContext(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/reports/context`, { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Falha ao carregar dados dos relatorios')
      }

      setContext(payload.data as ProjectContext)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar contexto dos relatorios')
      setContext(null)
    } finally {
      setLoadingContext(false)
    }
  }

  useEffect(() => {
    loadContext()
  }, [projectId])

  const reportTypes: ReportType[] = useMemo(() => {
    const itemsCount = context?.items.length || 0
    const risksCount = context?.risks.length || 0
    const membersCount = context?.members.length || 0
    const lessonsCount = context?.lessons.length || 0

    return [
      {
        id: 'eap',
        title: 'Relatorio de EAP',
        description: 'Estrutura analitica do projeto e componentes cadastrados.',
        icon: BarChart3,
        available: true,
        countLabel: `${itemsCount} itens`,
      },
      {
        id: 'cronograma',
        title: 'Relatorio de Cronograma',
        description: 'Tarefas, datas planejadas, progresso e responsaveis.',
        icon: Calendar,
        available: true,
        countLabel: `${itemsCount} tarefas`,
      },
      {
        id: 'riscos',
        title: 'Matriz de Riscos',
        description: 'Riscos, severidade, responsavel e estrategia de resposta.',
        icon: AlertTriangle,
        available: true,
        countLabel: `${risksCount} riscos`,
      },
      {
        id: 'equipe',
        title: 'Relatorio da Equipe',
        description: 'Membros, papeis, esforco e receita estimada.',
        icon: Users,
        available: true,
        countLabel: `${membersCount} membros`,
      },
      {
        id: 'termo-abertura',
        title: 'Termo de Abertura',
        description: 'Documento de inicio formal com objetivo e justificativa.',
        icon: FileText,
        available: true,
        countLabel: context?.project.status || '-',
      },
      {
        id: 'termo-encerramento',
        title: 'Termo de Encerramento',
        description: 'Documento de encerramento com resumo das entregas.',
        icon: CheckCircle,
        available: true,
        countLabel: `${itemsCount} entregas`,
      },
      {
        id: 'licoes',
        title: 'Licoes Aprendidas',
        description: 'Compilacao de licoes registradas no metadado do projeto.',
        icon: BookOpen,
        available: true,
        countLabel: `${lessonsCount} licoes`,
      },
      {
        id: 'completo',
        title: 'Relatorio Completo',
        description: 'Resumo executivo consolidado de escopo, prazo, equipe e riscos.',
        icon: FileSpreadsheet,
        available: true,
        countLabel: 'Consolidado',
      },
    ]
  }, [context])

  const generateReport = async (reportId: string) => {
    if (!context) {
      toast.error('Contexto do projeto indisponivel para gerar relatorio')
      return
    }

    setGenerating(reportId)

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      let currentY = addPdfHeader(doc, `Relatorio: ${reportTypes.find((r) => r.id === reportId)?.title || reportId}`, context)

      switch (reportId) {
        case 'eap': {
          autoTable(doc, {
            startY: currentY,
            head: [['WBS', 'Componente', 'Origem', 'Status']],
            body:
              context.items.length > 0
                ? context.items.map((item) => [item.wbs || '-', item.task || '-', item.originSheet || '-', item.status || '-'])
                : [['-', 'Nenhum componente cadastrado', '-', '-']],
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
          })
          break
        }

        case 'cronograma': {
          autoTable(doc, {
            startY: currentY,
            head: [['Tarefa', 'Inicio', 'Fim', 'Responsavel', 'Progresso']],
            body:
              context.items.length > 0
                ? context.items.map((item) => [
                    item.task || '-',
                    formatDate(item.datePlanned),
                    formatDate(item.datePlannedEnd),
                    item.responsible || '-',
                    `${itemProgress(item)}%`,
                  ])
                : [['Nenhuma tarefa cadastrada', '-', '-', '-', '0%']],
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
          })
          break
        }

        case 'riscos': {
          autoTable(doc, {
            startY: currentY,
            head: [['Risco', 'Tipo', 'P x I', 'Severidade', 'Estrategia', 'Responsavel']],
            body:
              context.risks.length > 0
                ? context.risks.map((risk) => [
                    risk.description || '-',
                    risk.type || '-',
                    `${risk.probability} x ${risk.impact}`,
                    String(risk.severity || 0),
                    risk.responseStrategy || '-',
                    risk.owner || '-',
                  ])
                : [['Nenhum risco cadastrado', '-', '-', '-', '-', '-']],
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
          })
          break
        }

        case 'equipe': {
          autoTable(doc, {
            startY: currentY,
            head: [['Membro', 'Papel', 'Esforco (h)', 'Receita/Hora']],
            body:
              context.members.length > 0
                ? context.members.map((member) => [
                    member.user?.name || member.user?.email || '-',
                    member.role || '-',
                    String(member.effort || 0),
                    formatCurrency(member.revenue || 0),
                  ])
                : [['Nenhum membro cadastrado', '-', '0', formatCurrency(0)]],
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
          })
          break
        }

        case 'termo-abertura': {
          doc.setFontSize(12)
          doc.text('1. Identificacao', 40, currentY)
          doc.setFontSize(10)
          currentY += 18
          doc.text(`Nome: ${context.project.name}`, 40, currentY)
          currentY += 14
          doc.text(`Codigo: ${context.project.code || '-'}`, 40, currentY)
          currentY += 14
          doc.text(`Inicio previsto: ${formatDate(context.project.startDate)}`, 40, currentY)
          currentY += 24

          doc.setFontSize(12)
          doc.text('2. Justificativa', 40, currentY)
          currentY += 16
          doc.setFontSize(10)
          doc.text(doc.splitTextToSize(context.project.justification || 'Nao informada.', 520), 40, currentY)
          currentY += 42

          doc.setFontSize(12)
          doc.text('3. Objetivo', 40, currentY)
          currentY += 16
          doc.setFontSize(10)
          doc.text(doc.splitTextToSize(context.project.objective || 'Nao informado.', 520), 40, currentY)
          currentY += 42

          doc.setFontSize(12)
          doc.text('4. Escopo/Descricao', 40, currentY)
          currentY += 16
          doc.setFontSize(10)
          doc.text(doc.splitTextToSize(context.project.description || 'Nao informado.', 520), 40, currentY)
          break
        }

        case 'termo-encerramento': {
          doc.setFontSize(12)
          doc.text('Resumo de encerramento', 40, currentY)
          currentY += 20

          doc.setFontSize(10)
          doc.text(`Data de encerramento real: ${formatDate(context.project.realEndDate)}`, 40, currentY)
          currentY += 14
          doc.text(`Progresso consolidado: ${Math.round(context.project.progress || 0)}%`, 40, currentY)
          currentY += 14
          doc.text(`Total de entregas registradas: ${context.items.length}`, 40, currentY)
          currentY += 18

          autoTable(doc, {
            startY: currentY,
            head: [['Entrega', 'Status', 'Fim planejado', 'Fim real']],
            body: context.items.slice(0, 20).map((item) => [
              item.task || '-',
              item.status || '-',
              formatDate(item.datePlannedEnd),
              formatDate(item.dateActual),
            ]),
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
          })
          break
        }

        case 'licoes': {
          autoTable(doc, {
            startY: currentY,
            head: [['Titulo', 'Categoria', 'Tipo', 'Descricao', 'Recomendacao']],
            body:
              context.lessons.length > 0
                ? context.lessons.map((lesson) => [
                    lesson.title || '-',
                    lesson.category || '-',
                    lesson.type || '-',
                    lesson.description || '-',
                    lesson.recommendation || '-',
                  ])
                : [['Nenhuma licao registrada', '-', '-', '-', '-']],
            bodyStyles: { fontSize: 8 },
            headStyles: { fillColor: [30, 64, 175] },
            columnStyles: {
              3: { cellWidth: 180 },
              4: { cellWidth: 180 },
            },
          })
          break
        }

        case 'completo':
        default: {
          autoTable(doc, {
            startY: currentY,
            head: [['Indicador', 'Valor']],
            body: [
              ['Status', context.project.status || '-'],
              ['Tipo', context.project.type || '-'],
              ['Progresso', `${Math.round(context.project.progress || 0)}%`],
              ['Orcamento', formatCurrency(context.project.budget)],
              ['Custo real', formatCurrency(context.project.actualCost)],
              ['Tarefas', String(context.items.length)],
              ['Riscos', String(context.risks.length)],
              ['Membros', String(context.members.length)],
              ['Licoes', String(context.lessons.length)],
            ],
            bodyStyles: { fontSize: 10 },
            headStyles: { fillColor: [30, 64, 175] },
          })

          const finalY = (doc as any).lastAutoTable?.finalY || currentY + 140
          autoTable(doc, {
            startY: finalY + 20,
            head: [['Top 10 tarefas', 'Status', 'Responsavel', 'Progresso']],
            body: context.items.slice(0, 10).map((item) => [
              item.task || '-',
              item.status || '-',
              item.responsible || '-',
              `${itemProgress(item)}%`,
            ]),
            bodyStyles: { fontSize: 9 },
            headStyles: { fillColor: [55, 65, 81] },
          })
          break
        }
      }

      const fileCode = context.project.code || context.project.id
      doc.save(`relatorio_${reportId}_${fileCode}.pdf`)
      toast.success('PDF gerado com sucesso')
    } catch (error) {
      console.error('Erro ao gerar relatorio PDF:', error)
      toast.error('Erro ao gerar relatorio em PDF')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />

      <div className="flex-1 container mx-auto p-6">
        <ProjectPageHeader
          title="Relatorios do Projeto"
          description="Baixe documentos em PDF sempre alinhados ao contexto atual do projeto."
          projectId={projectId}
        />

        <div className="mb-4 flex items-center justify-end">
          <Button variant="outline" onClick={loadContext} disabled={loadingContext}>
            {loadingContext ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Atualizar dados
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <report.icon className="w-5 h-5 text-blue-600" />
                  {report.title}
                </CardTitle>
                <CardDescription className="text-xs">{report.description}</CardDescription>
                <p className="text-xs text-gray-500">{report.countLabel}</p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => generateReport(report.id)}
                  disabled={loadingContext || generating === report.id || !report.available}
                  className="w-full"
                  variant={report.available ? 'default' : 'secondary'}
                >
                  {generating === report.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" /> Baixar PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
