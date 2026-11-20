'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { parseInstagramUrl, type InstagramUrlInfo } from '@/lib/social-origem'

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void
      }
    }
  }
}

interface CorpoNoticiaProps {
  html: string
  urlReferencia?: string | null
}

function construirBlockquoteInstagram(info: InstagramUrlInfo): string {
  const permalinkEmbed = `${info.permalink}?utm_source=ig_embed&amp;utm_campaign=loading`
  const label = info.tipo === 'reel' ? 'Ver este Reel no Instagram' : 'Ver esta publicação no Instagram'

  return `<div class="ig-embed-container" data-ig-tipo="${info.tipo}" data-ig-id="${info.id}"><blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${permalinkEmbed}" data-instgrm-version="14" style="background:#FFFFFF; border:0; border-radius:8px; box-shadow:0 0 1px 0 rgba(0,0,0,0.45),0 2px 12px 0 rgba(0,0,0,0.12); margin:0 auto; max-width:540px; min-width:280px; padding:0; width:100%;"><div style="padding:20px; text-align:center;"><a href="${info.permalink}" target="_blank" rel="noopener noreferrer" style="color:#861e32; font-weight:700; text-decoration:none; font-size:14px;">${label} ↗</a></div></blockquote></div>`
}

/**
 * Converte iframes legados ou links diretos do Instagram para o componente oficial
 * `<blockquote class="instagram-media">` processado pelo `embed.js` da Meta, garantindo:
 * - Altura dinâmica real para posts e Reels 9:16 (vídeo + área inferior + curtir/comentar + legenda)
 * - Ausência de cortes ou barras de rolagem internas
 * - Nenhuma duplicação do mesmo post/Reel
 */
function prepararHtmlComInstagramOficial(
  htmlSanitizado: string,
  urlReferencia?: string | null
): { htmlFinal: string; temInstagram: boolean } {
  const refIg = parseInstagramUrl(urlReferencia)
  const idsRenderizados = new Set<string>()
  let temInstagram = false

  // 1. Transforma iframes do Instagram (com ou sem wrapper .iframe-wrapper do TipTap) em blockquote oficial
  const regexIframeIg =
    /(?:<div[^>]*class=["'][^"']*iframe-wrapper[^"']*["'][^>]*>\s*)?<iframe[^>]*src=["']([^"']*instagram\.com\/[^"']+)["'][^>]*>[\s\S]*?<\/iframe>(?:\s*<\/div>)?/gi

  let processado = htmlSanitizado.replace(regexIframeIg, (_match, srcUrl: string) => {
    const parsed = parseInstagramUrl(srcUrl)
    if (!parsed) return ''

    // Evita incorporação duplicada do mesmo post/Reel
    if (idsRenderizados.has(parsed.id)) {
      return ''
    }

    // Se url_referencia indica que este mesmo ID é um Reel, preserva o tipo 'reel'
    const infoFinal: InstagramUrlInfo =
      refIg && refIg.id === parsed.id
        ? refIg
        : parsed

    idsRenderizados.add(infoFinal.id)
    temInstagram = true
    return construirBlockquoteInstagram(infoFinal)
  })

  // 2. Transforma parágrafos contendo apenas um link solto do Instagram
  const regexLinkSoltoIg =
    /<p>\s*(?:<a[^>]*href=["'])?(https?:\/\/(?:www\.|m\.)?instagram\.com\/(?:[^\/\s"'<>]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+[^\s"'<>]*)(?:["'][^>]*>[\s\S]*?<\/a>)?\s*<\/p>/gi

  processado = processado.replace(regexLinkSoltoIg, (match, url: string) => {
    const parsed = parseInstagramUrl(url)
    if (!parsed) return match
    if (idsRenderizados.has(parsed.id)) {
      return ''
    }
    const infoFinal = refIg && refIg.id === parsed.id ? refIg : parsed
    idsRenderizados.add(infoFinal.id)
    temInstagram = true
    return construirBlockquoteInstagram(infoFinal)
  })

  // 3. Detecta se já havia blockquote.instagram-media salvo diretamente no HTML
  const regexBlockquoteExistente = /data-instgrm-permalink=["']([^"']+)["']/gi
  let bqMatch: RegExpExecArray | null
  while ((bqMatch = regexBlockquoteExistente.exec(processado)) !== null) {
    const parsed = parseInstagramUrl(bqMatch[1])
    if (parsed) {
      idsRenderizados.add(parsed.id)
      temInstagram = true
    }
  }

  // 4. Se a notícia tem url_referencia válida do Instagram, mas o corpo não contém o embed ainda,
  // incorpora automaticamente sem duplicar.
  if (refIg && !idsRenderizados.has(refIg.id)) {
    idsRenderizados.add(refIg.id)
    temInstagram = true
    const embedHtml = construirBlockquoteInstagram(refIg)
    processado = processado.trim() ? `${embedHtml}\n${processado}` : embedHtml
  }

  return { htmlFinal: processado, temInstagram }
}

export default function CorpoNoticia({ html, urlReferencia }: CorpoNoticiaProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { htmlFinal, temInstagram } = useMemo(
    () => prepararHtmlComInstagramOficial(html, urlReferencia),
    [html, urlReferencia]
  )

  useEffect(() => {
    if (!temInstagram) return

    const processarEmbeds = () => {
      try {
        window.instgrm?.Embeds?.process()
      } catch {
        // Fallback link oficial já está presente dentro do blockquote
      }
    }

    if (window.instgrm?.Embeds?.process) {
      processarEmbeds()
      return
    }

    const scriptExistente = document.querySelector<HTMLScriptElement>(
      'script[src*="instagram.com/embed.js"]'
    )

    if (scriptExistente) {
      scriptExistente.addEventListener('load', processarEmbeds)
      return () => scriptExistente.removeEventListener('load', processarEmbeds)
    }

    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    script.defer = true
    script.onload = processarEmbeds
    document.body.appendChild(script)

    return () => {
      script.onload = null
    }
  }, [temInstagram, htmlFinal])

  return (
    <div
      ref={containerRef}
      className="noticia-corpo"
      style={{
        fontSize: '20px',
        lineHeight: 1.8,
        color: '#2b2327',
        wordBreak: 'break-word',
      }}
      dangerouslySetInnerHTML={{ __html: htmlFinal }}
    />
  )
}
