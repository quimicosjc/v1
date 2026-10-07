'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface PaginaInstitucional {
  id: string
  tipo: string
  titulo: string
  slug: string
  subtitulo: string | null
  chapeu: string | null
  corpo: string | null
  status: 'rascunho' | 'publicado' | 'lixeira'
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

export interface PaginaInstitucionalFormData {
  titulo?: string
  subtitulo?: string | null
  chapeu?: string | null
  corpo?: string | null
  status?: 'rascunho' | 'publicado' | 'lixeira'
  banner_url?: string | null
  imagem_y?: number
  fotos_json?: string | null
  documentos_json?: string | null
  tags_json?: string | null
  noindex?: boolean
  publicado_em?: string | null
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Lista todas as páginas institucionais
 */
export async function listarPaginasInstitucionais(): Promise<PaginaInstitucional[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('conteudos')
      .select('*')
      .eq('tipo', 'institucional')
      .order('titulo', { ascending: true })

    if (error) {
      console.error('Erro ao listar páginas institucionais:', error)
      return []
    }

    return (data || []) as PaginaInstitucional[]
  } catch (err) {
    console.error('Erro ao listar páginas institucionais:', err)
    return []
  }
}

/**
 * Obtém uma página institucional pelo slug
 */
export async function obterPaginaInstitucional(slug: string): Promise<PaginaInstitucional | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('conteudos')
      .select('*')
      .eq('slug', slug)
      .eq('tipo', 'institucional')
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data as PaginaInstitucional
  } catch (err) {
    console.error('Erro ao obter página institucional:', err)
    return null
  }
}

/**
 * Atualiza ou salva uma página institucional
 */
export async function salvarPaginaInstitucional(
  slug: string,
  data: Partial<PaginaInstitucionalFormData>
): Promise<{ ok: boolean } | { error: string }> {
  try {
    await getUsuarioLogado()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (data.titulo !== undefined) updates.titulo = data.titulo
    if (data.subtitulo !== undefined) updates.subtitulo = data.subtitulo
    if (data.chapeu !== undefined) updates.chapeu = data.chapeu
    if (data.corpo !== undefined) updates.corpo = data.corpo
    if (data.status !== undefined) updates.status = data.status
    if (data.banner_url !== undefined) updates.banner_url = data.banner_url
    if (data.imagem_y !== undefined) updates.imagem_y = data.imagem_y
    if (data.fotos_json !== undefined) updates.fotos_json = data.fotos_json
    if (data.documentos_json !== undefined) updates.documentos_json = data.documentos_json
    if (data.tags_json !== undefined) updates.tags_json = data.tags_json
    if (data.noindex !== undefined) updates.noindex = data.noindex
    if (data.publicado_em !== undefined) updates.publicado_em = data.publicado_em

    let { error } = await supabase
      .from('conteudos')
      .update(updates)
      .eq('slug', slug)
      .eq('tipo', 'institucional')

    if (error && error.message?.includes('noindex')) {
      delete updates.noindex
      const retry = await supabase
        .from('conteudos')
        .update(updates)
        .eq('slug', slug)
        .eq('tipo', 'institucional')
      error = retry.error
    }

    if (error) {
      console.error('Erro ao atualizar página institucional:', error)
      return { error: `Erro ao salvar (${error.code}): ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    console.error('Erro inesperado ao salvar página institucional:', err)
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Upload de imagem para páginas institucionais
 */
export async function uploadMidiaInstitucional(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const file = formData.get('arquivo') as File
    if (!file) return { error: 'Nenhum arquivo enviado' }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Formato não suportado. Use JPEG, PNG, WebP ou GIF.' }
    }

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { error: 'Arquivo muito grande. Limite máximo: 5 MB.' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `institucional/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const admin = getSupabaseAdmin()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from('midias')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro upload midia institucional:', uploadError)
      return { error: `Falha no upload: ${uploadError.message}` }
    }

    const { data: publicUrlData } = admin.storage
      .from('midias')
      .getPublicUrl(fileName)

    return { url: publicUrlData.publicUrl }
  } catch (err) {
    console.error('Erro inesperado no upload institucional:', err)
    return { error: 'Erro inesperado durante o upload.' }
  }
}

/**
 * Upload de documentos (PDF, DOCX, etc.)
 */
export async function uploadDocumentoInstitucional(
  formData: FormData
): Promise<{ url: string; nome: string; tipo: string; tamanho: number } | { error: string }> {
  try {
    await getUsuarioLogado()
    const file = formData.get('arquivo') as File
    if (!file) return { error: 'Nenhum arquivo enviado' }

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowed = ['pdf', 'docx', 'zip']
    if (!allowed.includes(ext)) {
      return { error: 'Formato não suportado. Permitidos: PDF, DOCX, ZIP.' }
    }

    const MAX_DOC = 20 * 1024 * 1024
    if (file.size > MAX_DOC) {
      return { error: 'Arquivo muito grande. Limite: 20 MB.' }
    }

    const fileName = `institucional/docs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const admin = getSupabaseAdmin()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from('midias')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro upload documento institucional:', uploadError)
      return { error: `Falha no upload: ${uploadError.message}` }
    }

    const { data: publicUrlData } = admin.storage
      .from('midias')
      .getPublicUrl(fileName)

    return {
      url: publicUrlData.publicUrl,
      nome: file.name,
      tipo: ext.toUpperCase(),
      tamanho: file.size,
    }
  } catch (err) {
    console.error('Erro inesperado no upload de documento:', err)
    return { error: 'Erro inesperado durante o upload do documento.' }
  }
}
