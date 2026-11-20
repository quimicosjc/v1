/**
 * Módulo puro (isomórfico: servidor e cliente) de resolução e validação de permissões
 * do painel administrativo com segmentação granular e conformidade LGPD.
 */

export type PapelUsuario = 'operador' | 'gestor' | 'admin_ti'

export type AreaPermissao =
  | 'noticias'
  | 'jornais'
  | 'paginas'
  | 'homepage'
  | 'sindicalizacoes'
  | 'carteirinhas'
  | 'atualizacoes'
  | 'denuncias'
  | 'inscricoes'
  | 'solicitacoes' // legado (mapeado automaticamente para retrocompatibilidade)

export type AcaoPermissao = 'consultar' | 'criar' | 'editar' | 'publicar' | 'excluir'

export type MapaPermissoes = Record<string, string[]>

export interface UsuarioPermissoesBase {
  id?: string
  nome?: string
  papel: PapelUsuario | string
  pode_denuncias?: boolean
  permissoes_json?: string | null
}

/**
 * Mapeamento oficial entre slugs de formulários (tabela `formularios`)
 * e áreas independentes de permissão.
 */
export const SLUG_PARA_AREA_SOLICITACAO: Record<string, AreaPermissao> = {
  sindicalizacao: 'sindicalizacoes',
  carteirinha: 'carteirinhas',
  'atualizacao-cadastral': 'atualizacoes',
  juridico: 'atualizacoes',
  contato: 'atualizacoes',
  denuncia: 'denuncias',
}

export const AREAS_SOLICITACOES_SEGMENTADAS = [
  'sindicalizacoes',
  'carteirinhas',
  'atualizacoes',
  'denuncias',
] as const

export const SLUGS_TODAS_SOLICITACOES = [
  'sindicalizacao',
  'carteirinha',
  'atualizacao-cadastral',
  'juridico',
  'contato',
  'denuncia',
] as const

/**
 * Resolve o mapa efetivo de permissões de um usuário, preservando retrocompatibilidade
 * com contas existentes sem conceder novas permissões indevidas.
 */
export function resolverPermissoesEfetivas(usuario: UsuarioPermissoesBase): MapaPermissoes {
  if (usuario.papel === 'admin_ti') {
    const todasAcoes: AcaoPermissao[] = ['consultar', 'criar', 'editar', 'publicar', 'excluir']
    return {
      noticias: todasAcoes,
      jornais: todasAcoes,
      paginas: todasAcoes,
      homepage: todasAcoes,
      sindicalizacoes: todasAcoes,
      carteirinhas: todasAcoes,
      atualizacoes: todasAcoes,
      denuncias: todasAcoes,
      inscricoes: todasAcoes,
    }
  }

  let raw: MapaPermissoes = {}
  if (usuario.permissoes_json) {
    try {
      const parsed = JSON.parse(usuario.permissoes_json)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        raw = parsed as MapaPermissoes
      }
    } catch {
      raw = {}
    }
  }

  const limparAcoes = (arr: unknown): string[] =>
    Array.isArray(arr)
      ? Array.from(new Set(arr.filter((a): a is string => typeof a === 'string' && a !== 'excluir')))
      : []

  const efetivas: MapaPermissoes = {
    noticias: limparAcoes(raw.noticias),
    jornais: limparAcoes(raw.jornais),
    paginas: limparAcoes(raw.paginas),
    inscricoes: limparAcoes(raw.inscricoes),
  }

  if ('homepage' in raw) {
    efetivas.homepage = limparAcoes(raw.homepage)
  } else if (usuario.papel === 'gestor') {
    efetivas.homepage = ['consultar', 'editar', 'publicar']
  } else {
    efetivas.homepage = []
  }

  const possuiChaveSegmentada =
    'sindicalizacoes' in raw || 'carteirinhas' in raw || 'atualizacoes' in raw

  if (possuiChaveSegmentada) {
    efetivas.sindicalizacoes = limparAcoes(raw.sindicalizacoes)
    efetivas.carteirinhas = limparAcoes(raw.carteirinhas)
    efetivas.atualizacoes = limparAcoes(raw.atualizacoes)
  } else if ('solicitacoes' in raw) {
    const legadoSolic = limparAcoes(raw.solicitacoes)
    efetivas.sindicalizacoes = legadoSolic
    efetivas.carteirinhas = legadoSolic
    efetivas.atualizacoes = legadoSolic
  } else {
    efetivas.sindicalizacoes = []
    efetivas.carteirinhas = []
    efetivas.atualizacoes = []
  }

  if ('denuncias' in raw) {
    efetivas.denuncias = limparAcoes(raw.denuncias)
  } else if (usuario.pode_denuncias) {
    efetivas.denuncias = ['consultar', 'editar']
  } else {
    efetivas.denuncias = []
  }

  return efetivas
}

export function temPermissao(usuario: UsuarioPermissoesBase, area: string, acao: string): boolean {
  if (usuario.papel === 'admin_ti') return true
  if (acao === 'excluir') return false

  const efetivas = resolverPermissoesEfetivas(usuario)

  if (area === 'solicitacoes') {
    return AREAS_SOLICITACOES_SEGMENTADAS.some(
      (sub) => Array.isArray(efetivas[sub]) && efetivas[sub].includes(acao)
    )
  }

  const acoesArea = efetivas[area]
  if (!Array.isArray(acoesArea)) return false
  if (acoesArea.includes(acao)) return true

  if (acao === 'consultar') {
    return acoesArea.some((a) => ['consultar', 'criar', 'editar', 'publicar'].includes(a))
  }

  return false
}

export function mapearSlugParaAreaSolicitacao(slug?: string | null): AreaPermissao {
  if (!slug) return 'atualizacoes'
  return SLUG_PARA_AREA_SOLICITACAO[slug] ?? 'atualizacoes'
}

export function podeAcessarSolicitacaoPorSlug(
  usuario: UsuarioPermissoesBase,
  slug: string | null | undefined,
  acao: 'consultar' | 'editar' | 'excluir' = 'consultar'
): boolean {
  if (usuario.papel === 'admin_ti') return true
  if (acao === 'excluir') return false

  const area = mapearSlugParaAreaSolicitacao(slug)
  return temPermissao(usuario, area, acao)
}

export function obterSlugsSolicitacoesPermitidos(
  usuario: UsuarioPermissoesBase,
  acao: 'consultar' | 'editar' = 'consultar'
): string[] {
  if (usuario.papel === 'admin_ti') {
    return [...SLUGS_TODAS_SOLICITACOES]
  }
  return SLUGS_TODAS_SOLICITACOES.filter((slug) =>
    podeAcessarSolicitacaoPorSlug(usuario, slug, acao)
  )
}

export function podeAcessarAlgumaSolicitacao(usuario: UsuarioPermissoesBase): boolean {
  return obterSlugsSolicitacoesPermitidos(usuario, 'consultar').length > 0
}

export function podeGerenciarUsuarios(usuario: UsuarioPermissoesBase): boolean {
  return usuario.papel === 'admin_ti' || usuario.papel === 'gestor'
}
