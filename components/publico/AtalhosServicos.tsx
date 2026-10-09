'use client'

import React from 'react'
import Link from 'next/link'
import { CORES } from '@/lib/design'

interface AtalhoItem {
  id: string
  titulo: string
  descricao: string
  href: string
  icone: React.ReactNode
}

const ATALHOS_CONFIG: Record<string, AtalhoItem> = {
  'fique-socio': {
    id: 'fique-socio',
    titulo: 'Fique Sócio',
    descricao: 'Filie-se online e fortaleça sua voz',
    href: '/paginas/fique-socio',
    icone: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
    ),
  },
  'denuncia': {
    id: 'denuncia',
    titulo: 'Enviar Denúncia',
    descricao: 'Canal 100% seguro e sigiloso',
    href: '/paginas/denuncia',
    icone: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  'colonia': {
    id: 'colonia',
    titulo: 'Colônia de Férias',
    descricao: 'Caraguatatuba e São Sebastião',
    href: '/paginas/colonia',
    icone: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4.8"/>
        {/* Raios ortogonais (topo, baixo, esquerda, direita) */}
        <line x1="12" y1="1.5" x2="12" y2="3.8"/>
        <line x1="12" y1="20.2" x2="12" y2="22.5"/>
        <line x1="1.5" y1="12" x2="3.8" y2="12"/>
        <line x1="20.2" y1="12" x2="22.5" y2="12"/>
        {/* Raios diagonais (360° em todos os lados do círculo) */}
        <line x1="4.6" y1="4.6" x2="6.3" y2="6.3"/>
        <line x1="17.7" y1="17.7" x2="19.4" y2="19.4"/>
        <line x1="19.4" y1="4.6" x2="17.7" y2="6.3"/>
        <line x1="4.6" y1="19.4" x2="6.3" y2="17.7"/>
      </svg>
    ),
  },
  'juridico': {
    id: 'juridico',
    titulo: 'Plantão Jurídico',
    descricao: 'Assessoria para a categoria química',
    href: '/paginas/juridico',
    icone: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
        <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
        <path d="M7 21h10"/>
        <path d="M12 3v18"/>
      </svg>
    ),
  },
}

interface AtalhosServicosProps {
  ordem?: string[]
}

export default function AtalhosServicos({ ordem }: AtalhosServicosProps) {
  const listaChaves = ordem && ordem.length > 0 ? ordem : ['fique-socio', 'denuncia', 'colonia', 'juridico']
  const itens = listaChaves
    .map((k) => ATALHOS_CONFIG[k])
    .filter(Boolean)

  return (
    <div className="atalhos-servicos-container">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
        className="atalhos-servicos-grid"
      >
        {itens.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${CORES.line}`,
              borderTop: `3px solid ${CORES.action}`,
              borderRadius: '4px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textDecoration: 'none',
              color: CORES.ink,
              transition: 'all 0.18s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            className="atalho-card"
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '6px',
                background: '#F8F2F4',
                color: CORES.action,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              className="atalho-icone-box"
            >
              {item.icone}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  lineHeight: 1.15,
                  color: CORES.primary,
                }}
              >
                {item.titulo}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .atalho-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(101,23,42,0.12) !important;
          border-color: ${CORES.action} !important;
        }
        .atalho-card:hover .atalho-icone-box {
          background: ${CORES.action} !important;
          color: #FFFFFF !important;
        }
        @media (max-width: 960px) {
          .atalhos-servicos-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 540px) {
          .atalhos-servicos-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .atalho-card {
            padding: 12px 14px !important;
          }
        }
      `}</style>
    </div>
  )
}
