import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectDocumentsList } from '@/components/project/project-documents-list'
import { getProjectDocuments } from '@/app/actions/project-quality'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { ProjectPageHeader } from '@/components/project/project-page-header'

// ...

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: documents } = await getProjectDocuments(id)

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-6xl">
        <ProjectPageHeader 
          title="Documentos do Projeto" 
          description="Gerencie contratos, especificações, atas e outros arquivos do projeto."
          projectId={id}
        />

        <ProjectDocumentsList projectId={id} documents={documents || []} />
      </div>
    </div>
  )
}
