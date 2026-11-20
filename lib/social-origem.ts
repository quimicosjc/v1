/**
 * Utilitários para detecção, validação e tratamento oficial de origem social (YouTube e Instagram)
 */

export type OrigemNoticia = 'site' | 'instagram' | 'youtube'

export interface InstagramUrlInfo {
  id: string
  tipo: 'p' | 'reel'
  permalink: string
}

export interface ValidacaoInstagramResult {
  valido: boolean
  info: InstagramUrlInfo | null
  motivo?: 'vazio' | 'nao_instagram' | 'stories' | 'perfil_ou_unsupported' | 'invalido'
  mensagem?: string
}

const HOSTS_INSTAGRAM = new Set([
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
])

export function extrairYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url
    .trim()
    .match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  return m ? m[1] : null
}

/**
 * Faz o parse estrito e seguro de URLs públicas de publicações e Reels do Instagram.
 * Suporta:
 * - https://www.instagram.com/p/<id>/
 * - https://www.instagram.com/reel/<id>/
 * - https://www.instagram.com/reels/<id>/
 * - https://www.instagram.com/tv/<id>/
 * - https://www.instagram.com/<usuario>/p/<id>/
 * - https://www.instagram.com/<usuario>/reel/<id>/
 */
export function parseInstagramUrl(url: string | null | undefined): InstagramUrlInfo | null {
  if (!url || typeof url !== 'string') return null
  const bruto = url.trim()
  if (!bruto) return null

  const comProtocolo = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`

  let parsed: URL
  try {
    parsed = new URL(comProtocolo)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null
  }

  const host = parsed.hostname.toLowerCase()
  if (!HOSTS_INSTAGRAM.has(host)) {
    return null
  }

  const segmentos = parsed.pathname.split('/').filter(Boolean)
  if (segmentos.length < 2) return null

  // Padrão direto: /(p|reel|reels|tv)/<id>
  // Padrão com username: /<usuario>/(p|reel|reels|tv)/<id>
  let tipoBruto: string | null = null
  let codigo: string | null = null

  const tiposSuportados = new Set(['p', 'reel', 'reels', 'tv'])
  if (tiposSuportados.has(segmentos[0].toLowerCase())) {
    tipoBruto = segmentos[0].toLowerCase()
    codigo = segmentos[1]
  } else if (segmentos.length >= 3 && tiposSuportados.has(segmentos[1].toLowerCase())) {
    tipoBruto = segmentos[1].toLowerCase()
    codigo = segmentos[2]
  }

  if (!tipoBruto || !codigo || !/^[A-Za-z0-9_-]{5,40}$/.test(codigo)) {
    return null
  }

  const tipo: 'p' | 'reel' = tipoBruto === 'reel' || tipoBruto === 'reels' ? 'reel' : 'p'
  return {
    id: codigo,
    tipo,
    permalink: `https://www.instagram.com/${tipo}/${codigo}/`,
  }
}

