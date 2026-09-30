import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { listarNoticias } from './actions'
import AdminLayout from '@/components/admin/AdminLayout'
import NoticiaLista from '@/components/admin/NoticiaLista'

export const metadata: Metadata = {
  title: 'Notícias — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NoticiasPage() {
  const usuario = await getUsuarioLogado()
  const noticias = await listarNoticias({})

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Notícias"
      activeHref="/admin/noticias"
    >
      <NoticiaLista noticias={noticias} />
    </AdminLayout>
  )
}
