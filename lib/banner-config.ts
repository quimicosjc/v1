/**
 * Configurações e limites seguros para rotação de banners na Homepage.
 *
 * Referência aferida: carrossel rotativo principal da Folha de S.Paulo
 * (`data-rotate-generic-autoplay="10000"`, equivalente a 10 segundos).
 * Tempo padrão adotado: 10s + 1s = 11 segundos.
 */
export const TEMPO_BANNER_PADRAO_SEG = 11
export const TEMPO_BANNER_MIN_SEG = 3
export const TEMPO_BANNER_MAX_SEG = 60

export function sanitizarTempoBannerSegundos(valor: unknown): number {
  const num = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(num)) return TEMPO_BANNER_PADRAO_SEG
  return Math.min(TEMPO_BANNER_MAX_SEG, Math.max(TEMPO_BANNER_MIN_SEG, Math.round(num)))
}
