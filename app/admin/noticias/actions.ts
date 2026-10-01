'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface Noticia {
  id: string
  tipo: string
  titulo: string
  slug: string
  resumo: string | null
  corpo: string | null
  status: 'rascunho' | 'publicado' | 'lixeira' | 'programado'
  destaque: boolean
  banner_url: string | null
  imagem_y: number | null
  fotos_json: string | null
  documentos_json: string | null
  autor_id: string | null   // nome real da coluna no banco
  publicado_em: string | null
  criado_em: string
  atualizado_em: string
  chapeu: string | null
  subtitulo: string | null
  tags_json: string | null
  url_referencia: string | null
  credito: string | null
}

export interface NoticiaFormData {
  titulo: string
  resumo?: string
  corpo?: string
  status?: 'rascunho' | 'publicado' | 'lixeira' | 'programado'
  destaque?: boolean
  banner_url?: string | null
  publicado_em?: string | null
  imagem_y?: number
  fotos_json?: string | null
  documentos_json?: string | null
  chapeu?: string | null
  subtitulo?: string | null
  tags_json?: string | null
  url_referencia?: string | null
  credito?: string | null
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)        // nunca excede 100 caracteres
    .replace(/-$/, '')    // remove hífen final se o corte cair no meio de uma palavra
}

