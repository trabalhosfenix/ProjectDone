import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // Consultar API externa
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro ${response.status}`);
    }

    return NextResponse.json({
      status: data.status.toLowerCase(),
      progress: data.progress || 0,
      message: data.message || getStatusMessage(data.status),
      projectId: data.projectId,
    });

  } catch (error: any) {
    console.error('Erro ao verificar job:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao verificar status',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    PENDING: 'Aguardando processamento...',
    PROCESSING: 'Processando arquivo...',
    PARSING: 'Analisando estrutura do projeto...',
    NORMALIZING: 'Normalizando dados...',
    COMPLETED: 'Importação concluída!',
    ERROR: 'Erro na importação',
  };
  return messages[status] || 'Processando...';
}