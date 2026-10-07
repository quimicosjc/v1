import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import ColoniaHub from '@/components/admin/paginas/ColoniaHub'
import { listarPaginasInstitucionais } from '../actions'

export const metadata: Metadata = {
  title: 'Colônia de Férias — Páginas do Site · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function ColoniaHubPage() {
  const usuario = await getUsuarioLogado()
  const paginas = await listarPaginasInstitucionais()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Páginas do site > Colônia de Férias"
      activeHref="/admin/paginas"
    >
      <ColoniaHub paginas={paginas} />
    </AdminLayout>
  )
}
