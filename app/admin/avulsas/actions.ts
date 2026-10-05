'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface PaginaAvulsa {
  id: string
  tipo: string
  titulo: string
  slug: string
  subtitulo: string | null
  chapeu: string | null
  corpo: string | null
  status: 'rascunho' | 'publicado' | 'lixeira' | 'programado'
  banner_url: string | null
  imagem_y: number | null
  fotos_json: string | null
  documentos_json: string | null
  tags_json: string | null
  noindex?: boolean
  autor_id: string | null
  publicado_em: string | null
  criado_em: string
  atualizado_em: string
}

export interface PaginaAvulsaFormData {
  titulo: string
  subtitulo?: string | null
  chapeu?: string | null
  corpo?: string | null
  slug?: string
  status?: 'rascunho' | 'publicado' | 'lixeira' | 'programado'
  banner_url?: string | null
  imagem_y?: number
  fotos_json?: string | null
  documentos_json?: string | null
  tags_json?: string | null
  noindex?: boolean
  publicado_em?: string | null
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
    .slice(0, 100)
    .replace(/-$/, '')
}

export async function listarPaginasAvulsas(filtro: {
  status?: string
  busca?: string
}): Promise<PaginaAvulsa[]> {
  const supabase = await createClient()

  let query = supabase
    .from('conteudos')
    .select('*')
    .eq('tipo', 'avulsa')
    .neq('status', 'lixeira')
    .order('atualizado_em', { ascending: false })

  if (filtro.status && filtro.status !== 'todos') {
    query = query.eq('status', filtro.status)
  }

  if (filtro.busca) {
    query = query.ilike('titulo', `%${filtro.busca}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao listar páginas avulsas:', error)
    return []
  }

  return (data ?? []) as PaginaAvulsa[]
}

export async function obterPaginaAvulsa(id: string): Promise<PaginaAvulsa | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'avulsa')
    .single()

  if (error || !data) {
    return null
  }

  return data as PaginaAvulsa
}

export async function criarPaginaAvulsa(
  data: PaginaAvulsaFormData
): Promise<{ id: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const tituloBase = data.titulo?.trim() || 'pagina-sem-titulo'
    let slug = data.slug?.trim() ? gerarSlug(data.slug) : gerarSlug(tituloBase)
    if (!slug) slug = `pagina-${Date.now()}`

    // Verifica se já existe outra página com este slug
    const { data: existente } = await supabase
      .from('conteudos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existente) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const payload: Record<string, unknown> = {
      tipo: 'avulsa',
      titulo: data.titulo || 'Página sem título',
      slug,
      resumo: null,
      corpo: data.corpo ?? null,
      status: data.status ?? 'rascunho',
      destaque: false,
      banner_url: data.banner_url ?? null,
      publicado_em: data.publicado_em ?? null,
      fotos_json: data.fotos_json ?? null,
      documentos_json: data.documentos_json ?? null,
      chapeu: data.chapeu ?? null,
      subtitulo: data.subtitulo ?? null,
      tags_json: data.tags_json ?? null,
      imagem_y: data.imagem_y ?? 50,
      url_referencia: null,
      credito: null,
    }

    if (data.noindex !== undefined) {
      payload.noindex = data.noindex
    }

    let { data: novaPagina, error } = await supabase
      .from('conteudos')
      .insert(payload)
      .select('id')
      .single()

    // Se falhar porque a coluna noindex não existe na tabela, tenta sem noindex
    if (error && error.message?.includes('noindex')) {
      delete payload.noindex
      const retry = await supabase
        .from('conteudos')
        .insert(payload)
        .select('id')
        .single()
      novaPagina = retry.data
      error = retry.error
    }

    if (error || !novaPagina) {
      console.error('Erro ao criar página avulsa:', error)
      return { error: error ? `Erro ao salvar (${error.code}): ${error.message}` : 'Erro ao obter registro criado.' }
    }

    return { id: novaPagina.id }
  } catch (err) {
    console.error('Erro inesperado ao criar página avulsa:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function atualizarPaginaAvulsa(
  id: string,
  data: Partial<PaginaAvulsaFormData>
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }
    if (data.titulo !== undefined) {
      updates.titulo = data.titulo || 'Página sem título'
    }
    if (data.slug !== undefined && data.slug.trim()) {
      updates.slug = gerarSlug(data.slug)
    } else if (data.titulo !== undefined) {
      const s = gerarSlug(data.titulo || 'pagina-sem-titulo')
      if (s) updates.slug = s
    }
    if (data.corpo !== undefined) updates.corpo = data.corpo ?? null
    if (data.status !== undefined) updates.status = data.status
    if (data.banner_url !== undefined) updates.banner_url = data.banner_url ?? null
    if (data.publicado_em !== undefined) updates.publicado_em = data.publicado_em ?? null
    if (data.fotos_json !== undefined) updates.fotos_json = data.fotos_json ?? null
    if (data.documentos_json !== undefined) updates.documentos_json = data.documentos_json ?? null
    if (data.chapeu !== undefined) updates.chapeu = data.chapeu ?? null
    if (data.subtitulo !== undefined) updates.subtitulo = data.subtitulo ?? null
    if (data.tags_json !== undefined) updates.tags_json = data.tags_json ?? null
    if (data.imagem_y !== undefined) updates.imagem_y = data.imagem_y
    if (data.noindex !== undefined) updates.noindex = data.noindex

    let { error } = await supabase
      .from('conteudos')
      .update(updates)
      .eq('id', id)
      .eq('tipo', 'avulsa')

    // Se falhar porque a coluna noindex não existe na tabela, tenta sem noindex
    if (error && error.message?.includes('noindex')) {
      delete updates.noindex
      const retry = await supabase
        .from('conteudos')
        .update(updates)
        .eq('id', id)
        .eq('tipo', 'avulsa')
      error = retry.error
    }

    if (error) {
      console.error('Erro ao atualizar página avulsa:', error)
      return { error: `Erro ao salvar (${error.code}): ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao atualizar página avulsa:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function publicarPaginaAvulsa(
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
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'avulsa')

    if (error) {
      console.error('Erro ao publicar página avulsa:', error)
      return { error: 'Não foi possível publicar a página. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao publicar página avulsa:', err)
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
      .update({
        status: 'rascunho',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'avulsa')

    if (error) {
      console.error('Erro ao retirar página do ar:', error)
      return { error: 'Não foi possível retirar a página do ar. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao retirar página do ar:', err)
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
      .update({
        status: 'lixeira',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'avulsa')

    if (error) {
      console.error('Erro ao mover página para lixeira:', error)
      return { error: 'Não foi possível mover a página para a lixeira. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao mover página para lixeira:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TAMANHO_MAXIMO_MIDIA = 5 * 1024 * 1024 // 5 MB

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
      return { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' }
    }

    if (arquivo.size > TAMANHO_MAXIMO_MIDIA) {
      return { error: 'O arquivo é muito grande. O limite é de 5 MB.' }
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `avulsas/${timestamp}-${aleatorio}.${extensao}`

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
      console.error('Erro no upload de foto da página avulsa:', uploadError)
      return { error: 'Falha ao enviar a foto. Tente novamente.' }
    }

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
      return { error: 'Tipo de documento não permitido. Use PDF ou DOCX.' }
    }

    if (arquivo.size > TAMANHO_MAXIMO_DOC) {
      return { error: 'O arquivo é muito grande. O limite é de 20 MB.' }
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `avulsas/docs/${timestamp}-${aleatorio}.${extensao}`

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
      console.error('Erro no upload de documento da página avulsa:', uploadError)
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
