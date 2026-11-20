import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import { listarPaginasAvulsas } from './actions'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import PaginaAvulsaLista from '@/components/admin/PaginaAvulsaLista'

export const metadata: Metadata = {
  title: 'Páginas Avulsas — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function PaginasAvulsasPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'paginas', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Páginas avulsas" activeHref="/admin/avulsas">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Páginas Avulsas"
          descricao="Sua conta não possui autorização para consultar ou gerenciar páginas avulsas."
        />
      </AdminLayout>
    )
  }

  const paginas = await listarPaginasAvulsas({})

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Páginas avulsas"
      activeHref="/admin/avulsas"
    >
      <PaginaAvulsaLista paginas={paginas} />
    </AdminLayout>
  )
}
