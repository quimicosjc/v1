import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Rota de keep-alive — evita que o Supabase entre em modo de espera (hibernação).
 *
 * Executada automaticamente todos os dias pelo Vercel Cron (vercel.json).
 * Faz leitura e gravação leve de batimento cardíaco para manter o banco ativo.
 */
export async function GET() {
  const agora = new Date().toISOString()

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase =
      supabaseUrl && serviceKey
        ? createServiceClient(supabaseUrl, serviceKey)
        : await createClient()

    // 1. Consulta leve em site_config e conteudos
    const { error } = await supabase
      .from('site_config')
      .select('chave')
      .limit(1)

    if (error) {
      console.error('[keepalive] Erro ao contactar banco:', error.message)
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
    }

    // 2. Grava batimento cardíaco (heartbeat) para garantir atividade de escrita no PostgreSQL
    try {
      await supabase.from('site_config').upsert(
        {
          chave: 'keepalive_heartbeat',
          valor: { ultimo_toque: agora, origem: 'vercel-cron-keepalive' },
          atualizado_em: agora,
        },
        { onConflict: 'chave' }
      )
    } catch {
      // Ignora caso a tabela não aceite escrita com chave anônima
    }

    return NextResponse.json({
      ok: true,
      hora: agora,
      mensagem: 'Banco ativo',
    })
  } catch (err) {
    console.error('[keepalive] Erro inesperado:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

