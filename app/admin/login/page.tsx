import { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Painel de Controle — Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams
  const redirectTo = redirectParam || '/admin'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f5f6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        border: '1px solid #e4dce0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>

        {/* Cabeçalho com logo — fundo bordô exato do protótipo */}
        <div style={{
          background: '#65172a',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Image
            src="/logo-sindicato.png"
            alt="Sindicato dos Químicos de São José dos Campos e Região"
            width={200}
            height={100}
            style={{ objectFit: 'contain', maxHeight: '90px', width: 'auto' }}
            priority
          />
        </div>

        {/* Corpo */}
        <div style={{ padding: '32px' }}>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '12px',
            letterSpacing: '1.5px',
            color: '#861e32',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            PAINEL DE CONTROLE
          </p>

          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>

      {/* Nota de acesso restrito */}
      <p style={{
        marginTop: '20px',
        fontSize: '13px',
        color: '#71636a',
        textAlign: 'center',
      }}>
        Acesso restrito à equipe autorizada do Sindicato.
      </p>
    </div>
  )
}
