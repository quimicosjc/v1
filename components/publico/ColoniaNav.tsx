import React from 'react'
import Link from 'next/link'

interface ColoniaNavProps {
  slugAtual: string
}

export default function ColoniaNav({ slugAtual }: ColoniaNavProps) {
  const abas = [
    {
      slug: 'colonia',
      rotulo: 'Visão Geral',
      href: '/paginas/colonia',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
        </svg>
      ),
    },
    {
      slug: 'colonia-valores',
      rotulo: 'Valores e Diárias',
      href: '/paginas/colonia-valores',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      slug: 'colonia-regulamento',
      rotulo: 'Regulamento',
      href: '/paginas/colonia-regulamento',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      slug: 'colonia-reservas',
      rotulo: 'Como Reservar',
      href: '/paginas/colonia-reservas',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      slug: 'colonia-como-chegar',
      rotulo: 'Como Chegar',
      href: '/paginas/colonia-como-chegar',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      ),
    },
    {
      slug: 'colonia-fotos',
      rotulo: 'Galeria de Fotos',
      href: '/paginas/colonia-fotos',
      icone: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
  ]

  // Só exibe se for uma das páginas da colônia
  const isColonia = slugAtual.startsWith('colonia')
  if (!isColonia) return null

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e4dce0',
        borderRadius: '10px',
        padding: '16px 20px',
        margin: '24px 0 32px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid #f0e8ea',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#861e32',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Guia da Colônia de Férias • Caraguatatuba e São Sebastião
        </span>
        <span style={{ fontSize: '12px', color: '#71636a' }}>
          Lazer exclusivo para o trabalhador associado
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {abas.map((aba) => {
          const ativa = slugAtual === aba.slug
          return (
            <Link
              key={aba.slug}
              href={aba.href}
              style={{
                background: ativa ? '#861e32' : '#f8fafb',
                color: ativa ? '#ffffff' : '#30252a',
                border: ativa ? '1px solid #861e32' : '1px solid #cbd7de',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: ativa ? 700 : 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: ativa ? '0 2px 6px rgba(134,30,50,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
              className="colonia-tab"
            >
              {aba.icone}
              <span>{aba.rotulo}</span>
            </Link>
          )
        })}
      </div>

      <style>{`
        .colonia-tab:hover {
          background: #f0e6e8 !important;
          color: #861e32 !important;
          border-color: #861e32 !important;
        }
      `}</style>
    </div>
  )
}
