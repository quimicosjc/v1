'use server'

import { createClient } from '@/lib/supabase/server'
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
  autor_id: string | null
  publicado_em: string | null
  criado_em: string
  atualizado_em: string
}

export interface NoticiaFormData {
  titulo: string
  resumo?: string
  corpo?: string
  status?: 'rascunho' | 'publicado' | 'lixeira'
  destaque?: boolean
  banner_url?: string | null
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
    const usuario = await getUsuarioLogado()
    const supabase = await createClient()

    const slug = gerarSlug(data.titulo)

    const { data: novaNoticia, error } = await supabase
      .from('conteudos')
      .insert({
        tipo: 'noticia',
        titulo: data.titulo,
        slug,
        resumo: data.resumo ?? null,
        corpo: data.corpo ?? null,
        status: data.status ?? 'rascunho',
        destaque: data.destaque ?? false,
        banner_url: data.banner_url ?? null,
        autor_id: usuario.id,
        publicado_em: data.publicado_em ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao criar notícia:', error)
      return { error: 'Não foi possível criar a notícia. Tente novamente.' }
    }

    return { id: novaNoticia.id }
  } catch (err) {
    console.error('Erro inesperado ao criar notícia:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function atualizarNoticia(
  id: string,
  data: Partial<NoticiaFormData>
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const updates: Record<string, unknown> = { ...data }

    if (data.titulo) {
      updates.slug = gerarSlug(data.titulo)
    }

    const { error } = await supabase
      .from('conteudos')
      .update(updates)
      .eq('id', id)
      .eq('tipo', 'noticia')

    if (error) {
      console.error('Erro ao atualizar notícia:', error)
      return { error: 'Não foi possível salvar as alterações. Tente novamente.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao atualizar notícia:', err)
    return { error: 'Erro inesperado. Tente novamente.' }
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
