'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  getUsuarioLogado,
  obterSlugsSolicitacoesPermitidos,
  podeAcessarSolicitacaoPorSlug,
  temPermissao,
} from '@/lib/supabase/auth'
import { enviarAvisoRecebimento, enviarAvisoDenuncia } from '@/lib/email/resend'

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
  anexos?: { nome: string; url: string; tipo?: string; tamanho?: number; path?: string }[]
  nota_interna?: string
  aviso_email?: 'enviado' | 'pendente' | 'falhou'
  criado_em: string
  pode_editar?: boolean
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
 * Neutraliza caracteres de fórmula no CSV (proteção contra CSV Injection)
 */
function sanitizarCelulaCSV(valor: unknown): string {
  const s = String(valor ?? '').replace(/"/g, '""')
  if (/^[=+\-@\t\r]/.test(s)) {
    return `"'${s}"`
  }
  return `"${s}"`
}

/**
 * Obtém a contagem de solicitações pendentes para o badge no menu.
 * Respeita estritamente as categorias para as quais o usuário possui autorização.
 */
export async function obterContagemPendentes(): Promise<number> {
  try {
    const usuarioLogado = await getUsuarioLogado()
    const slugsPermitidos = obterSlugsSolicitacoesPermitidos(usuarioLogado, 'consultar')
    if (slugsPermitidos.length === 0) return 0

    const permitidosSet = new Set(slugsPermitidos)
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('recebimentos')
      .select('id, processado, dados, formularios(slug)')

    if (error || !data) return 0

    return data.filter((item: any) => {
      const fSlug = item.formularios?.slug || item.dados?.tipo || 'contato'
      if (!permitidosSet.has(fSlug)) return false

      if (item.processado === false) return true
      const situacao = item.dados?.situacao
      return situacao === 'recebida' || situacao === 'nova' || situacao === 'pendente'
    }).length
  } catch {
    return 0
  }
}

/**
 * Lista as solicitações recebidas com filtros.
 * Controle estrito no servidor: entrega apenas registros cujas categorias o usuário
 * possui permissão explícita para consultar.
 */
export async function listarSolicitacoes(
  filtro: FiltroSolicitacoes = {}
): Promise<SolicitacaoItem[]> {
  try {
    const usuarioLogado = await getUsuarioLogado()
    const slugsPermitidos = obterSlugsSolicitacoesPermitidos(usuarioLogado, 'consultar')

    if (slugsPermitidos.length === 0) {
      return []
    }

    const permitidosSet = new Set(slugsPermitidos)

    // Se o cliente pedir explicitamente um tipo não autorizado, rejeita imediatamente
    if (filtro.tipo && filtro.tipo !== 'todas' && filtro.tipo !== 'outras') {
      if (!permitidosSet.has(filtro.tipo)) {
        return []
      }
    }

    const supabaseAdmin = getSupabaseAdmin()

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

    let itens: SolicitacaoItem[] = data
      .filter((row: any) => {
        const fSlug = row.formularios?.slug || row.dados?.tipo || 'contato'
        return permitidosSet.has(fSlug)
      })
      .map((row: any) => {
        const fSlug = row.formularios?.slug || row.dados?.tipo || 'contato'
        const fNome = row.formularios?.nome || 'Formulário'
        const d = row.dados || {}

        const protocolo = d.protocolo || `PROT-${row.id.substring(0, 8).toUpperCase()}`
        const situacao =
          d.situacao ||
          (row.processado ? 'concluida' : fSlug === 'sindicalizacao' ? 'recebida' : 'nova')

        const anexosLimpos = Array.isArray(d.anexos)
          ? d.anexos.map((a: any) => ({
              nome: String(a.nome || 'Arquivo'),
              url: '', // Anexos privados são resolvidos sob demanda com URL temporária segura
              tipo: a.tipo,
              tamanho: a.tamanho,
              path: a.path,
            }))
          : []

        const camposBase = d.campos && typeof d.campos === 'object' ? { ...d.campos } : { ...d }
        // Nunca expor URLs diretas de fotos privadas na listagem; usar assinatura sob demanda
        if (camposBase.foto_path) {
          camposBase.foto_url = null
        }

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
          telefone:
            d.telefone || d.campos?.telefone || d.campos?.celular || d.campos?.['Celular / WhatsApp'],
          empresa:
            d.empresa || d.campos?.empresa || d.campos?.['Empresa / Fábrica'] || d.campos?.['Empresa'],
          cidade: d.cidade || d.campos?.cidade || d.campos?.['Cidade'],
          campos: camposBase,
          anexos: anexosLimpos,
          nota_interna: d.nota_interna || '',
          aviso_email: d.aviso_email || 'enviado',
          criado_em: row.criado_em,
          pode_editar: podeAcessarSolicitacaoPorSlug(usuarioLogado, fSlug, 'editar'),
        }
      })

    // Filtro por tipo (formulário)
    if (filtro.tipo && filtro.tipo !== 'todas') {
      if (filtro.tipo === 'outras') {
        itens = itens.filter(
          (i) => i.formulario_slug === 'juridico' || i.formulario_slug === 'contato'
        )
      } else {
        itens = itens.filter((i) => i.formulario_slug === filtro.tipo)
      }
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
 * Gera URL temporária assinada (validade curta de 120 segundos) para acesso a anexos
 * ou fotos armazenadas no bucket privado (conformidade LGPD / anti-IDOR).
 */
export async function obterUrlAnexoPrivado(
  solicitacaoId: string,
  path: string
): Promise<{ url: string } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (!solicitacaoId || !path || path.includes('..')) {
      return { error: 'Referência de arquivo inválida.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: row, error: buscaErr } = await supabaseAdmin
      .from('recebimentos')
      .select('id, dados, formularios(slug)')
      .eq('id', solicitacaoId)
      .single()

    if (buscaErr || !row) {
      return { error: 'Solicitação não encontrada.' }
    }

    const fSlug = (row.formularios as any)?.slug || row.dados?.tipo || 'contato'
    if (!podeAcessarSolicitacaoPorSlug(usuario, fSlug, 'consultar')) {
      return { error: 'Acesso negado: você não possui autorização para abrir arquivos desta categoria.' }
    }

    // Valida estritamente que o caminho solicitado pertence a este registro (anti-IDOR)
    const d = row.dados || {}
    const caminhosDoRegistro = new Set<string>()
    if (typeof d.foto_path === 'string' && d.foto_path) caminhosDoRegistro.add(d.foto_path)
    if (typeof d.campos?.foto_path === 'string' && d.campos.foto_path) {
      caminhosDoRegistro.add(d.campos.foto_path)
    }
    if (Array.isArray(d.anexos)) {
      for (const a of d.anexos) {
        if (typeof a?.path === 'string' && a.path) caminhosDoRegistro.add(a.path)
      }
    }

    if (!caminhosDoRegistro.has(path)) {
      return { error: 'O arquivo informado não pertence a esta solicitação.' }
    }

    const { data: signData, error: signErr } = await supabaseAdmin.storage
      .from('privado')
      .createSignedUrl(path, 120)

    if (signErr || !signData?.signedUrl) {
      return { error: 'Não foi possível gerar o link temporário seguro para o arquivo.' }
    }

    return { url: signData.signedUrl }
  } catch (err) {
    return { error: `Erro ao acessar arquivo: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Atualiza a situação de atendimento de uma solicitação.
 * Sempre consulta o registro original no banco e valida permissão por categoria no servidor.
 */
export async function atualizarSituacaoSolicitacao(
  id: string,
  novaSituacao: 'recebida' | 'em_atendimento' | 'concluida' | 'nova' | 'tratada',
  notaInterna?: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: atual, error: buscaErr } = await supabaseAdmin
      .from('recebimentos')
      .select('dados, formularios(slug)')
      .eq('id', id)
      .single()

    if (buscaErr || !atual) {
      return { error: 'Solicitação não encontrada.' }
    }

    const fSlug = (atual.formularios as any)?.slug || atual.dados?.tipo || 'contato'
    if (!podeAcessarSolicitacaoPorSlug(usuario, fSlug, 'editar')) {
      return { error: 'Você não tem permissão para alterar a situação desta categoria de solicitação.' }
    }

    const baseDados = atual.dados && typeof atual.dados === 'object' ? atual.dados : {}
    const novosDados: Record<string, any> = {
      ...baseDados,
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
 * Salva anotação interna na solicitação.
 * Sempre consulta o registro original no banco e valida permissão por categoria no servidor.
 */
export async function salvarNotaInterna(
  id: string,
  nota: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: atual, error: buscaErr } = await supabaseAdmin
      .from('recebimentos')
      .select('dados, formularios(slug)')
      .eq('id', id)
      .single()

    if (buscaErr || !atual) {
      return { error: 'Solicitação não encontrada.' }
    }

    const fSlug = (atual.formularios as any)?.slug || atual.dados?.tipo || 'contato'
    if (!podeAcessarSolicitacaoPorSlug(usuario, fSlug, 'editar')) {
      return { error: 'Você não tem permissão para adicionar notas nesta categoria de solicitação.' }
    }

    const baseDados = atual.dados && typeof atual.dados === 'object' ? atual.dados : {}
    const novosDados: Record<string, any> = {
      ...baseDados,
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
 * Reenvia a notificação interna por e-mail para a equipe do Sindicato via Resend (R01).
 */
export async function reenviarAvisoEmail(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: row } = await supabaseAdmin
      .from('recebimentos')
      .select('id, formulario_id, dados, formularios(slug, nome)')
      .eq('id', id)
      .single()

    if (!row) return { error: 'Solicitação não encontrada.' }

    const fSlug = (row.formularios as any)?.slug || row.dados?.tipo || 'contato'
    const fNome = (row.formularios as any)?.nome || 'Formulário'
    const d = row.dados || {}

    if (!podeAcessarSolicitacaoPorSlug(usuario, fSlug, 'editar')) {
      return { error: 'Você não tem permissão para reenviar avisos desta categoria.' }
    }

    if (fSlug === 'denuncia') {
      const resEmail = await enviarAvisoDenuncia({
        protocolo: d.protocolo || 'PROT-DEN',
        empresa: d.empresa || 'Empresa não informada',
        tipoInfracao: d.tipo_infracao || 'Irregularidade Trabalhista',
        relato: d.relato || '',
        sigilo: d.sigilo || 'anonimo',
        nome: d.nome,
        contato: d.contato,
        anexos: d.anexos || [],
      })

      const novosDados = {
        ...d,
        aviso_email: resEmail.ok ? 'enviado' : 'falhou',
        aviso_reenviado_em: new Date().toISOString(),
      }
      await supabaseAdmin.from('recebimentos').update({ dados: novosDados }).eq('id', id)

      if (!resEmail.ok) {
        return { error: `Falha ao reenviar notificação: ${resEmail.erro || 'Erro no serviço de e-mail'}` }
      }
      return { ok: true }
    }

    const resEmail = await enviarAvisoRecebimento({
      protocolo: d.protocolo || 'PROT',
      formularioNome: fNome,
      nomeTrabalhador: d.nome,
      emailTrabalhador: d.email,
      telefoneTrabalhador: d.telefone,
      empresa: d.empresa,
      dados: d,
    })

    const novosDados = {
      ...d,
      aviso_email: resEmail.ok ? 'enviado' : 'falhou',
      aviso_reenviado_em: new Date().toISOString(),
    }
    await supabaseAdmin.from('recebimentos').update({ dados: novosDados }).eq('id', id)

    if (!resEmail.ok) {
      return { error: `Falha ao reenviar notificação: ${resEmail.erro || 'Erro no serviço de e-mail'}` }
    }
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
    if (!temPermissao(usuario, 'solicitacoes', 'excluir')) {
      return { error: 'Você não tem permissão para excluir solicitações recebidas.' }
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
 * Exporta solicitações em formato CSV respeitando permissões granulares no servidor.
 * REGRA DE OURO: Denúncias NUNCA entram em exportação geral por padrão.
 * Somente serão exportadas se `filtroTipo === 'denuncia'` E o usuário possuir permissão explícita para denúncias.
 */
export async function exportarSolicitacoesCSV(filtroTipo?: string): Promise<string> {
  const usuario = await getUsuarioLogado()

  if (filtroTipo && filtroTipo !== 'todas' && filtroTipo !== 'outras') {
    if (!podeAcessarSolicitacaoPorSlug(usuario, filtroTipo, 'consultar')) {
      return ''
    }
  }

  const itens = await listarSolicitacoes({ tipo: filtroTipo })

  const filtrados = itens.filter((item) => {
    if (item.formulario_slug === 'denuncia') {
      return filtroTipo === 'denuncia' && podeAcessarSolicitacaoPorSlug(usuario, 'denuncia', 'consultar')
    }
    return true
  })

  const colunas = ['Protocolo', 'Tipo', 'Data', 'Solicitante', 'E-mail', 'Telefone', 'Empresa', 'Cidade', 'Situação']
  const linhas = filtrados.map((i) => [
    sanitizarCelulaCSV(i.protocolo),
    sanitizarCelulaCSV(i.formulario_nome),
    sanitizarCelulaCSV(
      `${new Date(i.criado_em).toLocaleDateString('pt-BR')} ${new Date(i.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    ),
    sanitizarCelulaCSV(i.nome || (i.formulario_slug === 'denuncia' ? 'Sigiloso / Anônimo' : '')),
    sanitizarCelulaCSV(i.email || ''),
    sanitizarCelulaCSV(i.telefone || ''),
    sanitizarCelulaCSV(i.empresa || ''),
    sanitizarCelulaCSV(i.cidade || ''),
    sanitizarCelulaCSV(i.situacao.toUpperCase()),
  ])

  return [colunas.join(';'), ...linhas.map((l) => l.join(';'))].join('\n')
}
