'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import { validarUrlInstagram } from '@/lib/social-origem'
import {
  resolverOrdemDestaquesHome,
  type ConfigDestaquesHome,
} from '@/lib/destaques-home'

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
  autor_id: string | null
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

export interface ConfigDestaquesAdmin {
  slots: string[]
  modo: 'automatico' | 'manual'
  atualizado_em: string | null
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
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

function decodificarEntidadesHtml(texto: string): string {
  return texto
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function hostImagemMetaPermitido(urlImg: string): boolean {
  try {
    const parsed = new URL(urlImg)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return (
      host.endsWith('.cdninstagram.com') ||
      host === 'cdninstagram.com' ||
      host.endsWith('.fbcdn.net') ||
      host === 'instagram.com' ||
      host.endsWith('.instagram.com')
    )
  } catch {
    return false
  }
}

/**
 * Sincroniza automaticamente a fila de 5 destaques da página inicial sempre que uma
 * notícia é publicada, despublicada, excluída ou tem sua data de publicação alterada.
 */
async function sincronizarDestaquesHome(opcoes: {
  noticiaRecemPublicadaId?: string
  noticiaRemovidaId?: string
  dataPublicacaoAlterada?: boolean
} = {}): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const [{ data: configRow }, { data: publicadas }] = await Promise.all([
      supabaseAdmin
        .from('site_config')
        .select('valor, atualizado_em')
        .eq('chave', 'destaques')
        .maybeSingle(),
      supabaseAdmin
        .from('conteudos')
        .select('id, slug, publicado_em, criado_em')
        .eq('tipo', 'noticia')
        .eq('status', 'publicado')
        .order('publicado_em', { ascending: false })
        .order('criado_em', { ascending: false })
        .limit(50),
    ])

    const listaPublicadas = (publicadas || []) as Array<{
      id: string
      slug: string
      publicado_em: string | null
      criado_em: string | null
    }>
    const idsPublicadosSet = new Set(listaPublicadas.map((n) => n.id))

    const valorAtual = (configRow?.valor || {}) as ConfigDestaquesHome
    const modoAtual: 'automatico' | 'manual' =
      valorAtual.modo === 'manual' ? 'manual' : 'automatico'
    let slotsAtuais: string[] = Array.isArray(valorAtual.slots)
      ? valorAtual.slots.filter((id) => idsPublicadosSet.has(id))
      : []

    let proximoModo: 'automatico' | 'manual' = modoAtual
    let novosSlots: string[] = []

    if (modoAtual === 'automatico' || opcoes.dataPublicacaoAlterada) {
      // Reorganização cronológica integral
      novosSlots = resolverOrdemDestaquesHome(listaPublicadas, { modo: 'automatico' })
        .slice(0, 5)
        .map((n) => n.id)
      if (opcoes.dataPublicacaoAlterada && modoAtual === 'manual') {
        // Quando o editor altera explicitamente a data de publicação, reordena os destaques
        // respeitando a nova cronologia sem travar a sequência
        proximoModo = 'automatico'
      }
    } else {
      // Modo manual: preserva posições definidas pelo editor, mas automatiza novas publicações e remoções
      if (opcoes.noticiaRemovidaId) {
        slotsAtuais = slotsAtuais.filter((id) => id !== opcoes.noticiaRemovidaId)
      }

      if (opcoes.noticiaRecemPublicadaId && idsPublicadosSet.has(opcoes.noticiaRecemPublicadaId)) {
        // Nova notícia publicada assume automaticamente o destaque principal (posição 1),
        // empurrando a anterior para a posição 2
        slotsAtuais = [
          opcoes.noticiaRecemPublicadaId,
          ...slotsAtuais.filter((id) => id !== opcoes.noticiaRecemPublicadaId),
        ]
      }

      // Completa até 5 posições sem duplicação seguindo a sequência cronológica
      const completos: string[] = []
      for (const id of slotsAtuais) {
        if (completos.length >= 5) break
        if (idsPublicadosSet.has(id) && !completos.includes(id)) {
          completos.push(id)
        }
      }
      for (const n of listaPublicadas) {
        if (completos.length >= 5) break
        if (!completos.includes(n.id)) {
          completos.push(n.id)
        }
      }
      novosSlots = completos
    }

    const agoraIso = new Date().toISOString()

    await supabaseAdmin.from('site_config').upsert(
      {
        chave: 'destaques',
        valor: {
          slots: novosSlots,
          modo: proximoModo,
          atualizado_em: agoraIso,
        },
        atualizado_em: agoraIso,
      },
      { onConflict: 'chave' }
    )

    // Sincroniza flag `destaque` na tabela conteudos
    if (novosSlots.length > 0) {
      await supabaseAdmin
        .from('conteudos')
        .update({ destaque: true })
        .in('id', novosSlots)
    }

    const { data: marcados } = await supabaseAdmin
      .from('conteudos')
      .select('id')
      .eq('tipo', 'noticia')
      .eq('destaque', true)

    if (marcados) {
      const paraDesmarcar = marcados
        .filter((m) => !novosSlots.includes(m.id))
        .map((m) => m.id)
      if (paraDesmarcar.length > 0) {
        await supabaseAdmin
          .from('conteudos')
          .update({ destaque: false })
          .in('id', paraDesmarcar)
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar destaques automáticos da homepage:', err)
  }
}

export async function listarNoticias(filtro: {
  status?: string
  busca?: string
}): Promise<Noticia[]> {
  const usuario = await getUsuarioLogado()
  if (!temPermissao(usuario, 'noticias', 'consultar')) {
    return []
  }

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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'criar')) {
      return { error: 'Você não tem permissão para criar notícias.' }
    }
    const statusDestino = data.status ?? 'rascunho'
    if (
      (statusDestino === 'publicado' || statusDestino === 'programado') &&
      !temPermissao(usuario, 'noticias', 'publicar')
    ) {
      return { error: 'Você não tem permissão para publicar ou programar notícias.' }
    }

