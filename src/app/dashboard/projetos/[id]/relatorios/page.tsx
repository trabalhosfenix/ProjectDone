'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { 
  FileText, 
  Download, 
  Loader2, 
  BarChart3, 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  BookOpen,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ProjectPageHeader } from "@/components/project/project-page-header"

interface ReportType {
  id: string
  title: string
  description: string
  icon: any
  available: boolean
}

export default function RelatoriosPage() {
  const params = useParams()
  const projectId = params.id as string
  const [generating, setGenerating] = useState<string | null>(null)

  const reportTypes: ReportType[] = [
    {
      id: 'eap',
      title: 'Relatório de EAP',
      description: 'Estrutura Analítica do Projeto com todos os componentes',
      icon: BarChart3,
      available: true
    },
    {
      id: 'cronograma',
      title: 'Relatório de Cronograma',
      description: 'Lista de tarefas com datas, duração e progresso',
      icon: Calendar,
      available: true
    },
    {
      id: 'riscos',
      title: 'Matriz de Riscos',
      description: 'Riscos identificados com probabilidade, impacto e plano de resposta',
      icon: AlertTriangle,
      available: true
    },
    {
      id: 'equipe',
      title: 'Relatório da Equipe',
      description: 'Membros alocados, papéis e horas previstas',
      icon: Users,
      available: true
    },
    {
      id: 'termo-abertura',
      title: 'Termo de Abertura',
      description: 'Documento formal de início do projeto',
      icon: FileText,
      available: true
    },
    {
      id: 'termo-encerramento',
      title: 'Termo de Encerramento',
      description: 'Documento formal de fechamento do projeto',
      icon: CheckCircle,
      available: true
    },
    {
      id: 'licoes',
      title: 'Lições Aprendidas',
      description: 'Compilação de aprendizados registrados',
      icon: BookOpen,
      available: true
    },
    {
      id: 'completo',
      title: 'Relatório Completo',
      description: 'Consolidação de todas as informações do projeto',
      icon: FileSpreadsheet,
      available: true
    }
  ]

  const generateReport = async (reportId: string) => {
    setGenerating(reportId)
    
    try {
      // Buscar dados do projeto
      const response = await fetch(`/api/projects/${projectId}`)
      const { data: project } = await response.json()
      
      if (!project) {
        toast.error('Projeto não encontrado')
        return
      }

      // Gerar conteúdo HTML do relatório
      let htmlContent = ''
      const now = new Date().toLocaleDateString('pt-BR')
      
      const header = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório - ${project.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .meta { color: #6b7280; font-size: 12px; margin-top: 20px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-yellow { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <h1>${project.name}</h1>
          <p><strong>Código:</strong> ${project.code || 'N/A'}</p>
          <p><strong>Data do Relatório:</strong> ${now}</p>
      `
      
      const footer = `
          <div class="meta">
            <p>Gerado automaticamente pelo sistema ProjectDone em ${now}</p>
          </div>
        </body>
        </html>
      `

      switch (reportId) {
        case 'eap':
          htmlContent = header + `
            <h2>Estrutura Analítica do Projeto (EAP)</h2>
            <p>Componentes do escopo do projeto organizados hierarquicamente.</p>
            <table>
              <tr><th>Código</th><th>Componente</th><th>Tipo</th></tr>
              <tr><td>1.0</td><td>${project.name}</td><td>Projeto</td></tr>
              ${project.items?.map((item: any, i: number) => `
                <tr><td>1.${i + 1}</td><td>${item.name}</td><td>${item.originSheet || 'Componente'}</td></tr>
              `).join('') || '<tr><td colspan="3">Nenhum componente cadastrado</td></tr>'}
            </table>
          ` + footer
          break

        case 'cronograma':
          htmlContent = header + `
            <h2>Cronograma do Projeto</h2>
            <table>
              <tr><th>Tarefa</th><th>Início</th><th>Término</th><th>Progresso</th></tr>
              ${project.items?.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.startDate ? new Date(item.startDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>${item.endDate ? new Date(item.endDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>${item.progress || 0}%</td>
                </tr>
              `).join('') || '<tr><td colspan="4">Nenhuma tarefa cadastrada</td></tr>'}
            </table>
          ` + footer
          break

        case 'riscos':
          const risksRes = await fetch(`/api/projects/${projectId}/risks`)
          const risksData = await risksRes.json()
          htmlContent = header + `
            <h2>Matriz de Riscos</h2>
            <table>
              <tr><th>Risco</th><th>Tipo</th><th>P x I</th><th>Severidade</th><th>Estratégia</th></tr>
              ${risksData.data?.map((risk: any) => `
                <tr>
                  <td>${risk.description}</td>
                  <td>${risk.type}</td>
                  <td>${risk.probability} x ${risk.impact}</td>
                  <td><span class="badge ${risk.severity >= 15 ? 'badge-red' : risk.severity >= 8 ? 'badge-yellow' : 'badge-green'}">${risk.severity}</span></td>
                  <td>${risk.responseStrategy}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">Nenhum risco cadastrado</td></tr>'}
            </table>
          ` + footer
          break

        case 'equipe':
          htmlContent = header + `
            <h2>Equipe do Projeto</h2>
            <table>
              <tr><th>Membro</th><th>Papel</th><th>Horas Alocadas</th><th>Receita/Hora</th></tr>
              ${project.members?.map((m: any) => `
                <tr>
                  <td>${m.user?.name || m.user?.email || 'N/A'}</td>
                  <td>${m.role}</td>
                  <td>${m.allocatedHours || 0}h</td>
                  <td>R$ ${(m.revenue || 0).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">Nenhum membro cadastrado</td></tr>'}
            </table>
          ` + footer
          break

        case 'termo-abertura':
          htmlContent = header + `
            <h2>Termo de Abertura do Projeto</h2>
            <h3>1. Identificação</h3>
            <p><strong>Nome:</strong> ${project.name}</p>
            <p><strong>Código:</strong> ${project.code || 'N/A'}</p>
            <p><strong>Status:</strong> ${project.status}</p>
            <p><strong>Data Início:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
            
            <h3>2. Justificativa</h3>
            <p>${project.justification || 'Não informada'}</p>
            
            <h3>3. Objetivo</h3>
            <p>${project.objective || 'Não informado'}</p>
            
            <h3>4. Escopo</h3>
            <p>${project.scope || 'Não informado'}</p>
            
            <h3>5. Aprovação</h3>
            <p>___________________________ Data: ___/___/______</p>
            <p>Sponsor / Patrocinador</p>
          ` + footer
          break

        case 'termo-encerramento':
          htmlContent = header + `
            <h2>Termo de Encerramento do Projeto</h2>
            <h3>1. Identificação</h3>
            <p><strong>Nome:</strong> ${project.name}</p>
            <p><strong>Código:</strong> ${project.code || 'N/A'}</p>
            <p><strong>Data Encerramento:</strong> ${now}</p>
            
            <h3>2. Resultados Alcançados</h3>
            <p>O projeto foi concluído conforme planejado.</p>
            
            <h3>3. Entregas Realizadas</h3>
            <ul>
              ${project.items?.slice(0, 10).map((item: any) => `<li>${item.name}</li>`).join('') || '<li>Nenhuma entrega registrada</li>'}
            </ul>
            
            <h3>4. Aceite Formal</h3>
            <p>___________________________ Data: ___/___/______</p>
            <p>Gerente do Projeto</p>
            <br/>
            <p>___________________________ Data: ___/___/______</p>
            <p>Cliente / Sponsor</p>
          ` + footer
          break

        case 'licoes':
          const metaRes = await fetch(`/api/projects/${projectId}/metadata?key=lessons`)
          const lessonsData = await metaRes.json()
          htmlContent = header + `
            <h2>Lições Aprendidas</h2>
            ${lessonsData.data?.map((lesson: any) => `
              <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h4>${lesson.title}</h4>
                <p><strong>Categoria:</strong> ${lesson.category}</p>
                <p><strong>Tipo:</strong> ${lesson.type || 'N/A'}</p>
                <p>${lesson.description}</p>
                ${lesson.recommendation ? `<p><strong>Recomendação:</strong> ${lesson.recommendation}</p>` : ''}
              </div>
            `).join('') || '<p>Nenhuma lição registrada.</p>'}
          ` + footer
          break

        default:
          htmlContent = header + `
            <h2>Relatório Completo do Projeto</h2>
            <p><strong>Descrição:</strong> ${project.description || 'N/A'}</p>
            <p><strong>Status:</strong> ${project.status}</p>
            <p><strong>Progresso:</strong> ${project.progress || 0}%</p>
            <p><strong>Orçamento:</strong> R$ ${(project.budget || 0).toLocaleString('pt-BR')}</p>
          ` + footer
      }

      // Criar e baixar arquivo HTML (que pode ser aberto e impresso como PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio_${reportId}_${projectId}.html`
      link.click()
      
      toast.success('Relatório gerado! Abra o arquivo e use Ctrl+P para salvar como PDF.')
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(null)
    }
  }



// ...

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6">
        <ProjectPageHeader 
          title="Relatórios do Projeto" 
          description="Gere documentos e relatórios em formato HTML/PDF."
          projectId={projectId}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <report.icon className="w-5 h-5 text-blue-600" />
                  {report.title}
                </CardTitle>
                <CardDescription className="text-xs">{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id}
                  className="w-full"
                  variant={report.available ? 'default' : 'secondary'}
                >
                  {generating === report.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Gerar</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p><strong>Dica:</strong> Os relatórios são gerados em HTML. Após baixar, abra o arquivo no navegador e use <strong>Ctrl+P</strong> para salvar como PDF.</p>
        </div>
      </div>
    </div>
  )
}
