'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUsuarioLogado } from '@/lib/supabase/auth'

export interface UsuarioAdmin {
  id: string
  auth_user_id: string
  nome: string
  email: string
  papel: 'operador' | 'gestor' | 'admin_ti'
  ativo: boolean
  e_principal: boolean
  pode_denuncias: boolean
  permissoes_json: string | null
  criado_em: string
  atualizado_em?: string
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Lista todos os usuários do painel.
 */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  await getUsuarioLogado()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('e_principal', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao listar usuários:', error)
    return []
  }

  return (data as UsuarioAdmin[]) || []
}

/**
 * Cria um novo usuário no Supabase Auth e salva seu perfil.
 */
export async function criarUsuario(data: {
  nome: string
  email: string
  senha: string
  papel: 'operador' | 'gestor' | 'admin_ti'
  pode_denuncias: boolean
  permissoes?: Record<string, string[]>
}): Promise<{ ok: boolean; id?: string } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()

    // Apenas admin_ti ou gestores autorizados podem criar usuários
    if (usuarioLogado.papel === 'operador') {
      return { error: 'Você não tem permissão para cadastrar novos usuários.' }
    }

    if (!data.nome.trim() || !data.email.trim() || !data.senha) {
      return { error: 'Preencha todos os campos obrigatórios.' }
    }

    if (data.senha.length < 6) {
      return { error: 'A senha deve ter no mínimo 6 caracteres.' }
    }

    const emailNormalizado = data.email.trim().toLowerCase()
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalizado,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome.trim() },
    })

    if (authError || !authData.user) {
      if (authError?.message.includes('already registered')) {
        return { error: 'Este e-mail já está cadastrado no sistema.' }
      }
      return { error: `Erro ao criar acesso: ${authError?.message || 'Falha desconhecida'}` }
    }

    const authUserId = authData.user.id

    // 2. Insere na tabela de usuários do banco
    const { error: dbError } = await supabaseAdmin.from('usuarios').upsert({
      id: authUserId,
      auth_user_id: authUserId,
      nome: data.nome.trim(),
      email: emailNormalizado,
      papel: data.papel,
      ativo: true,
      e_principal: false,
      pode_denuncias: data.pode_denuncias,
      permissoes_json: data.permissoes ? JSON.stringify(data.permissoes) : null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Erro ao salvar perfil no banco:', dbError)
      return { error: 'O acesso foi criado, mas houve um erro ao salvar os detalhes do perfil.' }
    }

    return { ok: true, id: authUserId }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado'
    console.error('Erro em criarUsuario:', err)
    return { error: `Falha ao criar usuário: ${errorMsg}` }
  }
}

/**
 * Atualiza dados de um usuário (permissões, status ativo/inativo, papel).
 */
export async function atualizarUsuario(
  id: string,
  data: {
    nome?: string
    papel?: 'operador' | 'gestor' | 'admin_ti'
    ativo?: boolean
    pode_denuncias?: boolean
    permissoes_json?: string | null
  }
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Busca usuário alvo para checagem de proteção
    const { data: usuarioAlvo, error: erroBusca } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (erroBusca || !usuarioAlvo) {
      return { error: 'Usuário não encontrado.' }
    }

    // Regra de Ouro do Documento Mestre (§14.5): Proteção do Administrador Principal
    if (usuarioAlvo.e_principal) {
      if (data.ativo === false) {
        return { error: 'A conta principal é protegida e não pode ser inativada.' }
      }
      if (data.papel && data.papel !== 'admin_ti') {
        return { error: 'O nível de acesso da conta principal não pode ser reduzido.' }
      }
    }

    // Gestores comuns não podem alterar outros gestores ou admins
    if (usuarioLogado.papel === 'gestor' && usuarioAlvo.papel === 'admin_ti') {
      return { error: 'Você não tem permissão para alterar contas de Administrador.' }
    }

    // 2. Atualiza dados no banco
    const updatePayload: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (data.nome !== undefined) updatePayload.nome = data.nome.trim()
    if (data.papel !== undefined) updatePayload.papel = data.papel
    if (data.ativo !== undefined) updatePayload.ativo = data.ativo
    if (data.pode_denuncias !== undefined) updatePayload.pode_denuncias = data.pode_denuncias
    if (data.permissoes_json !== undefined) updatePayload.permissoes_json = data.permissoes_json

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update(updatePayload)
      .eq('id', id)

    if (dbError) {
      console.error('Erro ao atualizar usuário:', dbError)
      return { error: 'Não foi possível salvar as alterações no banco de dados.' }
    }

    return { ok: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado'
    console.error('Erro em atualizarUsuario:', err)
    return { error: `Erro ao atualizar usuário: ${errorMsg}` }
  }
}

/**
 * Redefine a senha de um usuário.
 */
export async function redefinirSenha(
  id: string,
  novaSenha: string
): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()
    if (usuarioLogado.papel === 'operador') {
      return { error: 'Você não tem permissão para redefinir senhas.' }
    }

    if (!novaSenha || novaSenha.length < 6) {
      return { error: 'A nova senha deve ter no mínimo 6 caracteres.' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Checa conta alvo
    const { data: usuarioAlvo } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (!usuarioAlvo) {
      return { error: 'Usuário não encontrado.' }
    }

    // A conta principal só pode ter a senha alterada pelo próprio titular
    if (usuarioAlvo.e_principal && usuarioLogado.id !== usuarioAlvo.id) {
      return { error: 'A senha da conta principal protegida só pode ser alterada pelo próprio titular.' }
    }

    const authUserId = usuarioAlvo.auth_user_id || usuarioAlvo.id

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: novaSenha,
    })

    if (authError) {
      return { error: `Erro ao atualizar senha: ${authError.message}` }
    }

    return { ok: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado'
    return { error: `Erro: ${errorMsg}` }
  }
}

/**
 * Exclui um usuário do sistema.
 */
export async function excluirUsuario(id: string): Promise<{ ok: boolean } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()
    if (usuarioLogado.papel !== 'admin_ti') {
      return { error: 'Apenas Administradores podem excluir contas.' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: usuarioAlvo } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (!usuarioAlvo) {
      return { error: 'Usuário não encontrado.' }
    }

    if (usuarioAlvo.e_principal) {
      return { error: 'A conta principal é protegida e NUNCA pode ser excluída.' }
    }

    if (usuarioAlvo.id === usuarioLogado.id) {
      return { error: 'Você não pode excluir sua própria conta.' }
    }

    const authUserId = usuarioAlvo.auth_user_id || usuarioAlvo.id

    // 1. Remove do Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(authUserId)

    // 2. Remove do banco
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Erro ao remover perfil do banco:', dbError)
    }

    return { ok: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado'
    return { error: `Erro ao excluir usuário: ${errorMsg}` }
  }
}
