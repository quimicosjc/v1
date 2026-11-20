import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { PapelUsuario } from '@/lib/permissoes'

export {
  type PapelUsuario,
  type AreaPermissao,
  type AcaoPermissao,
  type MapaPermissoes,
  type UsuarioPermissoesBase,
  SLUG_PARA_AREA_SOLICITACAO,
  AREAS_SOLICITACOES_SEGMENTADAS,
  SLUGS_TODAS_SOLICITACOES,
  resolverPermissoesEfetivas,
  temPermissao,
  mapearSlugParaAreaSolicitacao,
  podeAcessarSolicitacaoPorSlug,
  obterSlugsSolicitacoesPermitidos,
  podeAcessarAlgumaSolicitacao,
  podeGerenciarUsuarios,
} from '@/lib/permissoes'

export interface UsuarioPerfil {
  id: string
  auth_user_id: string
  nome: string
  email: string
  papel: PapelUsuario
  ativo: boolean
  e_principal?: boolean
  pode_denuncias?: boolean
  permissoes_json?: string | null
}

/**
 * Obtém o perfil do usuário logado a partir da tabela `usuarios`.
 * Princípio Fail Closed: Se não estiver logado ou não possuir perfil ativo,
 * nega acesso imediatamente e redireciona para o login.
 */
export async function getUsuarioLogado(): Promise<UsuarioPerfil> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // Se o usuário autenticado não possui registro ou ocorreu erro na consulta,
  // NEGA o acesso sumariamente (Fail Closed) e destrói a sessão
  if (error || !usuario) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=sem_perfil')
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=desativado')
  }

  return usuario as UsuarioPerfil
}
