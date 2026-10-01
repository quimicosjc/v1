'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface SolicitacaoItem {
  id: string
  formulario_id: string
  formulario_slug: string
  formulario_nome: string
  protocolo: string
  situacao: 'recebida' | 'em_atendimento' | 'concluida' | 'nova' | 'tratada'
  processado: boolean
  nome?: string
  email?: string
  telefone?: string
  empresa?: string
  cidade?: string
  campos: Record<string, any>
  anexos?: { nome: string; url: string; tipo?: string; tamanho?: number }[]
  nota_interna?: string
  aviso_email?: 'enviado' | 'pendente' | 'falhou'
  criado_em: string
}

export interface FiltroSolicitacoes {
  tipo?: string      // slug do formulário ou 'todas'
  situacao?: string  // 'todas' | 'pendentes' | 'em_atendimento' | 'concluidas'
  busca?: string
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Obtém a contagem de solicitações pendentes para o badge no menu
 */
export async function obterContagemPendentes(): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('recebimentos')
      .select('id, processado, dados')

    if (error || !data) return 0

    return data.filter((item) => {
      if (item.processado === false) return true
      const situacao = item.dados?.situacao
      return situacao === 'recebida' || situacao === 'nova' || situacao === 'pendente'
    }).length
  } catch {
    return 0
  }
}

/**
 * Lista as solicitações recebidas com filtros
 */
export async function listarSolicitacoes(
  filtro: FiltroSolicitacoes = {}
): Promise<SolicitacaoItem[]> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    // Busca recebimentos com os dados do formulário
    const { data, error } = await supabaseAdmin
      .from('recebimentos')
      .select(`
        id,
        formulario_id,
        versao_id,
        dados,
        processado,
        criado_em,
        formularios (
          id,
          slug,
          nome
        )
      `)
      .order('criado_em', { ascending: false })

    if (error || !data) {
      console.error('Erro ao listar recebimentos:', error)
      return []
    }

    let itens: SolicitacaoItem[] = data.map((row: any) => {
      const fSlug = row.formularios?.slug || 'contato'
      const fNome = row.formularios?.nome || 'Formulário'
      const d = row.dados || {}

      const protocolo = d.protocolo || `PROT-${row.id.substring(0, 8).toUpperCase()}`
      const situacao = d.situacao || (row.processado ? 'concluida' : (fSlug === 'sindicalizacao' ? 'recebida' : 'nova'))

      return {
        id: row.id,
        formulario_id: row.formulario_id,
        formulario_slug: fSlug,
        formulario_nome: fNome,
        protocolo,
        situacao,
        processado: !!row.processado,
        nome: d.nome || d.campos?.nome || d.campos?.['Nome Completo'] || d.campos?.['Nome'],
        email: d.email || d.campos?.email || d.campos?.['E-mail'] || d.campos?.['Email'],
        telefone: d.telefone || d.campos?.telefone || d.campos?.celular || d.campos?.['Celular / WhatsApp'],
        empresa: d.empresa || d.campos?.empresa || d.campos?.['Empresa / Fábrica'] || d.campos?.['Empresa'],
        cidade: d.cidade || d.campos?.cidade || d.campos?.['Cidade'],
        campos: d.campos || d,
        anexos: Array.isArray(d.anexos) ? d.anexos : [],
        nota_interna: d.nota_interna || '',
        aviso_email: d.aviso_email || 'enviado',
        criado_em: row.criado_em,
      }
    })

    // Filtro por tipo (formulário)
    if (filtro.tipo && filtro.tipo !== 'todas') {
      itens = itens.filter((i) => i.formulario_slug === filtro.tipo)
    }

    // Filtro por situação
    if (filtro.situacao && filtro.situacao !== 'todas') {
      if (filtro.situacao === 'pendentes') {
        itens = itens.filter((i) => i.situacao === 'recebida' || i.situacao === 'nova')
      } else if (filtro.situacao === 'em_atendimento') {
        itens = itens.filter((i) => i.situacao === 'em_atendimento')
      } else if (filtro.situacao === 'concluidas') {
        itens = itens.filter((i) => i.situacao === 'concluida' || i.situacao === 'tratada')
      }
    }

    // Filtro por busca textual
    if (filtro.busca) {
      const termo = filtro.busca.toLowerCase().trim()
      itens = itens.filter((i) => {
        return (
          i.protocolo.toLowerCase().includes(termo) ||
          (i.nome && i.nome.toLowerCase().includes(termo)) ||
          (i.email && i.email.toLowerCase().includes(termo)) ||
          (i.empresa && i.empresa.toLowerCase().includes(termo)) ||
          (i.cidade && i.cidade.toLowerCase().includes(termo))
        )
      })
    }

    return itens
  } catch (err) {
    console.error('Erro em listarSolicitacoes:', err)
    return []
  }
}