    const supabase = await createClient()

    const tituloBase = data.titulo?.trim() || 'noticia-sem-titulo'
    let slug = gerarSlug(tituloBase)
    if (!slug) slug = `noticia-${Date.now()}`

    // Evita colisão de slug
    const { data: existente } = await supabase
      .from('conteudos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existente) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const { data: novaNoticia, error } = await supabase
      .from('conteudos')
      .insert({
        tipo: 'noticia',
        titulo: data.titulo || 'Notícia sem título',
        slug,
        resumo: data.resumo ?? null,
        corpo: data.corpo ?? null,
        status: statusDestino,
        destaque: data.destaque ?? (statusDestino === 'publicado'),
        banner_url: data.banner_url ?? null,
        imagem_y: data.imagem_y ?? 50,
        publicado_em: data.publicado_em ?? (statusDestino === 'publicado' ? new Date().toISOString() : null),
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

    if (statusDestino === 'publicado') {
      if (data.destaque) {
        await adicionarDestaqueSlots(novaNoticia.id)
      } else {
        await sincronizarDestaquesHome({ noticiaRecemPublicadaId: novaNoticia.id })
      }
      revalidatePath('/')
      revalidatePath('/noticias')
    } else if (data.destaque) {
      await adicionarDestaqueSlots(novaNoticia.id)
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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'editar')) {
      return { error: 'Você não tem permissão para editar notícias.' }
    }
    if (
      (data.status === 'publicado' || data.status === 'programado') &&
      !temPermissao(usuario, 'noticias', 'publicar')
    ) {
      return { error: 'Você não tem permissão para publicar ou programar notícias.' }
    }

    const supabase = await createClient()

    // Lê estado anterior para detectar mudanças de status ou data de publicação
    const { data: anterior } = await supabase
      .from('conteudos')
      .select('status, publicado_em, slug')
      .eq('id', id)
      .eq('tipo', 'noticia')
      .maybeSingle()

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
    if (data.imagem_y !== undefined) updates.imagem_y = data.imagem_y ?? 50
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

    const statusAnterior = anterior?.status
    const statusNovo = data.status ?? statusAnterior
    const mudouDataPublicacao =
      data.publicado_em !== undefined &&
      (data.publicado_em || null) !== (anterior?.publicado_em || null)

    if (statusAnterior !== 'publicado' && statusNovo === 'publicado') {
      // Acabou de ser publicada -> assume automaticamente o destaque principal
      await sincronizarDestaquesHome({ noticiaRecemPublicadaId: id })
    } else if (statusAnterior === 'publicado' && statusNovo !== 'publicado') {
      // Foi despublicada -> reorganiza automaticamente
      await sincronizarDestaquesHome({ noticiaRemovidaId: id })
    } else if (statusNovo === 'publicado' && mudouDataPublicacao) {
      // Teve data de publicação alterada -> reorganiza cronologicamente
      await sincronizarDestaquesHome({ dataPublicacaoAlterada: true })
    } else if (data.destaque === true) {
      await adicionarDestaqueSlots(id)
    } else if (data.destaque === false) {
      await removerDestaqueSlots(id)
    }

    revalidatePath('/')
    revalidatePath('/noticias')
    if (anterior?.slug) revalidatePath(`/noticias/${anterior.slug}`)
    if (typeof updates.slug === 'string') revalidatePath(`/noticias/${updates.slug}`)

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao atualizar notícia:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function publicarNoticia(
  id: string,
  publicadoEm?: string | null
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'publicar')) {
      return { error: 'Você não tem permissão para publicar notícias.' }
    }
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({
        status: 'publicado',
        publicado_em: publicadoEm || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao publicar notícia:', error)
      return { error: 'Não foi possível publicar a notícia. Tente novamente.' }
    }

    await sincronizarDestaquesHome({ noticiaRecemPublicadaId: id })
    revalidatePath('/')
    revalidatePath('/noticias')

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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'publicar') && !temPermissao(usuario, 'noticias', 'editar')) {
      return { error: 'Você não tem permissão para retirar notícias do ar.' }
    }
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({
        status: 'rascunho',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao retirar notícia do ar:', error)
      return { error: 'Não foi possível retirar a notícia do ar. Tente novamente.' }
    }

    await sincronizarDestaquesHome({ noticiaRemovidaId: id })
    revalidatePath('/')
    revalidatePath('/noticias')

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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'excluir')) {
      return { error: 'Você não tem permissão para mover notícias para a lixeira.' }
    }
    const supabase = await createClient()

    const { error } = await supabase
      .from('conteudos')
      .update({
        status: 'lixeira',
        destaque: false,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao mover notícia para lixeira:', error)
      return { error: 'Não foi possível mover a notícia para a lixeira. Tente novamente.' }
    }

    await sincronizarDestaquesHome({ noticiaRemovidaId: id })
    revalidatePath('/')
    revalidatePath('/noticias')

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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'criar') && !temPermissao(usuario, 'noticias', 'editar')) {
      return { error: 'Você não tem permissão para enviar arquivos em notícias.' }
    }

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

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `noticias/${timestamp}-${aleatorio}.${extensao}`

    const supabaseAdmin = getSupabaseAdmin()
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
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'criar') && !temPermissao(usuario, 'noticias', 'editar')) {
      return { error: 'Você não tem permissão para anexar documentos em notícias.' }
    }

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

    const supabaseAdmin = getSupabaseAdmin()
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
 * Obtém a configuração efetiva dos 5 destaques na homepage (automático ou manual).
 */
