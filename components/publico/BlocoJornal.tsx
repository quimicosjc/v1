'use client'

import React, { useState, useRef, useEffect } from 'react'
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

export interface OutroJornalItem {
  id: string
  nome: string
}

interface BlocoJornalProps {
  edicoes: EdicaoJornalHome[]
  outrosJornais?: OutroJornalItem[]
}

export default function BlocoJornal({ edicoes, outrosJornais }: BlocoJornalProps) {
  const [dropAberto, setDropAberto] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropAberto(false)
      }
    }
    if (dropAberto) {
      document.addEventListener('mousedown', handleClickFora)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
    }
  }, [dropAberto])

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
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}
        className="bloco-jornal-box"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '48% 52%',
            gap: '32px',
            alignItems: 'center',
          }}
          className="bloco-jornal-grid"
        >
          {/* ── COLUNA 1: EDIÇÃO ATUAL EM DESTAQUE (BOCA NO TROMBONE) ── */}
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
                width: '145px',
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
                Jornal
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
                Edição nº {edicaoMaisRecente.numero}
              </div>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  color: CORES.muted,
                }}
              >
                Informativo oficial do Sindicato dos Químicos de São José dos Campos e Região
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
          <div className="bloco-jornal-col2" style={{ minWidth: 0, paddingRight: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                gap: '8px',
                paddingRight: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '17px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: CORES.primary,
                  letterSpacing: '0.4px',
                }}
              >
                Edições Anteriores
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Drop / Link de Outros Jornais */}
                <div ref={dropRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setDropAberto(!dropAberto)}
                    style={{
                      background: '#F8F4F5',
                      border: `1px solid ${CORES.line}`,
                      borderRadius: '4px',
                      padding: '5px 9px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: CORES.primary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'background 0.15s ease',
                    }}
                    className="btn-drop-outros-jornais"
                    aria-expanded={dropAberto}
                    title="Acessar outros jornais e publicações da entidade"
                  >
                    <span>Outros jornais</span>
                    <span style={{ fontSize: '9px', opacity: 0.7 }}>{dropAberto ? '▲' : '▼'}</span>
                  </button>

                  {dropAberto && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '6px',
                        background: '#FFFFFF',
                        border: `1px solid ${CORES.line}`,
                        borderRadius: '6px',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                        padding: '6px 0',
                        minWidth: '200px',
                        zIndex: 20,
                      }}
                    >
                      {outrosJornais && outrosJornais.length > 0 ? (
                        outrosJornais.map((pub) => (
                          <Link
                            key={pub.id}
                            href={`/jornais?pub=${pub.id}`}
                            onClick={() => setDropAberto(false)}
                            style={{
                              display: 'block',
                              padding: '8px 14px',
                              fontSize: '12.5px',
                              color: CORES.ink,
                              textDecoration: 'none',
                              transition: 'background 0.12s',
                            }}
                            className="drop-item-jornal"
                          >
                            📰 {pub.nome}
                          </Link>
                        ))
                      ) : (
                        <Link
                          href="/jornais"
                          onClick={() => setDropAberto(false)}
                          style={{
                            display: 'block',
                            padding: '8px 14px',
                            fontSize: '12.5px',
                            color: CORES.ink,
                            textDecoration: 'none',
                          }}
                          className="drop-item-jornal"
                        >
                          📰 Jornal da Família
                        </Link>
                      )}
                      <div style={{ height: '1px', background: CORES.lineLight, margin: '4px 0' }} />
                      <Link
                        href="/jornais"
                        onClick={() => setDropAberto(false)}
                        style={{
                          display: 'block',
                          padding: '8px 14px',
                          fontSize: '12px',
                          color: CORES.action,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                        className="drop-item-jornal"
                      >
                        📂 Ver acervo completo de jornais →
                      </Link>
                    </div>
                  )}
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
                  <span>Ver acervo</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Grid com as miniaturas das 4 edições anteriores com respiro balanceado e sem colar na borda */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '14px',
                paddingRight: '16px',
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
                    minWidth: 0,
                  }}
                  className="card-edicao-mini"
                  title={`Edição nº ${ed.numero}`}
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
        .drop-item-jornal:hover {
          background: #F8F2F4 !important;
          color: ${CORES.action} !important;
        }
        .btn-drop-outros-jornais:hover {
          background: #EFE6E9 !important;
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
