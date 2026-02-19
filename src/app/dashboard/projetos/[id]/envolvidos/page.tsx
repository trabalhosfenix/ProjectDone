import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { ProjectMembersList } from '@/components/project/project-members-list'
import { getProjectMembers } from '@/app/actions/project-members'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { ProjectPageHeader } from '@/components/project/project-page-header'

// ...

export default async function EnvolvidosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: members } = await getProjectMembers(id)

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={id} />
      <ProjectHorizontalMenu projectId={id} />
      
      <div className="flex-1 container mx-auto p-6 max-w-5xl">
        <ProjectPageHeader 
          title="Envolvidos" 
          description="Gerencie a equipe, stakeholders e permissões deste projeto."
          projectId={id}
        />

        <ProjectMembersList projectId={id} members={members || []} />
      </div>
    </div>
  )
}
