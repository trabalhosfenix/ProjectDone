import { NextResponse } from 'next/server'
import { MPP_API_BASE_URL } from '@/lib/mpp-api'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const response = await fetch(`${MPP_API_BASE_URL}/v1/projects/import/mpp`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Erro ao importar MPP:', error)
    return NextResponse.json({ error: 'Falha ao integrar com MPP Platform API' }, { status: 500 })
  }
}
