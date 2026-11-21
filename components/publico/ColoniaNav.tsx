import React from 'react'
import Link from 'next/link'

interface ColoniaNavProps {
  slugAtual: string
  integradoHero?: boolean
}

export default function ColoniaNav({ slugAtual, integradoHero = false }: ColoniaNavProps) {
  const abas = [
    { slug: 'colonia', rotulo: 'Visão Geral', href: '/paginas/colonia' },
    { slug: 'colonia-valores', rotulo: 'Valores', href: '/paginas/colonia-valores' },
    { slug: 'colonia-regulamento', rotulo: 'Regulamento', href: '/paginas/colonia-regulamento' },
    { slug: 'colonia-reservas', rotulo: 'Reservas', href: '/paginas/colonia-reservas' },
    { slug: 'colonia-como-chegar', rotulo: 'Como Chegar', href: '/paginas/colonia-como-chegar' },
    { slug: 'colonia-fotos', rotulo: 'Fotos', href: '/paginas/colonia-fotos' },
  ]

  const isColonia = slugAtual.startsWith('colonia')
  if (!isColonia) return null

  return (
    <nav
      className="colonia-nav-bar"
      role="tablist"
      aria-label="Seções da Colônia de Férias"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: integradoHero ? '22px' : '0',
        borderTop: integradoHero ? '1px solid rgba(255,255,255,0.14)' : 'none',
        paddingTop: integradoHero ? '0' : '0',
      }}
    >
      {abas.map((aba) => {
        const ativa = slugAtual === aba.slug
        return (
          <Link
            key={aba.slug}
            href={aba.href}
            role="tab"
            aria-selected={ativa}
            aria-current={ativa ? 'page' : undefined}
            className={`colonia-nav-link ${ativa ? 'colonia-nav-link-ativa' : ''}`}
            style={{
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              textDecoration: 'none',
              padding: '11px 18px',
              background: ativa ? '#861E32' : 'transparent',
              color: ativa ? '#FFFFFF' : '#F6E7EC',
              borderBottom: ativa ? '3px solid #FFB8C5' : '3px solid transparent',
              transition: 'background 0.15s ease, color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {aba.rotulo}
          </Link>
        )
      })}

      <style>{`
        .colonia-nav-link:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          color: #FFFFFF !important;
        }
        .colonia-nav-link-ativa:hover {
          background: #861E32 !important;
        }
        @media (max-width: 768px) {
          .colonia-nav-bar {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            scrollbar-width: none;
          }
          .colonia-nav-bar::-webkit-scrollbar {
            display: none;
          }
          .colonia-nav-link {
            font-size: 15.5px !important;
            padding: 10px 14px !important;
          }
        }
      `}</style>
    </nav>
  )
}
