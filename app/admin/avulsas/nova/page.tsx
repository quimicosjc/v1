import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import PaginaAvulsaEditor from '@/components/admin/PaginaAvulsaEditor'

export const metadata: Metadata = {
  title: 'Nova Página Avulsa — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function NovaPaginaAvulsaPage() {
  const usuario = await getUsuarioLogado()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Nova página avulsa"
      activeHref="/admin/avulsas"
    >
      <PaginaAvulsaEditor pagina={null} />
    </AdminLayout>
  )
}
