'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'

export interface InscricaoItem {
  id: string
  nome: string
  email: string
  ativo: boolean
  criado_em: string
}

export interface FiltroInscricoes {
  status?: 'todas' | 'ativas' | 'canceladas'
  busca?: string
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Lista as inscrições para notícias cadastradas
 */
export async function listarInscricoes(
  filtro: FiltroInscricoes = {}
): Promise<InscricaoItem[]> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('inscricoes_noticias')
      .select('id, nome, email, ativo, criado_em')
      .order('criado_em', { ascending: false })

    if (filtro.status && filtro.status !== 'todas') {
      query = query.eq('ativo', filtro.status === 'ativas')
    }

    if (filtro.busca && filtro.busca.trim()) {
      const termo = filtro.busca.trim()
      query = query.or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`)
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('Erro ao listar inscrições:', error)
      return []
    }

    return data as InscricaoItem[]
  } catch (err) {
    console.error('Erro inesperado em listarInscricoes:', err)
    return []
  }
}

/**
 * Alterna o status da inscrição entre Ativa e Cancelada
 */
export async function alternarStatusInscricao(
  id: string,
  novoAtivo: boolean
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('inscricoes_noticias')
      .update({ ativo: novoAtivo })
      .eq('id', id)

    if (error) {
      return { error: `Erro ao atualizar status: ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Exclui uma inscrição do banco (exclusivo do Administrador)
 */
export async function excluirInscricao(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'inscricoes', 'excluir')) {
      return { error: 'Você não tem permissão para excluir cadastros de notícias.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('inscricoes_noticias')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: `Erro ao excluir inscrição: ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Obtém todos os e-mails ativos para cópia direta (Sugestão 4)
 */
export async function obterEmailsAtivos(): Promise<string[]> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('inscricoes_noticias')
      .select('email')
      .eq('ativo', true)
      .order('email', { ascending: true })

    if (error || !data) return []

    return data.map((d: any) => d.email).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Exporta as inscrições em formato CSV
 */
export async function exportarInscricoesCSV(filtroStatus?: string): Promise<string> {
  const itens = await listarInscricoes({ status: filtroStatus as any })

  const colunas = ['Nome', 'E-mail', 'Data de Inscrição', 'Situação']
  const linhas = itens.map((i) => [
    `"${(i.nome || '').replace(/"/g, '""')}"`,
    `"${(i.email || '').replace(/"/g, '""')}"`,
    `"${new Date(i.criado_em).toLocaleDateString('pt-BR')}"`,
    `"${i.ativo ? 'ATIVA' : 'CANCELADA'}"`,
  ])

  return [colunas.join(';'), ...linhas.map((l) => l.join(';'))].join('\n')
}
