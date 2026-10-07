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
 * Cron Job Diário de Manutenção Unificada
 * Totalmente compatível com o plano Hobby da Vercel (1 execução diária).
 * Realiza:
 * 1. Publicação de matérias programadas pendentes
 * 2. Limpeza de itens na lixeira há mais de 60 dias
 * 3. Keepalive do Supabase para evitar hibernação
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const agora = new Date().toISOString()
  const resultados: Record<string, any> = { executado_em: agora }

  try {
    const supabase = getSupabaseAdmin()

    // 1. PUBLICAÇÃO DE MATÉRIAS AGENDADAS
    const { data: programados } = await supabase
      .from('conteudos')
      .select('id, slug')
      .eq('status', 'programado')
      .lte('publicado_em', agora)

    if (programados && programados.length > 0) {
      const ids = programados.map((p) => p.id)
      await supabase
        .from('conteudos')
        .update({ status: 'publicado', atualizado_em: agora })
        .in('id', ids)
      resultados.publicados = ids.length
    } else {
      resultados.publicados = 0
    }

    // 2. EXPURGO DA LIXEIRA (60 DIAS)
    const limite60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data: lixeiraExpirados } = await supabase
      .from('conteudos')
      .select('id')
      .eq('status', 'lixeira')
      .lte('atualizado_em', limite60d)

    if (lixeiraExpirados && lixeiraExpirados.length > 0) {
      const ids = lixeiraExpirados.map((item) => item.id)
      await supabase.from('conteudos').delete().in('id', ids)
      resultados.expurgados_lixeira = ids.length
    } else {
      resultados.expurgados_lixeira = 0
    }

    // 3. TOQUE KEEPALIVE NO BANCO
    await supabase.from('site_config').select('chave').limit(1)
    resultados.banco_ativo = true

    return NextResponse.json({ ok: true, ...resultados })
  } catch (err: any) {
    console.error('[cron/manutencao] Erro:', err)
    return NextResponse.json({ ok: false, erro: err?.message || 'Falha na manutenção' }, { status: 500 })
  }
}
