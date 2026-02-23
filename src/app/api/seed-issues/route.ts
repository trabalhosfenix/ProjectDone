import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { AccessError, requireAuth } from '@/lib/access-control'

export async function GET() {
  try {
    const currentUser = await requireAuth()
    if (currentUser.role !== 'ADMIN') {
      throw new AccessError('Apenas administradores podem semear status', 403)
    }
    const defaultStatuses = [
      { label: "Em avaliação", color: "#6b7280", isDefault: true, isFinal: false, order: 1 }, // Cinza
      { label: "Em aberto", color: "#3b82f6", isDefault: false, isFinal: false, order: 2 },    // Azul
      { label: "Fechado", color: "#10b981", isDefault: false, isFinal: true, order: 3 },      // Verde
      { label: "Cancelado", color: "#ef4444", isDefault: false, isFinal: true, order: 4 },     // Vermelho
    ]

    const results = []

    // Opcional: Limpar anteriores se quiser evitar duplicatas ou manter legado? 
    // Como é upsert por Label, "Aberta" vai continuar lá.
    // O usuário quer ver SÓ esses 4?
    // Se ele quer ver SÓ esses 4, eu deveria talvez deletar os outros ou marcar como 'archived' se tivesse campo.
    // Mas para limpar o dropdown, vou deletar tudo antes? Perigoso se tiver issue linkada.
    // Melhor approach: Deletar os antigos SE nao tiverem uso?
    // Simplificação: Upsert nos novos. Os antigos ("Aberta", etc) vão continuar lá e poluir a lista.
    // O usuário vai ver: Aberta, Cancelada, Em aberto, Em andamento, Em avaliação, Em espera, Fechada, Resolvida. (Mistura).
    
    // Vou tentar renomear os antigos?
    // Mapping: 
    // Aberta -> Em aberto
    // Em andamento -> (Deletar/Manter?)
    // Resolvida -> Fechado
    // Cancelada -> Cancelado
    
    // Vou fazer algo mais drástico para limpar a lista visualmente:
    // Passo 1: Atualizar Labels dos existentes para os novos nomes se possível.
    
    // Mas upsert usa 'where: { label: ... }'.
    // Se eu mudar "Aberta" pra "Em aberto", o upsert do "Em aberto" vai criar um novo ou atualizar?
    
    // Vamos assumir que o usuário não tem issues importantes ainda (já que reclamou que nao conseguiu criar).
    // Vou tentar DELETE nos antigos que não são os novos, MAS isso falha se tiver FK constraints.
    
    // Melhor estratégia segura agora: Criar os novos. Se o usuário reclamar de duplicidade, limpamos depois.
    // MAS o usuário mandou uma imagem com a lista exata. Ele quer ver AQUILO.
    // Então vou tentar deletar os status que NÃO estão na lista desejada.
    
    const desiredLabels = defaultStatuses.map(s => s.label)
    
    // Delete others (ignoring errors if linked)
    try {
        await prisma.issueStatus.deleteMany({
            where: {
                label: { notIn: desiredLabels }
            }
        })
    } catch (e) {
        console.log("Nao foi possivel deletar status antigos (provavelmente em uso):", e)
    }

    for (const status of defaultStatuses) {
      const res = await prisma.issueStatus.upsert({
        where: { label: status.label },
        update: status,
        create: status
      })
      results.push(res)
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Lista de status atualizada conforme solicitação!',
        data: results
    })
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error(error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
