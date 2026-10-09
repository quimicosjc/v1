/**
 * Utilitários para detecção e tratamento de origem social (YouTube e Instagram)
 * Fast track editorial para notícias
 */

export type OrigemNoticia = 'site' | 'instagram' | 'youtube'

export function extrairYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.trim().match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  return m ? m[1] : null
}

export function extrairInstagramId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.trim().match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/i)
  return m ? m[1] : null
}

export function detectarOrigem(urlReferencia?: string | null): OrigemNoticia {
  if (!urlReferencia) return 'site'
  if (extrairYoutubeId(urlReferencia)) return 'youtube'
  if (extrairInstagramId(urlReferencia)) return 'instagram'
  return 'site'
}

export function obterYoutubeThumb(videoId: string): string {
  // Pega a versão de alta qualidade do YouTube oficial
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function gerarIframeYoutube(videoId: string): string {
  return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" width="100%" height="450" title="Vídeo do YouTube" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
}

export function gerarIframeInstagram(postId: string): string {
  return `<iframe src="https://www.instagram.com/p/${postId}/embed/" width="100%" height="480" title="Publicação do Instagram" frameborder="0" allowfullscreen></iframe>`
}
