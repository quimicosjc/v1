'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface PublicacaoJornal {
  id: string
  nome: string
  cor_hex: string
  ativo: boolean
  ordem: number
  criado_em: string
}

export interface EdicaoJornal {
  id: string
  publicacao_id: string
  publicacao_nome?: string
  publicacao_cor?: string
  numero: string | number
  complemento?: string | null
  data_edicao: string | null
  titulo: string | null
  subtitulo: string | null
  pdf_url: string | null
  capa_url: string | null
  status: 'rascunho' | 'publicado'
  criado_em: string
  atualizado_em?: string
}

export interface EdicaoFormData {
  publicacao_id: string
  numero: string | number
  complemento?: string | null
  data_edicao: string | null
  titulo?: string | null
  subtitulo?: string | null
  pdf_url?: string | null
  capa_url?: string | null
  status: 'rascunho' | 'publicado'
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Publicação padrão de fallback
 */
const PUBLICACAO_PADRAO: PublicacaoJornal = {
  id: '00000000-0000-0000-0000-000000000001',
  nome: 'Boca no Trombone',
  cor_hex: '#65172A',
  ativo: true,
  ordem: 1,
  criado_em: new Date().toISOString(),
}

/**
 * Lista as publicações cadastradas
 */
export async function listarPublicacoes(): Promise<PublicacaoJornal[]> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('publicacoes_jornal')
      .select('id, nome, descricao, criado_em')
      .order('nome', { ascending: true })

    if (error || !data || data.length === 0) {
      return [PUBLICACAO_PADRAO]
    }

    return data.map((item: any, idx: number) => ({
      id: item.id,
      nome: item.nome,
      cor_hex: '#65172A',
      ativo: true,
      ordem: idx + 1,
      criado_em: item.criado_em,
    }))
  } catch (err) {
    console.error('Erro ao listar publicações:', err)
    return [PUBLICACAO_PADRAO]
  }
}

/**
 * Cadastra uma nova publicação (ex: "Boca no Trombone", "O Químico")
 */
