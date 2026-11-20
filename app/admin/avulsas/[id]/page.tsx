import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import PaginaAvulsaEditor from '@/components/admin/PaginaAvulsaEditor'
import type { PaginaAvulsa } from '@/app/admin/avulsas/actions'

export const metadata: Metadata = {
  title: 'Editar Página Avulsa — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarPaginaAvulsaPage({ params }: Props) {
  const { id } = await params
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'paginas', 'editar') && !temPermissao(usuario, 'paginas', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Editar página avulsa" activeHref="/admin/avulsas">
        <AcessoRestritoAdmin
          titulo="Acesso restrito à edição de páginas avulsas"
          descricao="Sua conta não possui autorização para editar páginas avulsas."
        />
      </AdminLayout>
    )
  }

  const supabase = await createClient()
  const { data: pagina, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'avulsa')
    .single()

  if (error || !pagina) {
    notFound()
  }

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Editar página avulsa"
      activeHref="/admin/avulsas"
    >
      <PaginaAvulsaEditor pagina={pagina as PaginaAvulsa} />
    </AdminLayout>
  )
}
