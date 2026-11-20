import { Metadata } from 'next'
import { getUsuarioLogado, temPermissao } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import InscricoesGerenciador from '@/components/admin/InscricoesGerenciador'
import { listarInscricoes } from '@/app/admin/inscricoes/actions'
import { obterContagemPendentes } from '@/app/admin/solicitacoes/actions'

export const metadata: Metadata = {
  title: 'Cadastro para Notícias — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function InscricoesPage() {
  const usuario = await getUsuarioLogado()

  if (!temPermissao(usuario, 'inscricoes', 'consultar')) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Cadastro para notícias" activeHref="/admin/inscricoes">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Cadastro para Notícias"
          descricao="Sua conta não possui autorização para visualizar os inscritos de notícias."
        />
      </AdminLayout>
    )
  }

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
