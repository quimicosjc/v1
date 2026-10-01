import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import SolicitacoesGerenciador from '@/components/admin/SolicitacoesGerenciador'
import { listarSolicitacoes, obterContagemPendentes } from '@/app/admin/solicitacoes/actions'

export const metadata: Metadata = {
  title: 'Solicitações — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function SolicitacoesPage() {
  const usuario = await getUsuarioLogado()
  const [solicitacoes, pendentesCount] = await Promise.all([
    listarSolicitacoes({}),
    obterContagemPendentes(),
  ])

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Solicitações"
      activeHref="/admin/solicitacoes"
      pendentesCount={pendentesCount}
    >
      <SolicitacoesGerenciador
        solicitacoesIniciais={solicitacoes}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
