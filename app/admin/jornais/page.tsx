import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import JornaisGerenciador from '@/components/admin/JornaisGerenciador'
import { listarPublicacoes, listarEdicoes } from '@/app/admin/jornais/actions'

export const metadata: Metadata = {
  title: 'Jornais e Publicações — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function JornaisPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'jornais', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Jornais" activeHref="/admin/jornais">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Jornais"
          descricao="Sua conta não possui autorização para consultar ou gerenciar jornais e publicações."
        />
      </AdminLayout>
    )
  }

  const [publicacoes, edicoes] = await Promise.all([
    listarPublicacoes(),
    listarEdicoes({}),
  ])

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Jornais"
      activeHref="/admin/jornais"
    >
      <JornaisGerenciador
        publicacoesIniciais={publicacoes}
        edicoesIniciais={edicoes}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
