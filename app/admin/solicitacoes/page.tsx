import { Metadata } from 'next'
import {
  getUsuarioLogado,
  obterSlugsSolicitacoesPermitidos,
  podeAcessarAlgumaSolicitacao,
} from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import AcessoRestritoAdmin from '@/components/admin/AcessoRestritoAdmin'
import SolicitacoesGerenciador from '@/components/admin/SolicitacoesGerenciador'
import { listarSolicitacoes, obterContagemPendentes } from '@/app/admin/solicitacoes/actions'

export const metadata: Metadata = {
  title: 'Solicitações — Painel de Controle · Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>
}) {
  const usuario = await getUsuarioLogado()

  if (!podeAcessarAlgumaSolicitacao(usuario)) {
    return (
      <AdminLayout usuario={usuario} breadcrumb="Solicitações" activeHref="/admin/solicitacoes">
        <AcessoRestritoAdmin
          titulo="Acesso restrito a Solicitações"
          descricao="Sua conta não possui autorização para consultar solicitações, sindicalizações, carteirinhas ou denúncias."
        />
      </AdminLayout>
    )
  }

  const slugsPermitidos = obterSlugsSolicitacoesPermitidos(usuario, 'consultar')
  const params = searchParams ? await searchParams : {}
  const tipoInicial =
    params.tipo && slugsPermitidos.includes(params.tipo) ? params.tipo : 'todas'

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
        slugsPermitidos={slugsPermitidos}
        tipoInicial={tipoInicial}
      />
    </AdminLayout>
  )
}
