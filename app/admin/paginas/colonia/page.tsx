import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import ColoniaHub from '@/components/admin/paginas/ColoniaHub'
import { listarPaginasInstitucionais } from '../actions'

export const metadata: Metadata = {
  title: 'Colônia de Férias — Páginas do Site · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function ColoniaHubPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'paginas', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Páginas do site > Colônia de Férias" activeHref="/admin/paginas">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Páginas do Site"
          descricao="Sua conta não possui autorização para gerenciar as páginas da Colônia de Férias."
        />
      </AdminLayout>
    )
  }

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
