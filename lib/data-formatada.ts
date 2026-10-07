/**
 * Utilitário central de formatação de datas para a área pública
 * Garante que nunca haverá zero à esquerda nos dias (ex: "6 de outubro" ao invés de "06 de outubro").
 */

function parseData(dataIso?: string | null): Date | null {
  if (!dataIso) return null
  const d = new Date(dataIso)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Retorna no formato: "6 de outubro de 2026"
 */
export function formatarDataExtenso(dataIso?: string | null): string {
  const d = parseData(dataIso)
  if (!d) return ''
  
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(d)

  const mapa: Record<string, string> = {}
  for (const p of partes) {
    mapa[p.type] = p.value
  }

  const dia = mapa.day ? String(parseInt(mapa.day, 10)) : ''
  const mes = mapa.month || ''
  const ano = mapa.year || ''

  return `${dia} de ${mes} de ${ano}`
}

/**
 * Retorna no formato curto: "6 out. 2026"
 */
export function formatarDataCurta(dataIso?: string | null): string {
  const d = parseData(dataIso)
  if (!d) return ''

  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d)

  const mapa: Record<string, string> = {}
  for (const p of partes) {
    mapa[p.type] = p.value
  }

  const dia = mapa.day ? String(parseInt(mapa.day, 10)) : ''
  const mes = mapa.month || ''
  const ano = mapa.year || ''

  return `${dia} ${mes} ${ano}`
}

/**
 * Retorna no formato completo para notícias (estilo G1):
 * "6 de outubro de 2026 às 14h30"
 */
export function formatarDataHoraNoticia(dataIso?: string | null): string {
  const d = parseData(dataIso)
  if (!d) return ''

  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const mapa: Record<string, string> = {}
  for (const p of partes) {
    mapa[p.type] = p.value
  }

  const dia = mapa.day ? String(parseInt(mapa.day, 10)) : ''
  const mes = mapa.month || ''
  const ano = mapa.year || ''
  const hora = mapa.hour || '00'
  const minuto = mapa.minute || '00'

  return `${dia} de ${mes} de ${ano} às ${hora}h${minuto}`
}