export async function obterConfigDestaques(): Promise<ConfigDestaquesAdmin> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'consultar')) {
      return { slots: [], modo: 'automatico', atualizado_em: null }
    }

    const supabaseAdmin = getSupabaseAdmin()

    const [{ data: config }, { data: publicadas }] = await Promise.all([
      supabaseAdmin
        .from('site_config')
        .select('valor, atualizado_em')
        .eq('chave', 'destaques')
        .maybeSingle(),
      supabaseAdmin
        .from('conteudos')
        .select('id, slug, publicado_em, criado_em')
        .eq('tipo', 'noticia')
        .eq('status', 'publicado')
        .order('publicado_em', { ascending: false })
        .order('criado_em', { ascending: false })
        .limit(50),
    ])

    const v = (config?.valor || {}) as ConfigDestaquesHome
    const modo: 'automatico' | 'manual' = v.modo === 'manual' ? 'manual' : 'automatico'
    const atualizadoEm = v.atualizado_em || config?.atualizado_em || null

    const resolvidas = resolverOrdemDestaquesHome(publicadas || [], {
      slots: Array.isArray(v.slots) ? v.slots : [],
      modo,
      atualizado_em: atualizadoEm,
    })

    return {
      slots: resolvidas.slice(0, 5).map((n) => n.id),
      modo,
      atualizado_em: atualizadoEm,
    }
  } catch (err) {
    console.error('Erro em obterConfigDestaques:', err)
    return { slots: [], modo: 'automatico', atualizado_em: null }
  }
}

