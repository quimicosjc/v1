import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolverOrdemDestaquesHome, type ConfigDestaquesHome } from '@/lib/destaques-home'

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
 * Localiza conteúdos com status 'programado' cujo publicado_em <= agora,
 * atualiza seu status para 'publicado' e reorganiza os destaques automáticos da Homepage.
 */
export async function GET(request: NextRequest) {
  // Blindagem de segurança (S05): exige CRON_SECRET estritamente configurado
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const agora = new Date().toISOString()

    // 1. Busca conteúdos elegíveis para publicação
    const { data: programados, error: searchError } = await supabase
      .from('conteudos')
      .select('id, tipo, titulo, slug, publicado_em')
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

    // 3. Reorganiza destaques da Homepage caso alguma notícia tenha sido publicada
    const noticiasPublicadasAgora = programados.filter((p) => p.tipo === 'noticia')
    if (noticiasPublicadasAgora.length > 0) {
      const [{ data: cfg }, { data: todasPublicadas }] = await Promise.all([
        supabase.from('site_config').select('valor, atualizado_em').eq('chave', 'destaques').maybeSingle(),
        supabase
          .from('conteudos')
          .select('id, slug, publicado_em, criado_em')
          .eq('tipo', 'noticia')
          .eq('status', 'publicado')
          .order('publicado_em', { ascending: false })
          .order('criado_em', { ascending: false })
          .limit(30),
      ])

      const valorCfg = (cfg?.valor || {}) as ConfigDestaquesHome
      const ordenadas = resolverOrdemDestaquesHome(todasPublicadas || [], {
        slots: Array.isArray(valorCfg.slots) ? valorCfg.slots : [],
        modo: valorCfg.modo === 'manual' ? 'manual' : 'automatico',
        atualizado_em: valorCfg.atualizado_em || cfg?.atualizado_em || null,
      })
      const novosSlots = ordenadas.slice(0, 5).map((n) => n.id)

      await supabase.from('site_config').upsert(
        {
          chave: 'destaques',
          valor: {
            slots: novosSlots,
            modo: valorCfg.modo === 'manual' ? 'manual' : 'automatico',
            atualizado_em: agora,
          },
          atualizado_em: agora,
        },
        { onConflict: 'chave' }
      )

      if (novosSlots.length > 0) {
        await supabase.from('conteudos').update({ destaque: true }).in('id', novosSlots)
        await supabase
          .from('conteudos')
          .update({ destaque: false })
          .eq('tipo', 'noticia')
          .eq('destaque', true)
          .not('id', 'in', `(${novosSlots.map((s) => `"${s}"`).join(',')})`)
      }

      revalidatePath('/')
      revalidatePath('/noticias')
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
