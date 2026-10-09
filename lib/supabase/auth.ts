import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface UsuarioPerfil {
  id: string
  auth_user_id: string
  nome: string
  email: string
  papel: 'operador' | 'gestor' | 'admin_ti'
  ativo: boolean
  permissoes_json?: string | null
}

/**
 * Verifica se um usuário possui permissão para determinada ação em uma área do sistema.
 * Administradores (admin_ti) têm permissão total irrestrita.
 * Outros papéis dependem das permissões configuradas na matriz de permissões.
 */
export function temPermissao(usuario: UsuarioPerfil, area: string, acao: string): boolean {
  if (usuario.papel === 'admin_ti') return true
  if (!usuario.permissoes_json) return false
  try {
    const permissoes = JSON.parse(usuario.permissoes_json) as Record<string, string[]>
    return Array.isArray(permissoes[area]) && permissoes[area].includes(acao)
  } catch {
    return false
  }
}

/**
 * Obtém o perfil do usuário logado a partir da tabela `usuarios`.
 * Se não estiver logado, redireciona automaticamente para o login.
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

  // Se o usuário autenticado ainda não tem registro na tabela `usuarios`,
  // cria um perfil inicial como admin_ti para o primeiro acesso
  if (error || !usuario) {
    const nomePadrao = user.user_metadata?.nome || user.email?.split('@')[0] || 'Administrador'
    
    const { data: novoUsuario } = await supabase
      .from('usuarios')
      .upsert({
        auth_user_id: user.id,
        email: user.email!,
        nome: nomePadrao,
        papel: 'admin_ti',
        ativo: true,
      }, { onConflict: 'email' })
      .select()
      .single()

    if (novoUsuario) {
      return novoUsuario as UsuarioPerfil
    }

    return {
      id: user.id,
      auth_user_id: user.id,
      nome: nomePadrao,
      email: user.email!,
      papel: 'admin_ti',
      ativo: true,
    }
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=desativado')
  }

  return usuario as UsuarioPerfil
}
