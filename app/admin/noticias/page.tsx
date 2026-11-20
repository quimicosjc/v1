import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import { listarNoticias } from './actions'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import NoticiaLista from '@/components/admin/NoticiaLista'

export const metadata: Metadata = {
  title: 'Notícias — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NoticiasPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'noticias', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Notícias" activeHref="/admin/noticias">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Notícias"
          descricao="Sua conta não possui autorização para consultar ou gerenciar o módulo de notícias."
        />
      </AdminLayout>
    )
  }

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
