import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import HomepageGerenciador from '@/components/admin/HomepageGerenciador'
import { obterConfigHomepage } from '@/app/admin/homepage/actions'

export const metadata: Metadata = {
  title: 'Homepage — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function HomepagePage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'homepage', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Homepage" activeHref="/admin/homepage">
        <AcessoRestritoAdmin
          titulo="Acesso restrito à Homepage"
          descricao="Sua conta não possui autorização para configurar a homepage ou os banners rotativos."
        />
      </AdminLayout>
    )
  }

  const config = await obterConfigHomepage()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Homepage"
      activeHref="/admin/homepage"
    >
      <HomepageGerenciador
        configInicial={config}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
