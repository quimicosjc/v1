/**
 * Utilitários de segurança para sanitização e blindagem de dados no portal.
 * Previne ataques de Cross-Site Scripting (XSS) e injeção de tags perigosas.
 */

// Domínios confiáveis permitidos em iframes incorporados
const DOMINIOS_IFRAME_PERMITIDOS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'instagram.com',
  'www.instagram.com',
  'player.vimeo.com',
  'google.com/maps',
  'www.google.com/maps',
  'maps.google.com',
]

/**
 * Remove resíduos de scraping do site legado (imagens duplicadas de capa,
 * blocos de data/hora antigos, listas de telefones de rodapé e ícones soltos de redes).
 */
export function limparHtmlLegado(htmlBruto: string): string {
  if (!htmlBruto || typeof htmlBruto !== 'string') return ''

  let s = htmlBruto

  // 1. Remove foto principal antiga do Bootstrap duplicada no corpo
  s = s.replace(/<img[^>]*class=["\'][^"\']*card-img-top[^"\']*["\'][^>]*>/gi, '')

  // 2. Remove bloco de data/hora legado (h2 com icone_datahora ou tags img soltas)
  s = s.replace(/<h2[^>]*>[\s\S]*?icone_datahora[\s\S]*?<\/h2>/gi, '')
  s = s.replace(/<img[^>]*icone_datahora[^>]*>/gi, '')

  // 3. Remove blocos inteiros de rodapé antigo (Contato e Menu)
  s = s.replace(/<ul[^>]*site-contatos-rodape[^>]*>[\s\S]*?<\/ul>/gi, '')
  s = s.replace(/<ul[^>]*site-menu-rodape[^>]*>[\s\S]*?<\/ul>/gi, '')
  s = s.replace(/<h2[^>]*>\s*Contato\s*<\/h2>/gi, '')
  s = s.replace(/<h2[^>]*>\s*Menu\s*<\/h2>/gi, '')

  // 4. Remove blocos soltos de cidades e telefones de rodapé legado
  s = s.replace(/<h3 class=["\']text-vermelho-normal fw-700["\']>(São José dos Campos|Jacareí|Taubaté|Caçapava)<\/h3>/gi, '')
  s = s.replace(/<img[^>]*icone_whatsapp\.svg[^>]*>/gi, '')
  s = s.replace(/<p class=["\']text-white fw-400[^"\']*["\']>[\s\S]*?<\/p>/gi, '')

  // 5. Remove logos de rodapé antigo
  s = s.replace(/<img[^>]*logo_sindicato\.png[^>]*>/gi, '')
  s = s.replace(/<img[^>]*logo_conlutas\.png[^>]*>/gi, '')
  s = s.replace(/<img[^>]*logo_unidosparalutar\.png[^>]*>/gi, '')

  // 6. Remove bloco "Siga-nos em nossas redes sociais" e lista de logos de rodapé
  s = s.replace(/<p[^>]*>Siga-nos em nossas redes sociais<\/p>/gi, '')
  s = s.replace(/<h4[^>]*>Acompanhe mais notícias como essa nas nossas redes sociais:<\/h4>/gi, '')
  s = s.replace(/<ul[^>]*list-inline[^>]*>[\s\S]*?logo_(youtube|instagram|facebook)[\s\S]*?<\/ul>/gi, '')
  s = s.replace(/<img[^>]*logo_(youtube|instagram|facebook)\.png[^>]*>/gi, '')

  // 7. Remove tags vazias remanescentes
  s = s.replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, '')
  s = s.replace(/<div>\s*<\/div>/gi, '')

  return s.trim()
}

/**
 * Sanitiza código HTML gerado por editores ricos ou inserido no banco de dados.
 * Remove scripts maliciosos, manipuladores de eventos (onerror, onclick, etc.),
 * esquemas perigosos (javascript:), iframes de origens desconhecidas e parasitas legados.
 */
export function sanitizarHtml(htmlBruto: string): string {
  if (!htmlBruto || typeof htmlBruto !== 'string') return ''

  // Limpa primeiro resíduos estruturais legados
  let limpo = limparHtmlLegado(htmlBruto)

  // 1. Remove tags executáveis e perigosas
  limpo = limpo.replace(/<\s*(script|style|object|embed|applet|meta|link|base|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  limpo = limpo.replace(/<\s*(script|style|object|embed|applet|meta|link|base|form)[^>]*\/?\s*>/gi, '')

  // 2. Remove atributos de eventos inline (ex.: onload=, onerror=, onclick=, etc.)
  limpo = limpo.replace(/\s+on[a-zA-Z]+\s*=\s*(['\"][^'\"]*['\"]|[^\s>]+)/gi, '')

  // 3. Remove esquemas de URL perigosos (javascript:, vbscript:, data:text/html)
  limpo = limpo.replace(/\s+(href|src)\s*=\s*['\"]\s*(javascript:|vbscript:|data:text\/html)[^'\"]*['\"]/gi, ' $1="#"')

  // 4. Validação e sanitização estrita de iframes (apenas origens confiáveis)
  limpo = limpo.replace(/<iframe([\s\S]*?)<\/iframe>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src\s*=\s*['\"]([^'\"]+)['\"]/i)
    if (!srcMatch || !srcMatch[1]) return ''

    const srcUrl = srcMatch[1]
    const ehPermitido = DOMINIOS_IFRAME_PERMITIDOS.some((dominio) => srcUrl.includes(dominio))

    if (!ehPermitido) {
      // Bloqueia iframe não autorizado
      return ''
    }

    // Retorna iframe com sandbox e referrer-policy seguros
    return `<iframe${attrs} loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
  })

  return limpo
}

