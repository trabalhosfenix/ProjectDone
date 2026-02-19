import { redirect } from 'next/navigation'

export default async function TestesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/projetos/${id}/testes/cenarios`)
}
