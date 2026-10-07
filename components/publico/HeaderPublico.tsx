import React from 'react'
import Link from 'next/link'

interface HeaderPublicoProps {
  slugAtivo?: string
}

export default function HeaderPublico({ slugAtivo }: HeaderPublicoProps) {
  const linkStyle = (href: string): React.CSSProperties => {
    let isActive = false
    if (!slugAtivo || slugAtivo === '/' || slugAtivo === 'home' || slugAtivo === 'inicio') {
      isActive = href === '/' && Boolean(slugAtivo)
    } else {
      if (href === '/') {
        isActive = false
      } else if (href === '/noticias') {
        isActive = slugAtivo === 'noticias' || slugAtivo === 'lista-noticias'
      } else if (href === '/jornais') {
        isActive = slugAtivo === 'jornais'
      } else {
        const cleanHref = href.replace('/paginas/', '')
        isActive = cleanHref === slugAtivo || slugAtivo.startsWith(cleanHref)
      }
    }

    return {
      color: '#ffffff',
      fontSize: '13px',
      textDecoration: 'none',
      fontWeight: isActive ? 700 : 500,
      borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
      paddingBottom: '2px',
      transition: 'border-color 0.15s ease',
    }
  }

  return (
    <header
      style={{
        background: '#65172A',
        color: '#ffffff',
        borderBottom: '3px solid #861e32',
        padding: '14px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <img
            src="/logo-sindicato.png"
            alt="Logo Sindicato dos Químicos SJC"
            style={{ height: '44px', width: 'auto', display: 'block' }}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.4px', lineHeight: 1.2 }}>
              Sindicato dos Químicos
            </div>
            <div style={{ fontSize: '11px', opacity: 0.85, letterSpacing: '0.3px' }}>
              São José dos Campos e Região • Desde 1963
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/" style={linkStyle('/')}>
            Início
          </Link>
          <Link href="/noticias" style={linkStyle('/noticias')}>
            Notícias
          </Link>
          <Link href="/paginas/diretoria" style={linkStyle('diretoria')}>
            Diretoria
          </Link>
          <Link href="/paginas/convenios" style={linkStyle('convenios')}>
            Convênios
          </Link>
          <Link href="/paginas/cct" style={linkStyle('cct')}>
            Jurídico & CCT
          </Link>
          <Link href="/paginas/colonia" style={linkStyle('colonia')}>
            Colônia
          </Link>
          <Link href="/jornais" style={linkStyle('/jornais')}>
            Jornais
          </Link>
          <Link href="/paginas/fale-conosco" style={linkStyle('fale-conosco')}>
            Sedes & Contatos
          </Link>
          <Link
            href="/admin"
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              padding: '5px 12px',
              fontSize: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              marginLeft: '4px',
            }}
          >
            Área Restrita 🔒
          </Link>
        </nav>
      </div>
    </header>
  )
}
