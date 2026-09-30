import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import NoticiaEditor from '@/components/admin/NoticiaEditor'

export const metadata: Metadata = {
  title: 'Nova Notícia — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NovaNoticiaPage() {
  const usuario = await getUsuarioLogado()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Nova notícia"
      activeHref="/admin/noticias"
    >
      <NoticiaEditor noticia={null} />
    </AdminLayout>
  )
}
