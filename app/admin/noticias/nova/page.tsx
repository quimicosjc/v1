import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import NoticiaEditor from '@/components/admin/NoticiaEditor'

export const metadata: Metadata = {
  title: 'Nova Notícia — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NovaNoticiaPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'noticias', 'criar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Nova notícia" activeHref="/admin/noticias">
        <AcessoRestritoAdmin
          titulo="Acesso restrito à criação de notícias"
          descricao="Sua conta não possui autorização para criar novas notícias."
        />
      </AdminLayout>
    )
  }

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
