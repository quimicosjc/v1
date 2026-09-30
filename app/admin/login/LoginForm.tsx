'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | null, formData: FormData) => {
      const res = await loginAction(formData)
      return res || null
    },
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirect" value={redirectTo} />

      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-lg text-sm bg-red-50 border border-red-200 text-red-800"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-800 mb-1.5"
        >
          E-mail de acesso
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="exemplo@quimicosjc.org.br"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#861E32] focus:border-transparent text-gray-900 bg-white"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-gray-800 mb-1.5"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Digite sua senha"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#861E32] focus:border-transparent text-gray-900 bg-white"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 px-4 bg-[#861E32] hover:bg-[#65172A] text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-base mt-2"
      >
        {isPending ? 'Entrando no sistema...' : 'Entrar no Painel'}
      </button>

      <p className="text-xs text-center text-gray-500 pt-2">
        Acesso restrito à equipe autorizada do Sindicato dos Químicos de SJC e Região.
      </p>
    </form>
  )
}
