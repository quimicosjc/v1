'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await loginAction(formData)
      return res || null
    },
    null
  )

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="redirect" value={redirectTo} />

      {state?.error && (
        <div role="alert" style={{
          padding: '14px 16px',
          borderLeft: '4px solid #861e32',
          background: '#fff0f3',
          color: '#65172a',
          fontSize: '14px',
          marginBottom: '22px',
          borderRadius: '0 4px 4px 0',
          lineHeight: '1.5',
        }}>
          {state.error}
        </div>
      )}

      <label style={{ display: 'block', marginBottom: '20px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#30252a' }}>
          E-mail
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com.br"
          style={{
            display: 'block',
            width: '100%',
            padding: '11px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '16px',
            color: '#30252a',
            background: 'white',
            boxSizing: 'border-box',
          }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '28px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#30252a' }}>
          Senha
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          style={{
            display: 'block',
            width: '100%',
            padding: '11px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '16px',
            color: '#30252a',
            background: 'white',
            boxSizing: 'border-box',
          }}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          background: isPending ? '#a85068' : '#861e32',
          color: 'white',
          border: '1px solid #861e32',
          borderRadius: '5px',
          fontSize: '15px',
          fontWeight: 650,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        {isPending ? 'Entrando…' : 'Entrar no painel'}
      </button>
    </form>
  )
}
