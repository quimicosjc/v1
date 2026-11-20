'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  getUsuarioLogado,
  podeGerenciarUsuarios,
  temPermissao,
  type UsuarioPerfil,
} from '@/lib/supabase/auth'

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

const AREAS_PERMITIDAS = new Set([
  'noticias',
  'jornais',
  'paginas',
  'homepage',
  'sindicalizacoes',
  'carteirinhas',
  'atualizacoes',
  'denuncias',
  'inscricoes',
])

const ACOES_DELEGAVEIS = new Set(['consultar', 'criar', 'editar', 'publicar'])

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Sanitiza o mapa de permissões e garante que:
 * - Apenas áreas válidas e ações delegáveis (nunca 'excluir') sejam gravadas.
 * - Um Gestor nunca possa conceder uma permissão que ele próprio não possui.
 */
function validarESanitizarPermissoes(
  usuarioLogado: UsuarioPerfil,
  permissoesRaw: Record<string, string[]> | null | undefined
): { ok: true; mapa: Record<string, string[]>; podeDenuncias: boolean } | { ok: false; error: string } {
  const mapa: Record<string, string[]> = {
    noticias: [],
    jornais: [],
    paginas: [],
    homepage: [],
    sindicalizacoes: [],
    carteirinhas: [],
    atualizacoes: [],
    denuncias: [],
    inscricoes: [],
  }

  if (permissoesRaw && typeof permissoesRaw === 'object') {
    for (const [area, acoes] of Object.entries(permissoesRaw)) {
      if (!AREAS_PERMITIDAS.has(area) || !Array.isArray(acoes)) continue
      const limpas = Array.from(
        new Set(acoes.filter((a): a is string => typeof a === 'string' && ACOES_DELEGAVEIS.has(a)))
      )

      // Regra de delegação: Gestor só pode conceder ações que ele mesmo possui
      if (usuarioLogado.papel !== 'admin_ti') {
        for (const acao of limpas) {
          if (!temPermissao(usuarioLogado, area, acao)) {
            return {
              ok: false,
              error: `Você não possui a permissão "${acao}" em "${area}" e não pode delegá-la.`,
            }
          }
        }
      }

      mapa[area] = limpas
    }
  }

  const podeDenuncias =
    Array.isArray(mapa.denuncias) &&
    mapa.denuncias.some((a) => ['consultar', 'editar'].includes(a))

  return { ok: true, mapa, podeDenuncias }
}

/**
 * Lista todos os usuários do painel (restrito a Administradores e Gestores).
 */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const usuarioLogado = await getUsuarioLogado()
  if (!podeGerenciarUsuarios(usuarioLogado)) {
    return []
  }

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
 * Cria um novo usuário no Supabase Auth e salva seu perfil com princípio do menor privilégio.
 */
export async function criarUsuario(data: {
  nome: string
  email: string
  senha: string
  papel: 'operador' | 'gestor' | 'admin_ti'
  pode_denuncias?: boolean
  permissoes?: Record<string, string[]>
}): Promise<{ ok: boolean; id?: string; permissoes_json?: string; pode_denuncias?: boolean } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()

    if (!podeGerenciarUsuarios(usuarioLogado)) {
      return { error: 'Você não tem permissão para cadastrar novos usuários.' }
    }

    if (data.papel === 'admin_ti' && usuarioLogado.papel !== 'admin_ti') {
      return { error: 'Apenas Administradores podem conceder o nível de Administrador.' }
    }

    if (!data.nome.trim() || !data.email.trim() || !data.senha) {
      return { error: 'Preencha todos os campos obrigatórios.' }
    }

    if (data.senha.length < 6) {
      return { error: 'A senha deve ter no mínimo 6 caracteres.' }
    }

    // Princípio do menor privilégio: se permissoes não forem informadas, inicia sem permissões sensíveis
    const permissoesEntrada: Record<string, string[]> = {
      ...(data.permissoes || {}),
    }
    if (data.pode_denuncias && !permissoesEntrada.denuncias?.length) {
      permissoesEntrada.denuncias = ['consultar', 'editar']
    }

    const validacao = validarESanitizarPermissoes(usuarioLogado, permissoesEntrada)
    if (!validacao.ok) {
      return { error: validacao.error }
    }

    const podeDenunciasFinal = data.papel === 'admin_ti' ? true : validacao.podeDenuncias
    const permissoesJsonFinal = JSON.stringify(validacao.mapa)

    const emailNormalizado = data.email.trim().toLowerCase()
    const supabaseAdmin = getSupabaseAdmin()

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

    const { error: dbError } = await supabaseAdmin.from('usuarios').upsert({
      id: authUserId,
      auth_user_id: authUserId,
      nome: data.nome.trim(),
      email: emailNormalizado,
      papel: data.papel,
      ativo: true,
      e_principal: false,
      pode_denuncias: podeDenunciasFinal,
      permissoes_json: permissoesJsonFinal,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Erro ao salvar perfil no banco:', dbError)
      return { error: 'O acesso foi criado, mas houve um erro ao salvar os detalhes do perfil.' }
    }

    return {
      ok: true,
      id: authUserId,
      permissoes_json: permissoesJsonFinal,
      pode_denuncias: podeDenunciasFinal,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado'
    console.error('Erro em criarUsuario:', err)
    return { error: `Falha ao criar usuário: ${errorMsg}` }
  }
}

