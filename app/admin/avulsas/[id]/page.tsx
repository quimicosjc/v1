import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import AdminLayout from '@/components/admin/AdminLayout'
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
