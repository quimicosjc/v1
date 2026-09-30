import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import AdminLayout from '@/components/admin/AdminLayout'
import NoticiaEditor from '@/components/admin/NoticiaEditor'
import type { Noticia } from '@/app/admin/noticias/actions'

export const metadata: Metadata = {
  title: 'Editar Notícia — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarNoticiaPage({ params }: Props) {
  const { id } = await params
  const usuario = await getUsuarioLogado()

  const supabase = await createClient()
  const { data: noticia, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'noticia')
    .single()

  if (error || !noticia) {
    notFound()
  }

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Editar notícia"
      activeHref="/admin/noticias"
    >
      <NoticiaEditor noticia={noticia as Noticia} />
    </AdminLayout>
  )
}
