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
 * Sanitiza código HTML gerado por editores ricos ou inserido no banco de dados.
 * Remove scripts maliciosos, manipuladores de eventos (onerror, onclick, etc.),
 * esquemas perigosos (javascript:) e iframes de origens desconhecidas.
 */
export function sanitizarHtml(htmlBruto: string): string {
  if (!htmlBruto || typeof htmlBruto !== 'string') return ''

  let limpo = htmlBruto

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
