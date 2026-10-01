import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import HomepageGerenciador from '@/components/admin/HomepageGerenciador'
import { obterConfigHomepage } from '@/app/admin/homepage/actions'

export const metadata: Metadata = {
  title: 'Homepage — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function HomepagePage() {
  const usuario = await getUsuarioLogado()
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
