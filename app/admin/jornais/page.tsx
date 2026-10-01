import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import JornaisGerenciador from '@/components/admin/JornaisGerenciador'
import { listarPublicacoes, listarEdicoes } from '@/app/admin/jornais/actions'

export const metadata: Metadata = {
  title: 'Jornais e Publicações — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function JornaisPage() {
  const usuario = await getUsuarioLogado()
  const [publicacoes, edicoes] = await Promise.all([
    listarPublicacoes(),
    listarEdicoes({}),
  ])

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Jornais"
      activeHref="/admin/jornais"
    >
      <JornaisGerenciador
        publicacoesIniciais={publicacoes}
        edicoesIniciais={edicoes}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
