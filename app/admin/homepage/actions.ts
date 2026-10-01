'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface BannerItem {
  id: string
  titulo: string
  texto?: string
  imagem: string
  link: string
  ativo: boolean
  ordem?: number
}

export interface HomepageConfig {
  blocks: string[]
  hidden: string[]
  shortcuts: string[]
  model: 'A' | 'B'
  banners: BannerItem[]
  footer: string
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CONFIG_PADRAO: HomepageConfig = {
  blocks: ['Atalhos de serviços', 'Notícias em destaque', 'Jornais', 'Banners rotativos'],
  hidden: [],
  shortcuts: ['fique-socio', 'denuncia', 'colonia', 'juridico'],
  model: 'A',
  banners: [],
  footer: `Sindicato dos Químicos de São José dos Campos e Região
São José dos Campos — (12) 3921-8177 | Taubaté — (12) 3632-0932 | Jacareí — (12) 3953-3277 | Caçapava — (12) 3655-6044
E-mail: contato@quimicosjc.org.br`,
}

/**
 * Obtém a configuração atual da homepage
 */
export async function obterConfigHomepage(): Promise<HomepageConfig> {
  try {
    await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: config, error } = await supabaseAdmin
      .from('site_config')
      .select('valor')
      .eq('chave', 'homepage')
      .maybeSingle()

    if (error || !config?.valor) {
      return CONFIG_PADRAO
    }

    const valor = config.valor as Partial<HomepageConfig>
    return {
      blocks: valor.blocks || CONFIG_PADRAO.blocks,
      hidden: valor.hidden || CONFIG_PADRAO.hidden,
      shortcuts: valor.shortcuts || CONFIG_PADRAO.shortcuts,
      model: valor.model || CONFIG_PADRAO.model,
      banners: Array.isArray(valor.banners) ? valor.banners : [],
      footer: valor.footer || CONFIG_PADRAO.footer,
    }
  } catch (err) {
    console.error('Erro em obterConfigHomepage:', err)
    return CONFIG_PADRAO
  }
}

/**
 * Salva a configuração da homepage
 */
export async function salvarConfigHomepage(
  config: HomepageConfig
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuario = await getUsuarioLogado()
    if (usuario.papel === 'operador') {
      return { error: 'Você não tem permissão para alterar a configuração da homepage.' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('site_config')
      .upsert(
        {
          chave: 'homepage',
          valor: config,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'chave' }
      )

    if (error) {
      console.error('Erro ao salvar configuração da homepage:', error)
      return { error: `Erro no banco de dados: ${error.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { error: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * Upload de imagem panorâmica de banner (proporção 9:2)
 */
export async function uploadBanner(
  formData: FormData
): Promise<{ url: string; nome: string } | { error: string }> {
  try {
    await getUsuarioLogado()
    const file = formData.get('arquivo') as File | null
    if (!file) return { error: 'Nenhum arquivo enviado.' }

    const supabaseAdmin = getSupabaseAdmin()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const caminho = `banners/${timestamp}-${random}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const bucketName = 'midia'

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(caminho, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload de banner:', uploadError)
      return { error: `Falha no upload: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(caminho)

    return { url: publicUrlData.publicUrl, nome: file.name }
  } catch (err) {
    return { error: `Erro no upload: ${err instanceof Error ? err.message : String(err)}` }
  }
}
