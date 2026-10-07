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
 * Cron Job: Limpeza automática da lixeira (retenção de 60 dias)
 * Executado diariamente pelo Vercel Cron.
 * Remove definitivamente conteúdos com status 'lixeira'
 * que foram atualizados há mais de 60 dias.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // Data limite: 60 dias atrás
    const limite = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const { data: expirados, error: searchError } = await supabase
      .from('conteudos')
      .select('id, titulo, slug, atualizado_em')
      .eq('status', 'lixeira')
      .lte('atualizado_em', limite)

    if (searchError) {
      console.error('[cron/lixeira] Erro ao buscar itens expirados:', searchError.message)
      return NextResponse.json({ ok: false, error: searchError.message }, { status: 500 })
    }

    if (!expirados || expirados.length === 0) {
      return NextResponse.json({
        ok: true,
        mensagem: 'Nenhum item na lixeira com mais de 60 dias',
        expurgados: 0,
      })
    }

    const ids = expirados.map((item) => item.id)
    const { error: deleteError } = await supabase
      .from('conteudos')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('[cron/lixeira] Erro ao expurgar itens:', deleteError.message)
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      mensagem: `${ids.length} itens expurgados da lixeira com sucesso`,
      expurgados: ids.length,
      itens: expirados.map((p) => ({ id: p.id, slug: p.slug, titulo: p.titulo })),
    })
  } catch (err) {
    console.error('[cron/lixeira] Erro inesperado:', err)
    return NextResponse.json({ ok: false, error: 'Erro interno ao processar lixeira' }, { status: 500 })
  }
}