/**
 * Atualiza dados de um usuário (permissões segmentadas, status ativo/inativo, papel).
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
): Promise<{ ok: boolean; permissoes_json?: string | null; pode_denuncias?: boolean } | { error: string }> {
  try {
    const usuarioLogado = await getUsuarioLogado()

    if (!podeGerenciarUsuarios(usuarioLogado)) {
      return { error: 'Você não tem permissão para gerenciar contas de usuários.' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: usuarioAlvo, error: erroBusca } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (erroBusca || !usuarioAlvo) {
      return { error: 'Usuário não encontrado.' }
    }

    // Proteção do Administrador Principal
    if (usuarioAlvo.e_principal) {
      if (data.ativo === false) {
        return { error: 'A conta principal é protegida e não pode ser inativada.' }
      }
      if (data.papel && data.papel !== 'admin_ti') {
        return { error: 'O nível de acesso da conta principal não pode ser reduzido.' }
      }
    }

    if (usuarioLogado.papel === 'gestor' && usuarioAlvo.papel === 'admin_ti') {
      return { error: 'Você não tem permissão para alterar contas de Administrador.' }
    }

    if (usuarioLogado.papel === 'gestor' && data.papel === 'admin_ti') {
      return { error: 'Apenas Administradores podem conceder o nível de Administrador.' }
    }

    if (usuarioLogado.papel === 'gestor' && usuarioAlvo.papel === 'gestor' && usuarioAlvo.id !== usuarioLogado.id) {
      return { error: 'Você não tem permissão para alterar outros Gestores.' }
    }

    const updatePayload: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (data.nome !== undefined) updatePayload.nome = data.nome.trim()
    if (data.papel !== undefined) updatePayload.papel = data.papel
    if (data.ativo !== undefined) updatePayload.ativo = data.ativo

    let permissoesJsonFinal = data.permissoes_json
    let podeDenunciasFinal = data.pode_denuncias

    if (data.permissoes_json !== undefined && data.permissoes_json !== null) {
      let parsed: Record<string, string[]>
      try {
        parsed = JSON.parse(data.permissoes_json)
      } catch {
        return { error: 'Formato inválido de permissões.' }
      }

      // Se o checkbox de denúncias foi alterado separadamente sem atualizar o mapa, sincroniza
      if (data.pode_denuncias === false) {
        parsed.denuncias = []
      } else if (data.pode_denuncias === true && (!parsed.denuncias || parsed.denuncias.length === 0)) {
        parsed.denuncias = ['consultar', 'editar']
      }

      const validacao = validarESanitizarPermissoes(usuarioLogado, parsed)
      if (!validacao.ok) {
        return { error: validacao.error }
      }

      permissoesJsonFinal = JSON.stringify(validacao.mapa)
      podeDenunciasFinal = (data.papel ?? usuarioAlvo.papel) === 'admin_ti' ? true : validacao.podeDenuncias
      updatePayload.permissoes_json = permissoesJsonFinal
      updatePayload.pode_denuncias = podeDenunciasFinal
    } else if (data.pode_denuncias !== undefined) {
      if (usuarioLogado.papel === 'gestor' && !temPermissao(usuarioLogado, 'denuncias', 'consultar')) {
        return { error: 'Você não tem permissão para gerenciar acesso a denúncias.' }
      }
      updatePayload.pode_denuncias = data.pode_denuncias
    }

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update(updatePayload)
      .eq('id', id)

    if (dbError) {
      console.error('Erro ao atualizar usuário:', dbError)
      return { error: 'Não foi possível salvar as alterações no banco de dados.' }
    }

    return {
      ok: true,
      permissoes_json: permissoesJsonFinal,
      pode_denuncias: podeDenunciasFinal,
    }
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
    if (!podeGerenciarUsuarios(usuarioLogado)) {
      return { error: 'Você não tem permissão para redefinir senhas.' }
    }

    if (!novaSenha || novaSenha.length < 6) {
      return { error: 'A nova senha deve ter no mínimo 6 caracteres.' }
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

    if (usuarioAlvo.e_principal && usuarioLogado.id !== usuarioAlvo.id) {
      return { error: 'A senha da conta principal protegida só pode ser alterada pelo próprio titular.' }
    }

    if (usuarioLogado.papel === 'gestor' && usuarioAlvo.papel === 'admin_ti') {
      return { error: 'Você não tem permissão para alterar a senha de um Administrador.' }
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
 * Exclui um usuário do sistema (exclusivo de Administrador).
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

    await supabaseAdmin.auth.admin.deleteUser(authUserId)

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
