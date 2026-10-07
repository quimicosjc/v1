import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import PaginasHub from '@/components/admin/paginas/PaginasHub'
import { listarPaginasInstitucionais } from './actions'

export const metadata: Metadata = {
  title: 'Páginas do Site — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function PaginasSitePage() {
  const usuario = await getUsuarioLogado()
  const paginas = await listarPaginasInstitucionais()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Páginas do site"
      activeHref="/admin/paginas"
    >
      <PaginasHub paginas={paginas} />
    </AdminLayout>
  )
}
