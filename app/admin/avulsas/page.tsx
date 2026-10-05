import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { listarPaginasAvulsas } from './actions'
import AdminLayout from '@/components/admin/AdminLayout'
import PaginaAvulsaLista from '@/components/admin/PaginaAvulsaLista'

export const metadata: Metadata = {
  title: 'Páginas Avulsas — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function PaginasAvulsasPage() {
  const usuario = await getUsuarioLogado()
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
