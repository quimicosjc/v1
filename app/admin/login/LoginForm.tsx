'use client'

import { useActionState, useState } from 'react'
import { loginAction } from './actions'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            name="password"
            type={mostrarSenha ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{
              display: 'block',
              width: '100%',
              padding: '11px 44px 11px 12px',
              border: '1px solid #cbd7de',
              borderRadius: '5px',
              fontSize: '16px',
              color: '#30252a',
              background: 'white',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            title={mostrarSenha ? 'Ocultar senha' : 'Ver senha digitada'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#71636a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
          >
            {mostrarSenha ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
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
