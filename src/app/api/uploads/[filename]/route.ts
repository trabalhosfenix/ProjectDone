import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
      // Tentar pegar params (com suporte a promise do Next 15)
      let filename = context?.params?.filename;
      if (context?.params && typeof context.params.then === 'function') {
          const resolved = await context.params;
          filename = resolved.filename;
      }
      
      // Fallback: Extrair da URL se params falhar (Bulletproof)
      if (!filename || filename === 'undefined') {
          const url = new URL(request.url)
          // url.pathname ex: /api/uploads/arquivo.png
          const parts = url.pathname.split('/') // ['', 'api', 'uploads', 'arquivo.png']
          filename = parts[parts.length - 1]
      }
      
      if (!filename || filename === 'uploads') {
           return new NextResponse('Nome do arquivo invalido', { status: 400 })
      }

      // Caminho real
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

      if (!fs.existsSync(filePath)) {
         return new NextResponse(`Arquivo nao encontrado no servidor: ${filename}`, { status: 404 })
      }

      const fileBuffer = fs.readFileSync(filePath)
      
      const ext = filename.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
       if (ext === 'png') contentType = 'image/png'
       if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
       if (ext === 'webp') contentType = 'image/webp'
       if (ext === 'gif') contentType = 'image/gif'
       if (ext === 'pdf') contentType = 'application/pdf'
       if (ext === 'doc' || ext === 'docx') contentType = 'application/msword'
       if (ext === 'xls' || ext === 'xlsx') contentType = 'application/vnd.ms-excel'

      return new NextResponse(fileBuffer, {
          headers: {
              'Content-Type': contentType,
              'Cache-Control': 'no-store, max-age=0' // Evitar cache durante testes
          }
      })
  } catch (e: any) {
      return new NextResponse(`Erro servidor: ${e.message}`, { status: 500 })
  }
}
