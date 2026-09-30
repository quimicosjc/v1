import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { logoutAction } from '@/app/admin/login/actions'

export const metadata: Metadata = {
  title: 'Painel de Controle — Sindicato dos Químicos SJC',
}

export default async function AdminDashboardPage() {
  const usuario = await getUsuarioLogado()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra Superior Oficial */}
      <header className="bg-[#65172A] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
            SQ
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Sindicato dos Químicos
            </h1>
            <p className="text-xs text-white/70">
              São José dos Campos e Região — Painel Administrativo
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{usuario.nome}</p>
            <p className="text-xs text-white/70 capitalize">Perfil: {usuario.papel}</p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="py-1.5 px-3.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-semibold transition cursor-pointer border border-white/20"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#791C30]">
            Olá, {usuario.nome}!
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Seja bem-vindo ao painel de controle do portal. Escolha abaixo a seção que deseja gerenciar:
          </p>
        </div>

        {/* Grade de Módulos (Estilo Protótipo v9) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Notícias */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:border-[#861E32] transition">
            <div>
              <div className="w-12 h-12 rounded-lg bg-red-50 text-[#861E32] flex items-center justify-center text-2xl mb-4">
                📰
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Notícias & Artigos</h3>
              <p className="text-sm text-gray-500">
                Escreva notícias, publique avisos e edite informações para a categoria.
              </p>
            </div>
            <div className="mt-6">
              <span className="inline-block px-3 py-1.5 bg-[#861E32] text-white rounded-lg text-xs font-medium">
                Em estruturação (Bloco 3)
              </span>
            </div>
          </div>

          {/* Card: Formulários Recebidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:border-[#861E32] transition">
            <div>
              <div className="w-12 h-12 rounded-lg bg-red-50 text-[#861E32] flex items-center justify-center text-2xl mb-4">
                📬
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Mensagens & Denúncias</h3>
              <p className="text-sm text-gray-500">
                Consulte as mensagens enviadas pelos trabalhadores e denúncias sigilosas.
              </p>
            </div>
            <div className="mt-6">
              <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                5 canais ativos
              </span>
            </div>
          </div>

          {/* Card: Lixeira */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:border-[#861E32] transition">
            <div>
              <div className="w-12 h-12 rounded-lg bg-red-50 text-[#861E32] flex items-center justify-center text-2xl mb-4">
                🗑️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Lixeira Central</h3>
              <p className="text-sm text-gray-500">
                Itens excluídos com proteção de retenção automática por 60 dias.
              </p>
            </div>
            <div className="mt-6">
              <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                Retenção: 60 dias
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé do Painel */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        Painel de Gestão Editorial — Versão 1.0 • Sindicato dos Químicos de São José dos Campos e Região
      </footer>
    </div>
  )
}
