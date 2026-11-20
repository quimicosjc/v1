import Link from 'next/link'

interface AcessoRestritoAdminProps {
  titulo?: string
  descricao?: string
}

export default function AcessoRestritoAdmin({
  titulo = 'Acesso restrito',
  descricao = 'Sua conta não possui autorização para acessar esta área do painel administrativo. Caso precise de acesso, solicite ao administrador do sistema.',
}: AcessoRestritoAdminProps) {
  return (
    <div
      role="alert"
      style={{
        maxWidth: '620px',
        margin: '48px auto',
        background: '#ffffff',
        border: '1px solid #e8c8ce',
        borderLeft: '4px solid #861e32',
        borderRadius: '8px',
        padding: '28px 32px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: '#861e32',
          marginBottom: '6px',
        }}
      >
        Permissão necessária
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#30252a', margin: '0 0 10px 0' }}>
        {titulo}
      </h1>
      <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#554950', margin: '0 0 22px 0' }}>
        {descricao}
      </p>
      <Link
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#861e32',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '5px',
          fontSize: '13.5px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ← Voltar ao início do painel
      </Link>
    </div>
  )
}
