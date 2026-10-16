'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { loginAction } from './actions'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; email?: string } | null, formData: FormData) => {
      const res = await loginAction(formData)
      return res || null
    },
    null
  )

  // Ao ocorrer erro de senha/login:
  // - O e-mail permanece preenchido
  // - Limpa o campo de senha
  // - Foca automaticamente no campo de senha para redigitação imediata
  useEffect(() => {
    if (state?.error) {
      setPassword('')
      if (passwordInputRef.current) {
        passwordInputRef.current.focus()
      }
    }
  }, [state?.error])

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com.br"
          disabled={isPending}
          style={{
            display: 'block',
            width: '100%',
            padding: '11px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '16px',
            color: '#30252a',
            background: isPending ? '#f8fafb' : 'white',
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
            ref={passwordInputRef}
            name="password"
            type={mostrarSenha ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
            style={{
              display: 'block',
              width: '100%',
              padding: '11px 44px 11px 12px',
              border: '1px solid #cbd7de',
              borderRadius: '5px',
              fontSize: '16px',
              color: '#30252a',
              background: isPending ? '#f8fafb' : 'white',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            title={mostrarSenha ? 'Ocultar senha' : 'Ver senha digitada'}
            disabled={isPending}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          padding: '12px 16px',
          background: isPending ? '#a85068' : '#861e32',
          color: 'white',
          border: '1px solid #861e32',
          borderRadius: '5px',
          fontSize: '15px',
          fontWeight: 650,
          cursor: isPending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        {isPending ? (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: 'girarSpinner 0.8s linear infinite',
              }}
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            <style>{`
              @keyframes girarSpinner {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <span>Autenticando…</span>
          </>
        ) : (
          'Entrar no painel'
        )}
      </button>
    </form>
  )
}
