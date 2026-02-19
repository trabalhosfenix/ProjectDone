import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PlaceholderPageProps {
  title: string
  description?: string
  backLink?: string
}

export function PlaceholderPage({ title, description, backLink }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 m-8">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Construction className="w-12 h-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md mb-8">
        {description || 'Esta funcionalidade está em desenvolvimento e estará disponível em breve.'}
      </p>
      {backLink && (
        <Button asChild variant="outline">
          <Link href={backLink}>Voltar</Link>
        </Button>
      )}
    </div>
  )
}
