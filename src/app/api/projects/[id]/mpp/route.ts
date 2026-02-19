import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/v1';
const API_TIMEOUT = 5 * 60 * 1000; // 5 minutos

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // 2. Pegar dados do form
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // 3. Validar extensão
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.mpp', '.mpx', '.xml', '.mpt'];
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExt) {
      return NextResponse.json(
        { success: false, error: `Formato inválido. Use: ${validExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Criar FormData para API externa
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    if (projectId) apiFormData.append('projectId', projectId);
    apiFormData.append('userId', session.user.id);

    // 5. Enviar para API externa com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/import/mpp`, {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }

      return NextResponse.json({
        success: true,
        ...data
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout ao comunicar com servidor de importação');
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Erro na importação MPP:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao processar importação',
      },
      { status: 500 }
    );
  }
}