import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import InscricoesGerenciador from '@/components/admin/InscricoesGerenciador'
import { listarInscricoes } from '@/app/admin/inscricoes/actions'
import { obterContagemPendentes } from '@/app/admin/solicitacoes/actions'

export const metadata: Metadata = {
  title: 'Cadastro para Notícias — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function InscricoesPage() {
  const usuario = await getUsuarioLogado()
  const [inscricoes, pendentesCount] = await Promise.all([
    listarInscricoes({}),
    obterContagemPendentes(),
  ])

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Cadastro para notícias"
      activeHref="/admin/inscricoes"
      pendentesCount={pendentesCount}
    >
      <InscricoesGerenciador
        inscricoesIniciais={inscricoes}
        usuarioLogado={usuario}
      />
    </AdminLayout>
  )
}
