import { Metadata } from 'next'
import { getUsuarioLogado, podeGerenciarUsuarios } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import UsuariosGerenciador from '@/components/admin/UsuariosGerenciador'
import { listarUsuarios } from '@/app/admin/usuarios/actions'

export const metadata: Metadata = {
  title: 'Usuários e Permissões — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function UsuariosPage() {
  const usuario = await getUsuarioLogado()

  if (!podeGerenciarUsuarios(usuario)) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Usuários e permissões" activeHref="/admin/usuarios">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Usuários e Permissões"
          descricao="Apenas Administradores e Gestores podem visualizar ou gerenciar contas e permissões do painel."
        />
      </AdminLayout>
    )
  }

  const usuarios = await listarUsuarios()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Usuários e permissões"
      activeHref="/admin/usuarios"
    >
      <UsuariosGerenciador
        usuariosIniciais={usuarios}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
