import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Job: Publicação de matérias programadas
 * Executado a cada 10 minutos pelo Vercel Cron.
 * Localiza conteúdos com status 'programado' cujo publicado_em <= agora
 * e atualiza seu status para 'publicado'.
 */
export async function GET(request: NextRequest) {
  // Verificação de segurança: autorização via CRON_SECRET se configurado
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const agora = new Date().toISOString()

    // 1. Busca conteúdos elegíveis para publicação
    const { data: programados, error: searchError } = await supabase
      .from('conteudos')
      .select('id, titulo, slug, publicado_em')
      .eq('status', 'programado')
      .lte('publicado_em', agora)

    if (searchError) {
      console.error('[cron/publicar] Erro ao buscar agendados:', searchError.message)
      return NextResponse.json({ ok: false, error: searchError.message }, { status: 500 })
    }

    if (!programados || programados.length === 0) {
      return NextResponse.json({
        ok: true,
        mensagem: 'Nenhum conteúdo aguardando publicação no momento',
        publicados: 0,
        verificado_em: agora,
      })
    }

    // 2. Atualiza o status para 'publicado'
    const ids = programados.map((item) => item.id)
    const { error: updateError } = await supabase
      .from('conteudos')
      .update({
        status: 'publicado',
        atualizado_em: agora,
      })
      .in('id', ids)

    if (updateError) {
      console.error('[cron/publicar] Erro ao atualizar status:', updateError.message)
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    console.log(`[cron/publicar] Sucesso: ${ids.length} conteúdos publicados:`, programados.map((p) => p.slug))

    return NextResponse.json({
      ok: true,
      mensagem: `${ids.length} conteúdos publicados com sucesso`,
      publicados: ids.length,
      itens: programados.map((p) => ({ id: p.id, slug: p.slug, titulo: p.titulo })),
      processado_em: agora,
    })
  } catch (err) {
    console.error('[cron/publicar] Erro inesperado:', err)
    return NextResponse.json({ ok: false, error: 'Erro interno ao processar publicação' }, { status: 500 })
  }
}
