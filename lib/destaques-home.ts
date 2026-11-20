/**
 * Lógica determinística e deduplicada para seleção e ordenação das notícias
 * em destaque na página inicial.
 *
 * Regras:
 * 1. A ordenação base é sempre cronológica decrescente (publicado_em DESC, criado_em DESC).
 * 2. Por padrão (modo automático), a notícia publicada mais recentemente assume o destaque principal
 *    (posição 1), a anterior passa para a posição 2 e todas as demais seguem ordem cronológica.
 * 3. Quando o editor realiza reordenação manual (modo === 'manual'), as posições salvas são
 *    respeitadas, MAS:
 *    - Novas matérias publicadas após o salvamento manual entram automaticamente no topo (posição 1),
 *      empurrando a anterior para a posição seguinte.
 *    - Matérias excluídas ou despublicadas saem automaticamente da sequência, sem deixar lacunas.
 * 4. Nenhuma matéria jamais aparece duplicada (deduplicação estrita por id e slug).
 */

export interface NoticiaOrdenavel {
  id: string
  slug?: string | null
  publicado_em?: string | null
  criado_em?: string | null
}

export interface ConfigDestaquesHome {
  slots?: string[]
  modo?: 'automatico' | 'manual'
  atualizado_em?: string | null
}

export function obterTimestampPublicacao(item: NoticiaOrdenavel): number {
  const raw = item.publicado_em || item.criado_em
  if (!raw) return 0
  const ts = new Date(raw).getTime()
  return Number.isFinite(ts) ? ts : 0
}

export function ordenarCronologicamente<T extends NoticiaOrdenavel>(lista: T[]): T[] {
  const vistosId = new Set<string>()
  const vistosSlug = new Set<string>()
  const unicos: T[] = []

  for (const item of lista) {
    if (!item?.id || vistosId.has(item.id)) continue
    if (item.slug && vistosSlug.has(item.slug)) continue
    vistosId.add(item.id)
    if (item.slug) vistosSlug.add(item.slug)
    unicos.push(item)
  }

  return unicos.sort((a, b) => {
    const diff = obterTimestampPublicacao(b) - obterTimestampPublicacao(a)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
}

export function resolverOrdemDestaquesHome<T extends NoticiaOrdenavel>(
  noticiasPublicadas: T[],
  config?: ConfigDestaquesHome | null
): T[] {
  const cronologicas = ordenarCronologicamente(noticiasPublicadas)

  // Modo automático (padrão): ordem cronológica integral
  if (!config || config.modo !== 'manual' || !Array.isArray(config.slots) || config.slots.length === 0) {
    return cronologicas
  }

  const porId = new Map<string, T>()
  for (const n of cronologicas) {
    porId.set(n.id, n)
  }

  const slotsValidos = Array.from(new Set(config.slots)).filter((id) => porId.has(id))
  if (slotsValidos.length === 0) {
    return cronologicas
  }

  const slotsSet = new Set(slotsValidos)
  const resultado: T[] = []
  const usados = new Set<string>()

  const adicionar = (item: T | undefined) => {
    if (!item || usados.has(item.id)) return
    usados.add(item.id)
    resultado.push(item)
  }

  // 1. Novas notícias publicadas DEPOIS da última edição manual dos destaques
  // assumem automaticamente o topo sem exigir intervenção manual
  const tsManual = config.atualizado_em ? new Date(config.atualizado_em).getTime() : NaN
  if (Number.isFinite(tsManual)) {
    for (const n of cronologicas) {
      if (!slotsSet.has(n.id) && obterTimestampPublicacao(n) > tsManual) {
        adicionar(n)
      }
    }
  }

  // 2. Notícias na ordem manual preservada (somente as que continuam publicadas)
  for (const id of slotsValidos) {
    adicionar(porId.get(id))
  }

  // 3. Demais notícias em ordem cronológica preenchendo as vagas seguintes
  for (const n of cronologicas) {
    adicionar(n)
  }

  return resultado
}