export function validarUrlInstagram(url: string | null | undefined): ValidacaoInstagramResult {
  const bruto = (url || '').trim()
  if (!bruto) {
    return { valido: false, info: null, motivo: 'vazio' }
  }

  const info = parseInstagramUrl(bruto)
  if (info) {
    return { valido: true, info }
  }

  const comProtocolo = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`
  try {
    const u = new URL(comProtocolo)
    const host = u.hostname.toLowerCase()
    if (!HOSTS_INSTAGRAM.has(host)) {
      return {
        valido: false,
        info: null,
        motivo: 'nao_instagram',
        mensagem: 'Informe um link oficial do Instagram (instagram.com/p/... ou instagram.com/reel/...).',
      }
    }
    if (u.pathname.toLowerCase().includes('/stories/')) {
      return {
        valido: false,
        info: null,
        motivo: 'stories',
        mensagem: 'Stories do Instagram são temporários e não permitem incorporação oficial. Use um link de publicação (/p/) ou Reel (/reel/).',
      }
    }
    return {
      valido: false,
      info: null,
      motivo: 'perfil_ou_unsupported',
      mensagem: 'Este endereço não aponta para uma publicação ou Reel específico. Copie o link direto do post (/p/...) ou Reel (/reel/...).',
    }
  } catch {
    return {
      valido: false,
      info: null,
      motivo: 'invalido',
      mensagem: 'O endereço informado não parece ser uma URL válida do Instagram.',
    }
  }
}

export function extrairInstagramId(url: string | null | undefined): string | null {
  return parseInstagramUrl(url)?.id ?? null
}

export function detectarOrigem(urlReferencia?: string | null): OrigemNoticia {
  if (!urlReferencia) return 'site'
  if (extrairYoutubeId(urlReferencia)) return 'youtube'
  if (parseInstagramUrl(urlReferencia)) return 'instagram'
  return 'site'
}

export function obterYoutubeThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function gerarIframeYoutube(videoId: string): string {
  return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" width="100%" height="450" title="Vídeo do YouTube" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
}

/**
 * Gera o marcador de incorporação compatível com o editor TipTap e que é
 * automaticamente renderizado na página pública via embed.js oficial do Instagram.
 */
export function gerarIframeInstagram(postId: string, tipo: 'p' | 'reel' = 'p'): string {
  return `<iframe src="https://www.instagram.com/${tipo}/${postId}/embed/captioned/" width="100%" title="Publicação do Instagram" frameborder="0" allowtransparency="true" allowfullscreen></iframe>`
}

/**
 * Verifica se o HTML do corpo já possui uma incorporação do Instagram (geral ou para um ID específico).
 */
export function corpoJaContemInstagram(corpo: string | null | undefined, postId?: string): boolean {
  if (!corpo) return false
  if (postId) {
    const escaped = postId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`instagram\\.com\\/(?:p|reel|reels|tv)\\/${escaped}(?:[\\/?#"']|$)`, 'i')
    return re.test(corpo)
  }
  return /instagram\.com\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i.test(corpo)
}

/**
 * Insere a incorporação oficial do Instagram no corpo da notícia evitando duplicações.
 * Se já existir um embed do mesmo ID, não duplica.
 * Se o editor trocou o link para outro ID (informado em `idAnterior`), substitui o embed anterior.
 */
export function inserirOuAtualizarEmbedInstagram(
  corpoAtual: string,
  info: InstagramUrlInfo,
  idAnterior?: string | null
): { html: string; alterado: boolean; jaExistia: boolean } {
  const atual = corpoAtual || ''

  if (corpoJaContemInstagram(atual, info.id)) {
    return { html: atual, alterado: false, jaExistia: true }
  }

  const novoIframe = gerarIframeInstagram(info.id, info.tipo)

  if (idAnterior && idAnterior !== info.id && corpoJaContemInstagram(atual, idAnterior)) {
    const esc = idAnterior.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const reBloco = new RegExp(
      `(?:<div[^>]*class=["'][^"']*iframe-wrapper[^"']*["'][^>]*>\\s*)?<iframe[^>]*src=["'][^"']*instagram\\.com\\/(?:p|reel|reels|tv)\\/${esc}[^"']*["'][^>]*>[\\s\\S]*?<\\/iframe>(?:\\s*<\\/div>)?`,
      'gi'
    )
    const substituido = atual.replace(reBloco, novoIframe)
    if (substituido !== atual) {
      return { html: substituido, alterado: true, jaExistia: false }
    }
  }

  const limpo = atual.trim()
  if (!limpo || limpo === '<p></p>' || limpo === '<p><br></p>') {
    return { html: `<p>${novoIframe}</p>`, alterado: true, jaExistia: false }
  }

  return { html: `${limpo}<p>${novoIframe}</p>`, alterado: true, jaExistia: false }
}
