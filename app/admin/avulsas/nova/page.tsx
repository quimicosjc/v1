import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import PaginaAvulsaEditor from '@/components/admin/PaginaAvulsaEditor'

export const metadata: Metadata = {
  title: 'Nova Página Avulsa — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NovaPaginaAvulsaPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'paginas', 'criar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Nova página avulsa" activeHref="/admin/avulsas">
        <AcessoRestritoAdmin
          titulo="Acesso restrito à criação de páginas avulsas"
          descricao="Sua conta não possui autorização para criar novas páginas avulsas."
        />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Nova página avulsa"
      activeHref="/admin/avulsas"
    >
      <PaginaAvulsaEditor pagina={null} />
    </AdminLayout>
  )
}