export async function criarPublicacao(data: {
  nome: string
  cor_hex?: string
}): Promise<{ ok: boolean; id?: string } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (usuario.papel === 'operador') {
      return { error: 'Apenas Gestores ou Administradores podem cadastrar publicações.' }
    }

    if (!data.nome?.trim()) {
      return { error: 'O nome da publicação é obrigatório.' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: pub, error } = await supabaseAdmin
      .from('publicacoes_jornal')
      .insert({
        nome: data.nome.trim(),
        descricao: data.cor_hex?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao cadastrar publicação:', error)
      return { error: `Erro ao salvar publicação: ${error.message}` }
    }

    return { ok: true, id: pub.id }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Lista edições de jornal com filtros e ordenação
 */
export async function listarEdicoes(filtro: {
  publicacao_id?: string
  status?: string
  busca?: string
}): Promise<EdicaoJornal[]> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('edicoes_jornal')
      .select(`
        id,
        publicacao_id,
        numero,
        mes_ano,
        capa_url,
        pdf_url,
        status,
        data_publicacao,
        criado_em,
        atualizado_em,
        publicacoes_jornal (
          nome
        )
      `)
      .order('criado_em', { ascending: false })

    if (filtro.publicacao_id && filtro.publicacao_id !== 'todas') {
      query = query.eq('publicacao_id', filtro.publicacao_id)
    }

    if (filtro.status && filtro.status !== 'todas') {
      query = query.eq('status', filtro.status)
    }

    if (filtro.busca) {
      const termo = filtro.busca.trim()
      query = query.or(`numero.ilike.%${termo}%,mes_ano.ilike.%${termo}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar edições:', error)
      return []
    }

    return (data || []).map((item: any) => {
      const pubNome = item.publicacoes_jornal?.nome || 'Boca no Trombone'
      return {
        id: item.id,
        publicacao_id: item.publicacao_id,
        publicacao_nome: pubNome,
        publicacao_cor: '#65172A',
        numero: item.numero,
        complemento: item.mes_ano || '',
        data_edicao: item.data_publicacao || item.criado_em?.split('T')[0] || null,
        titulo: `${pubNome} — Edição nº ${item.numero}`,
        subtitulo: item.mes_ano || null,
        pdf_url: item.pdf_url,
        capa_url: item.capa_url,
        status: (item.status === 'publicado' ? 'publicado' : 'rascunho') as 'publicado' | 'rascunho',
        criado_em: item.criado_em,
        atualizado_em: item.atualizado_em,
      }
    })
  } catch (err) {
    console.error('Erro inesperado em listarEdicoes:', err)
    return []
  }
}

/**
 * Cria uma nova edição de jornal
 */
export async function criarEdicao(
  data: EdicaoFormData
): Promise<{ ok: boolean; id?: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    if (!data.publicacao_id) {
      return { error: 'Selecione a publicação (jornal).' }
    }

    const numStr = String(data.numero ?? '').trim()
    if (!numStr) {
      return { error: 'Informe o número da edição.' }
    }

    if (data.status === 'publicado') {
      if (!data.pdf_url) {
        return { error: 'O arquivo PDF da edição é obrigatório para publicar.' }
      }
    }

    // Calcula mes_ano
    let mesAno = data.complemento?.trim()
    if (!mesAno && data.data_edicao) {
      const d = new Date(data.data_edicao + 'T00:00:00')
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      mesAno = `${meses[d.getMonth()]}/${d.getFullYear()}`
    }
    if (!mesAno) mesAno = 'Edição Regular'

    const dataPub = data.data_edicao || new Date().toISOString().split('T')[0]

    const { data: novaEdicao, error } = await supabaseAdmin
      .from('edicoes_jornal')
      .insert({
        publicacao_id: data.publicacao_id,
        numero: numStr,
        mes_ano: mesAno,
        data_publicacao: dataPub,
        pdf_url: data.pdf_url || '',
        capa_url: data.capa_url || null,
        status: data.status,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao criar edição:', error)
      return { error: `Erro no banco de dados: ${error.message}` }
    }

    return { ok: true, id: novaEdicao.id }
  } catch (err) {
    console.error('Erro inesperado em criarEdicao:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Atualiza uma edição existente
 */
export async function atualizarEdicao(
  id: string,
  data: Partial<EdicaoFormData>
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    if (data.status === 'publicado') {
      if (data.pdf_url === null || data.pdf_url === '') {
        return { error: 'O arquivo PDF da edição é obrigatório para publicar.' }
      }
    }

    const updatePayload: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (data.publicacao_id !== undefined) updatePayload.publicacao_id = data.publicacao_id
    if (data.numero !== undefined) updatePayload.numero = String(data.numero).trim()
    if (data.complemento !== undefined) updatePayload.mes_ano = data.complemento?.trim() || 'Edição Regular'
    if (data.data_edicao !== undefined) updatePayload.data_publicacao = data.data_edicao || new Date().toISOString().split('T')[0]
    if (data.pdf_url !== undefined) updatePayload.pdf_url = data.pdf_url || ''
    if (data.capa_url !== undefined) updatePayload.capa_url = data.capa_url || null
    if (data.status !== undefined) updatePayload.status = data.status

    const { error } = await supabaseAdmin
      .from('edicoes_jornal')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar edição:', error)
      return { error: `Erro ao salvar: ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Exclui uma edição de jornal (exclusivo do Administrador)
 */
export async function excluirEdicao(id: string): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (usuario.papel !== 'admin_ti') {
      return { error: 'Apenas Administradores podem excluir edições do acervo.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('edicoes_jornal')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir edição:', error)
      return { error: `Erro ao excluir: ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Upload de arquivo PDF ou Imagem de Capa para Supabase Storage
 */
export async function uploadArquivoJornal(
  formData: FormData,
  tipo: 'pdf' | 'capa'
): Promise<{ url: string; nome: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const file = formData.get('arquivo') as File | null
    if (!file) return { error: 'Nenhum arquivo enviado.' }

    const supabaseAdmin = getSupabaseAdmin()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop()?.toLowerCase() || (tipo === 'pdf' ? 'pdf' : 'jpg')
    const pasta = tipo === 'pdf' ? 'jornais/pdf' : 'jornais/capas'
    const caminho = `${pasta}/${timestamp}-${random}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const bucketName = 'midia'

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(caminho, buffer, {
        contentType: file.type || (tipo === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        upsert: false,
      })

    if (error) {
      console.error('Erro no upload de jornal:', error)
      return { error: `Falha no upload: ${error.message}` }
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(caminho)

    return { url: publicUrlData.publicUrl, nome: file.name }
  } catch (err) {
    return { error: `Erro no upload: ${err instanceof Error ? err.message : String(err)}` }
  }
}
