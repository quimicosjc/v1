import React from 'react'
import Link from 'next/link'
import { CORES } from '@/lib/design'

export interface EdicaoJornalHome {
  id: string
  numero: string | number
  mes_ano: string
  capa_url?: string | null
  pdf_url?: string | null
  data_publicacao?: string | null
}

interface BlocoJornalProps {
  edicoes: EdicaoJornalHome[]
}

export default function BlocoJornal({ edicoes }: BlocoJornalProps) {
  if (!edicoes || edicoes.length === 0) return null

  const edicaoMaisRecente = edicoes[0]
  const edicoesAnteriores = edicoes.slice(1, 5)

  return (
    <section className="bloco-jornal-section">
      <div
        style={{
          background: '#FFFFFF',
          border: `1px solid ${CORES.line}`,
          borderTop: `4px solid ${CORES.action}`,
          borderRadius: '4px',
          padding: '32px 36px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}
        className="bloco-jornal-box"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '50% 50%',
            gap: '36px',
            alignItems: 'center',
          }}
          className="bloco-jornal-grid"
        >
          {/* ── COLUNA 1: EDIÇÃO ATUAL EM DESTAQUE ── */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              borderRight: `1px solid ${CORES.lineLight}`,
              paddingRight: '28px',
            }}
            className="bloco-jornal-col1"
          >
            {/* Capa em formato vertical natural proporcional à capa física do Boca no Trombone */}
            <a
              href={edicaoMaisRecente.pdf_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                flexShrink: 0,
                width: '150px',
                aspectRatio: '1 / 1.42',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#F8F4F5',
                transition: 'transform 0.2s ease',
              }}
              className="jornal-capa-link"
              title="Abrir edição em PDF"
            >
              <img
                src={edicaoMaisRecente.capa_url || '/jornais/capa-1.png'}
                alt={`Capa Boca no Trombone nº ${edicaoMaisRecente.numero}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </a>

            {/* Informações da edição recente */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: CORES.action,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Jornal Oficial da Categoria
              </div>
              <h3
                style={{
                  margin: '0 0 6px 0',
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '26px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                  color: CORES.primary,
                }}
              >
                Boca no Trombone
              </h3>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: CORES.ink,
                  marginBottom: '8px',
                }}
              >
                Edição nº {edicaoMaisRecente.numero} • {edicaoMaisRecente.mes_ano}
              </div>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                  color: CORES.muted,
                }}
              >
                Informativo oficial com as principais denúncias das fábricas, assembleias e mobilizações da categoria química e farmacêutica.
              </p>

              {/* Ações da Edição Principal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
                className="botoes-jornal-mobile"
              >
                {edicaoMaisRecente.pdf_url && (
                  <a
                    href={edicaoMaisRecente.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: CORES.action,
                      color: '#FFFFFF',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    className="btn-baixar-pdf"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Baixar PDF</span>
                  </a>
                )}

                <Link
                  href="/jornais"
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: CORES.action,
                    textDecoration: 'none',
                  }}
                  className="link-jornal-mobile-acervo"
                >
                  <span>Ver todas as edições</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ── COLUNA 2: EDIÇÕES ANTERIORES E ACERVO ── */}
          <div className="bloco-jornal-col2">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: CORES.primary,
                  letterSpacing: '0.4px',
                }}
              >
                Edições Anteriores
              </div>
              <Link
                href="/jornais"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: CORES.action,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                className="link-acervo-todas"
              >
                <span>Ver acervo completo</span>
                <span>→</span>
              </Link>
            </div>

            {/* Grid com as miniaturas das edições anteriores */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}
              className="grid-edicoes-anteriores"
            >
              {edicoesAnteriores.map((ed) => (
                <a
                  key={ed.id}
                  href={ed.pdf_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: CORES.ink,
                    transition: 'transform 0.15s ease',
                  }}
                  className="card-edicao-mini"
                  title={`Edição nº ${ed.numero} (${ed.mes_ano})`}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1.42',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      border: `1px solid ${CORES.line}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      background: '#F8F4F5',
                      marginBottom: '6px',
                    }}
                  >
                    <img
                      src={ed.capa_url || '/jornais/capa-1.png'}
                      alt={`Edição ${ed.numero}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: CORES.primary,
                      lineHeight: 1.15,
                    }}
                  >
                    Nº {ed.numero}
                  </div>
                  <div style={{ fontSize: '11px', color: CORES.muted, marginTop: '2px' }}>
                    {ed.mes_ano}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .jornal-capa-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(101,23,42,0.22) !important;
        }
        .btn-baixar-pdf:hover {
          background: ${CORES.actionHover} !important;
          transform: translateY(-1px);
        }
        .link-acervo-todas:hover {
          text-decoration: underline !important;
        }
        .card-edicao-mini:hover {
          transform: translateY(-2px);
        }
        @media (max-width: 960px) {
          .bloco-jornal-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .bloco-jornal-col1 {
            border-right: none !important;
            border-bottom: 1px solid ${CORES.lineLight} !important;
            padding-right: 0 !important;
            padding-bottom: 24px !important;
          }
        }
        @media (max-width: 600px) {
          .bloco-jornal-box {
            padding: 24px 16px !important;
          }
          .bloco-jornal-col1 {
            border-bottom: none !important;
            padding-bottom: 0 !important;
            flex-direction: column !important;
            text-align: center !important;
          }
          .jornal-capa-link {
            width: 150px !important;
            margin: 0 auto !important;
          }
          .bloco-jornal-col2 {
            display: none !important;
          }
          .link-jornal-mobile-acervo {
            display: inline-flex !important;
          }
          .botoes-jornal-mobile {
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  )
}
