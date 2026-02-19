import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { Clock } from 'lucide-react'

export default async function PlacehodlerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Clock className="w-24 h-24 text-gray-300 mb-6" />
          <h1 className="text-3xl font-bold text-gray-400 mb-2">Em Breve</h1>
          <p className="text-gray-500 text-center max-w-md">
            Esta funcionalidade está em desenvolvimento e estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}
