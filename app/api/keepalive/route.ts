import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Rota de keep-alive — evita que o Supabase entre em modo de espera.
 *
 * Executada automaticamente a cada 5 dias pelo Vercel Cron (vercel.json).
 * Faz uma consulta leve de 1 registro para manter o banco "acordado".
 *
 * Documentado em: DIARIO-DO-PROJETO.md → "toque automático"
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Consulta mínima — só verifica se o banco responde
    const { error } = await supabase
      .from('site_config')
      .select('chave')
      .limit(1)

    if (error) {
      console.error('[keepalive] Erro ao contactar banco:', error.message)
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      hora: new Date().toISOString(),
      mensagem: 'Banco ativo',
    })
  } catch (err) {
    console.error('[keepalive] Erro inesperado:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