export async function listarNoticias(filtro: {
  status?: string
  busca?: string
}): Promise<Noticia[]> {
  const supabase = await createClient()

  let query = supabase
    .from('conteudos')
    .select('*')
    .eq('tipo', 'noticia')
    .neq('status', 'lixeira')
    .order('criado_em', { ascending: false })

  if (filtro.status && filtro.status !== 'todos') {
    query = query.eq('status', filtro.status)
  }

  if (filtro.busca) {
    query = query.ilike('titulo', `%${filtro.busca}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao listar notícias:', error)
    return []
  }

  return (data ?? []) as Noticia[]
}

export async function criarNoticia(
  data: NoticiaFormData
): Promise<{ id: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    // Gera slug a partir do título; se vazio, usa timestamp para não violar constraint
    const tituloBase = data.titulo?.trim() || 'noticia-sem-titulo'
    let slug = gerarSlug(tituloBase)
    if (!slug) slug = `noticia-${Date.now()}`

    const { data: novaNoticia, error } = await supabase
      .from('conteudos')
      .insert({
        tipo: 'noticia',
        titulo: data.titulo || 'Notícia sem título',
        slug,
        resumo: data.resumo ?? null,
        corpo: data.corpo ?? null,
        status: data.status ?? 'rascunho',
        destaque: data.destaque ?? false,
        banner_url: data.banner_url ?? null,
        // autor_id não é enviado pelo cliente — coluna aceita null
        publicado_em: data.publicado_em ?? null,
        fotos_json: data.fotos_json ?? null,
        documentos_json: data.documentos_json ?? null,
        chapeu: data.chapeu ?? null,
        subtitulo: data.subtitulo ?? null,
        tags_json: data.tags_json ?? null,
        url_referencia: data.url_referencia ?? null,
        credito: data.credito ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao criar notícia:', error)
      return { error: `Erro ao salvar (${error.code}): ${error.message}` }
    }

    return { id: novaNoticia.id }
  } catch (err) {
    console.error('Erro inesperado ao criar notícia:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function atualizarNoticia(
  id: string,
  data: Partial<NoticiaFormData>
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    // Monta updates explicitamente (sem spread) para evitar passar campos problemáticos
    const updates: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }
    if (data.titulo !== undefined) {
      updates.titulo = data.titulo || 'Notícia sem título'
      const s = gerarSlug(data.titulo || 'noticia-sem-titulo')
      updates.slug = s || `noticia-${Date.now()}`
    }
    if (data.resumo !== undefined) updates.resumo = data.resumo ?? null
    if (data.corpo !== undefined) updates.corpo = data.corpo ?? null
    if (data.status !== undefined) updates.status = data.status
    if (data.destaque !== undefined) updates.destaque = data.destaque
    if (data.banner_url !== undefined) updates.banner_url = data.banner_url ?? null
    if (data.publicado_em !== undefined) updates.publicado_em = data.publicado_em ?? null
    if (data.fotos_json !== undefined) updates.fotos_json = data.fotos_json ?? null
    if (data.documentos_json !== undefined) updates.documentos_json = data.documentos_json ?? null
    if (data.chapeu !== undefined) updates.chapeu = data.chapeu ?? null
    if (data.subtitulo !== undefined) updates.subtitulo = data.subtitulo ?? null
    if (data.tags_json !== undefined) updates.tags_json = data.tags_json ?? null
    if (data.url_referencia !== undefined) updates.url_referencia = data.url_referencia ?? null
    if (data.credito !== undefined) updates.credito = data.credito ?? null

    const { error } = await supabase
      .from('conteudos')
      .update(updates)
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao atualizar notícia:', error)
      return { error: `Erro ao salvar (${error.code}): ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao atualizar notícia:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}


export async function publicarNoticia(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({
        status: 'publicado',
        publicado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao publicar notícia:', error)
      return { error: 'Não foi possível publicar a notícia. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao publicar notícia:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function retirarDoAr(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({ status: 'rascunho' })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao retirar notícia do ar:', error)
      return { error: 'Não foi possível retirar a notícia do ar. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao retirar notícia do ar:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function moverParaLixeira(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({ status: 'lixeira' })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao mover notícia para lixeira:', error)
      return { error: 'Não foi possível mover a notícia para a lixeira. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao mover notícia para lixeira:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5 MB

export async function uploadMidia(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  try {
    await getUsuarioLogado()

    const arquivo = formData.get('arquivo') as File | null
    if (!arquivo || typeof arquivo === 'string') {
      return { error: 'Nenhum arquivo selecionado.' }
    }

    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      return { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP, GIF ou PDF.' }
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      return { error: 'O arquivo é muito grande. O limite é de 5 MB.' }
    }

    // Gera nome único para evitar colisões
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `noticias/${timestamp}-${aleatorio}.${extensao}`

    // Usa service role key para upload (bypass RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const buffer = Buffer.from(await arquivo.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('midias')
      .upload(caminho, buffer, {
        contentType: arquivo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return { error: 'Falha ao enviar o arquivo. Tente novamente.' }
    }

    // Constrói a URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('midias')
      .getPublicUrl(caminho)

    return { url: urlData.publicUrl }
  } catch (err) {
    console.error('Erro inesperado no upload:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

const TIPOS_DOCUMENTO = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
]
const TAMANHO_MAXIMO_DOC = 20 * 1024 * 1024 // 20 MB

export async function uploadDocumento(
  formData: FormData
): Promise<{ url: string; nome: string; tipo: string } | { error: string }> {
  try {
    await getUsuarioLogado()

    const arquivo = formData.get('arquivo') as File | null
    if (!arquivo || typeof arquivo === 'string') {
      return { error: 'Nenhum arquivo selecionado.' }
    }

    if (!TIPOS_DOCUMENTO.includes(arquivo.type)) {
      return { error: 'Tipo de arquivo não permitido. Use PDF, DOCX ou ZIP.' }
    }

    if (arquivo.size > TAMANHO_MAXIMO_DOC) {
      return { error: 'O arquivo é muito grande. O limite é de 20 MB.' }
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `noticias/docs/${timestamp}-${aleatorio}.${extensao}`

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const buffer = Buffer.from(await arquivo.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('midias')
      .upload(caminho, buffer, {
        contentType: arquivo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload de documento:', uploadError)
      return { error: 'Falha ao enviar o documento. Tente novamente.' }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('midias')
      .getPublicUrl(caminho)

    return { url: urlData.publicUrl, nome: arquivo.name, tipo: extensao }
  } catch (err) {
    console.error('Erro inesperado no upload de documento:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

/**
 * Obtém a ordem dos destaques na homepage (até 4 posições).
 */
export async function obterOrdemDestaques(): Promise<string[]> {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: config } = await supabaseAdmin
      .from('site_config')
      .select('valor')
      .eq('chave', 'destaques')
      .maybeSingle()

    if (config?.valor?.slots && Array.isArray(config.valor.slots)) {
      return config.valor.slots as string[]
    }

    const { data: destaques } = await supabaseAdmin
      .from('conteudos')
      .select('id')
      .eq('tipo', 'noticia')
      .eq('destaque', true)
      .neq('status', 'lixeira')
      .order('publicado_em', { ascending: false })
      .limit(4)

    return (destaques || []).map((d) => d.id)
  } catch (err) {
    console.error('Erro em obterOrdemDestaques:', err)
    return []
  }
}

/**
 * Salva a ordem exata dos destaques na homepage (até 4 posições)
 * e sincroniza o campo destaque da tabela conteudos.
 */
export async function salvarOrdemDestaques(
  ids: string[]
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const slots = ids.slice(0, 4)

    await supabaseAdmin
      .from('site_config')
      .upsert({
        chave: 'destaques',
        valor: { slots },
        atualizado: new Date().toISOString(),
      })

    if (slots.length > 0) {
      await supabaseAdmin
        .from('conteudos')
        .update({ destaque: true })
        .in('id', slots)
    }

    const { data: anteriores } = await supabaseAdmin
      .from('conteudos')
      .select('id')
      .eq('tipo', 'noticia')
      .eq('destaque', true)

    if (anteriores) {
      const paraRemover = anteriores
        .filter((a) => !slots.includes(a.id))
        .map((a) => a.id)

      if (paraRemover.length > 0) {
        await supabaseAdmin
          .from('conteudos')
          .update({ destaque: false })
          .in('id', paraRemover)
      }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro ao salvar destaques: ${err instanceof Error ? err.message : String(err)}` }
  }
}