/**
 * Compatibilidade retroativa: retorna apenas os IDs dos slots efetivos.
 */
export async function obterOrdemDestaques(): Promise<string[]> {
  const cfg = await obterConfigDestaques()
  return cfg.slots
}

/**
 * Salva a ordem manual dos destaques na homepage (até 5 posições)
 * e sincroniza o campo destaque da tabela conteudos.
 */
export async function salvarOrdemDestaques(
  ids: string[]
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'editar') && !temPermissao(usuario, 'noticias', 'publicar')) {
      return { error: 'Você não tem permissão para organizar os destaques da homepage.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const slots = Array.from(new Set(ids)).slice(0, 5)
    const agoraIso = new Date().toISOString()

    await supabaseAdmin
      .from('site_config')
      .upsert(
        {
          chave: 'destaques',
          valor: {
            slots,
            modo: 'manual',
            atualizado_em: agoraIso,
          },
          atualizado_em: agoraIso,
        },
        { onConflict: 'chave' }
      )

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

    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    return { error: `Erro ao salvar destaques: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Restaura os destaques da homepage para o modo 100% automático (cronológico).
 */
export async function restaurarOrdemAutomaticaDestaques(): Promise<
  { ok: boolean; slots: string[] } | { error: string }
> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'editar') && !temPermissao(usuario, 'noticias', 'publicar')) {
      return { error: 'Você não tem permissão para alterar a ordem dos destaques.' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: publicadas } = await supabaseAdmin
      .from('conteudos')
      .select('id, slug, publicado_em, criado_em')
      .eq('tipo', 'noticia')
      .eq('status', 'publicado')
      .order('publicado_em', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(10)

    const slots = resolverOrdemDestaquesHome(publicadas || [], { modo: 'automatico' })
      .slice(0, 5)
      .map((n) => n.id)
    const agoraIso = new Date().toISOString()

    await supabaseAdmin.from('site_config').upsert(
      {
        chave: 'destaques',
        valor: {
          slots,
          modo: 'automatico',
          atualizado_em: agoraIso,
        },
        atualizado_em: agoraIso,
      },
      { onConflict: 'chave' }
    )

    if (slots.length > 0) {
      await supabaseAdmin.from('conteudos').update({ destaque: true }).in('id', slots)
    }
    const { data: anteriores } = await supabaseAdmin
      .from('conteudos')
      .select('id')
      .eq('tipo', 'noticia')
      .eq('destaque', true)

    if (anteriores) {
      const paraRemover = anteriores.filter((a) => !slots.includes(a.id)).map((a) => a.id)
      if (paraRemover.length > 0) {
        await supabaseAdmin.from('conteudos').update({ destaque: false }).in('id', paraRemover)
      }
    }

    revalidatePath('/')
    return { ok: true, slots }
  } catch (err) {
    return { error: `Erro ao restaurar ordem automática: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Adiciona uma notícia ao topo dos slots de destaque (deslocando o último se exceder 5)
 */
export async function adicionarDestaqueSlots(id: string): Promise<void> {
  try {
    const slotsAtuais = await obterOrdemDestaques()
    const novosSlots = [id, ...slotsAtuais.filter((s) => s !== id)].slice(0, 5)
    await salvarOrdemDestaques(novosSlots)
  } catch (err) {
    console.error('Erro ao adicionar destaque aos slots:', err)
  }
}

/**
 * Remove uma notícia dos slots de destaque da Homepage
 */
export async function removerDestaqueSlots(id: string): Promise<void> {
  try {
    const slotsAtuais = await obterOrdemDestaques()
    const novosSlots = slotsAtuais.filter((s) => s !== id)
    await salvarOrdemDestaques(novosSlots)
  } catch (err) {
    console.error('Erro ao remover destaque dos slots:', err)
  }
}

/**
 * Recupera a imagem pública de capa (Open Graph oficial) de uma publicação ou Reel do Instagram
 * sem depender de serviços terceiros não autorizados e salva no bucket `midias`.
 */
export async function buscarThumbnailInstagram(
  url: string
): Promise<
  | { url: string; permalink: string; tipo: 'p' | 'reel'; id: string }
  | { error: string; codigo: 'invalido' | 'indisponivel' | 'privado_ou_restrito' | 'erro_storage' }
> {
  try {
    const usuario = await getUsuarioLogado()
    if (!temPermissao(usuario, 'noticias', 'criar') && !temPermissao(usuario, 'noticias', 'editar')) {
      return {
        error: 'Você não tem permissão para importar mídias em notícias.',
        codigo: 'invalido',
      }
    }

    const validacao = validarUrlInstagram(url)
    if (!validacao.valido || !validacao.info) {
      return {
        error: validacao.mensagem || 'Link do Instagram inválido.',
        codigo: 'invalido',
      }
    }

    const { permalink, tipo, id } = validacao.info

    // Busca oficial de metadados Open Graph diretamente da URL canônica do Instagram
    // (recomendação oficial da Meta após remoção de thumbnail_url do oEmbed)
    const res = await fetch(permalink, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    if (res.status === 404 || res.status === 410) {
      return {
        error: 'Publicação não encontrada ou removida no Instagram. Você ainda pode enviar uma capa manualmente.',
        codigo: 'indisponivel',
      }
    }

    if (!res.ok) {
      return {
        error: 'O Instagram não liberou os metadados públicos desta publicação. Envie uma imagem de capa manualmente ou use a capa padrão do site.',
        codigo: 'privado_ou_restrito',
      }
    }

    const html = await res.text()

    // Extrai meta tag og:image oficial
    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)

    const ogImageBruto = ogMatch?.[1] ? decodificarEntidadesHtml(ogMatch[1].trim()) : ''

    if (!ogImageBruto || !hostImagemMetaPermitido(ogImageBruto)) {
      return {
        error: 'Não foi possível obter a capa automaticamente (conteúdo privado ou restrição do Instagram). Você pode enviar uma foto manualmente, colar com Ctrl+V ou publicar com a capa padrão.',
        codigo: 'privado_ou_restrito',
      }
    }

    // Baixa a imagem da CDN oficial do Instagram/Meta
    const imgRes = await fetch(ogImageBruto, {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })

    if (!imgRes.ok) {
      return {
        error: 'A imagem de capa retornada pelo Instagram não pôde ser baixada. Envie uma imagem manualmente ou cole com Ctrl+V.',
        codigo: 'privado_ou_restrito',
      }
    }

    const contentType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase()
    const tiposImagem: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const ext = tiposImagem[contentType]
    if (!ext) {
      return {
        error: 'O recurso retornado pelo Instagram não é uma imagem válida. Envie a capa manualmente.',
        codigo: 'privado_ou_restrito',
      }
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer())
    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
      return {
        error: 'A imagem de capa retornada pelo Instagram excede o tamanho permitido.',
        codigo: 'privado_ou_restrito',
      }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const timestamp = Date.now()
    const aleatorio = Math.random().toString(36).slice(2, 8)
    const caminho = `noticias/fotos/ig-${timestamp}-${aleatorio}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('midias')
      .upload(caminho, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao salvar capa do Instagram no Storage:', uploadError)
      return {
        error: 'Falha ao gravar a capa obtida no Storage. Tente enviar manualmente.',
        codigo: 'erro_storage',
      }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('midias')
      .getPublicUrl(caminho)

    return {
      url: urlData.publicUrl,
      permalink,
      tipo,
      id,
    }
  } catch (err) {
    console.error('Erro em buscarThumbnailInstagram:', err)
    return {
      error: 'Não foi possível obter a capa automaticamente no momento. Você pode enviar uma capa manualmente, colar com Ctrl+V ou publicar usando a imagem padrão.',
      codigo: 'privado_ou_restrito',
    }
  }
}
