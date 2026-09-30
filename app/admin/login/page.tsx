import { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Acesso ao Painel de Controle — Sindicato dos Químicos SJC',
  description: 'Área administrativa do portal oficial',
  robots: {
    index: false,
    follow: false,
  },
}

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectParam } = await searchParams
  const redirectTo = redirectParam || '/admin'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      {/* Container principal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Cabeçalho com as cores oficiais */}
        <div className="bg-[#65172A] p-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Sindicato dos Químicos
          </h1>
          <p className="text-xs text-white/80 mt-1 uppercase tracking-wider font-medium">
            Painel de Controle Editorial
          </p>
        </div>

        {/* Corpo do formulário */}
        <div className="p-8">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Sindicato dos Químicos de São José dos Campos e Região
      </div>
    </div>
  )
}