/**
 * Atualiza a situação de atendimento de uma solicitação
 */
export async function atualizarSituacaoSolicitacao(
  id: string,
  novaSituacao: 'recebida' | 'em_atendimento' | 'concluida' | 'nova' | 'tratada',
  notaInterna?: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: atual, error: buscaErr } = await supabaseAdmin
      .from('recebimentos')
      .select('dados, processado')
      .eq('id', id)
      .single()

    if (buscaErr || !atual) {
      return { error: 'Solicitação não encontrada.' }
    }

    const novosDados = {
      ...(atual.dados || {}),
      situacao: novaSituacao,
    }

    if (notaInterna !== undefined) {
      novosDados.nota_interna = notaInterna
    }

    const isConcluida = novaSituacao === 'concluida' || novaSituacao === 'tratada'

    const { error: updErr } = await supabaseAdmin
      .from('recebimentos')
      .update({
        dados: novosDados,
        processado: isConcluida,
      })
      .eq('id', id)

    if (updErr) {
      return { error: `Erro ao atualizar situação: ${updErr.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Salva anotação interna na solicitação
 */
export async function salvarNotaInterna(
  id: string,
  nota: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: atual, error: buscaErr } = await supabaseAdmin
      .from('recebimentos')
      .select('dados')
      .eq('id', id)
      .single()

    if (buscaErr || !atual) return { error: 'Solicitação não encontrada.' }

    const novosDados = {
      ...(atual.dados || {}),
      nota_interna: nota,
    }

    const { error: updErr } = await supabaseAdmin
      .from('recebimentos')
      .update({ dados: novosDados })
      .eq('id', id)

    if (updErr) return { error: `Erro ao salvar nota: ${updErr.message}` }
    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Reenvia o aviso por e-mail (simulação com atualização do status de envio)
 */
export async function reenviarAvisoEmail(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: atual } = await supabaseAdmin
      .from('recebimentos')
      .select('dados')
      .eq('id', id)
      .single()

    if (!atual) return { error: 'Solicitação não encontrada.' }

    const novosDados = {
      ...(atual.dados || {}),
      aviso_email: 'enviado',
      aviso_reenviado_em: new Date().toISOString(),
    }

    await supabaseAdmin
      .from('recebimentos')
      .update({ dados: novosDados })
      .eq('id', id)

    return { ok: true }
  } catch (err) {
    return { error: `Erro ao reenviar aviso: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Exclui uma solicitação do histórico (exclusivo do Administrador)
 */
export async function excluirSolicitacao(id: string): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (usuario.papel !== 'admin_ti') {
      return { error: 'Apenas Administradores podem excluir solicitações recebidas.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('recebimentos').delete().eq('id', id)

    if (error) return { error: `Erro ao excluir: ${error.message}` }
    return { ok: true }
  } catch (err) {
    return { error: `Erro: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Exporta solicitações em formato CSV
 * REGRA DE OURO (Sugestão 2): Denúncias NUNCA entram em exportação geral por padrão.
 * Somente serão exportadas se o filtro tipo === 'denuncia' for explicitamente solicitado.
 */
export async function exportarSolicitacoesCSV(filtroTipo?: string): Promise<string> {
  const itens = await listarSolicitacoes({ tipo: filtroTipo })

  // Filtro de segurança: remove denúncias caso não seja a aba exclusiva de denúncias
  const filtrados = itens.filter((item) => {
    if (item.formulario_slug === 'denuncia') {
      return filtroTipo === 'denuncia'
    }
    return true
  })

  const colunas = ['Protocolo', 'Tipo', 'Data', 'Solicitante', 'E-mail', 'Telefone', 'Empresa', 'Cidade', 'Situação']
  const linhas = filtrados.map((i) => [
    `"${i.protocolo}"`,
    `"${i.formulario_nome}"`,
    `"${new Date(i.criado_em).toLocaleDateString('pt-BR')} ${new Date(i.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}"`,
    `"${(i.nome || (i.formulario_slug === 'denuncia' ? 'Sigiloso / Anônimo' : '')).replace(/"/g, '""')}"`,
    `"${(i.email || '').replace(/"/g, '""')}"`,
    `"${(i.telefone || '').replace(/"/g, '""')}"`,
    `"${(i.empresa || '').replace(/"/g, '""')}"`,
    `"${(i.cidade || '').replace(/"/g, '""')}"`,
    `"${i.situacao.toUpperCase()}"`,
  ])

  return [colunas.join(';'), ...linhas.map((l) => l.join(';'))].join('\n')
}
