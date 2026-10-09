'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

import { formatarDataExtenso } from '@/lib/data-formatada'
import { detectarOrigem } from '@/lib/social-origem'

export interface NoticiaItemPublico {
  id: string
  titulo: string
  slug: string
  resumo?: string | null
  chapeu?: string | null
  banner_url?: string | null
  imagem_y?: number | null
  publicado_em?: string | null
  fotos_json?: string | null
  url_referencia?: string | null
}

interface ListaNoticiasPublicaProps {
  noticiasIniciais: NoticiaItemPublico[]
}

const ITENS_POR_PAGINA = 20

export default function ListaNoticiasPublica({ noticiasIniciais }: ListaNoticiasPublicaProps) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  // Filtra as matérias apenas pelo campo de busca textual (conforme M9)
  const filtradas = useMemo(() => {
    if (!busca.trim()) return noticiasIniciais
    const termo = busca.toLowerCase()
    return noticiasIniciais.filter((n) => {
      const noTitulo = n.titulo.toLowerCase().includes(termo)
      const noResumo = n.resumo?.toLowerCase().includes(termo) ?? false
      const noChapeu = n.chapeu?.toLowerCase().includes(termo) ?? false
      return noTitulo || noResumo || noChapeu
    })
  }, [noticiasIniciais, busca])

  const totalPaginas = Math.ceil(filtradas.length / ITENS_POR_PAGINA) || 1
  const itensPagina = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA
    return filtradas.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [filtradas, pagina])

  function mudarBusca(val: string) {
    setBusca(val)
    setPagina(1)
  }

  return (
    <div>
      {/* ── BARRA DE PESQUISA (M9: Mantém campo de pesquisa, sem filtro por assunto) ── */}
      <div
        style={{
          background: '#faf8f9',
          border: '1px solid #ebdbe0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={busca}
            onChange={(e) => mudarBusca(e.target.value)}
            placeholder="Pesquisar por notícias, acordos, comunicados ou palavras-chave…"
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              border: '1px solid #cbd7de',
              borderRadius: '6px',
              fontSize: '14.5px',
              boxSizing: 'border-box',
              outline: 'none',
              background: '#ffffff',
              color: '#1a1417',
              fontFamily: 'inherit',
            }}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71636a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {busca && (
            <button
              onClick={() => mudarBusca('')}
              type="button"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#71636a',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Limpar pesquisa"
            >
              ×
            </button>
          )}
        </div>

        <div style={{ marginTop: '10px', fontSize: '13px', color: '#71636a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Exibindo <strong>{filtradas.length}</strong> {filtradas.length === 1 ? 'notícia' : 'notícias'}
          </span>
          {busca && (
            <button
              onClick={() => mudarBusca('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#861e32',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Limpar pesquisa
            </button>
          )}
        </div>
      </div>

      {/* ── LISTAGEM DE NOTÍCIAS EM FORMATO LISTA COM FOTO LATERAL (M9) ── */}
      {itensPagina.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e4dce0',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#71636a',
          }}
        >
          <p style={{ fontSize: '16px', margin: 0 }}>Nenhuma notícia encontrada para o termo pesquisado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
          {itensPagina.map((item) => {
            let fotoUrl = item.banner_url
            let focoY = item.imagem_y ?? 50
            if (item.fotos_json) {
              try {
                const arr = JSON.parse(item.fotos_json)
                if (arr[0]?.url) {
                  fotoUrl = arr[0].url
                  focoY = arr[0].foco ?? focoY
                }
              } catch {}
            }
            const orig = detectarOrigem(item.url_referencia)

            return (
              <Link
                key={item.id}
                href={`/noticias/${item.slug}`}
                style={{
                  display: 'flex',
                  gap: '24px',
                  background: '#ffffff',
                  border: '1px solid #ebdbe0',
                  borderRadius: '8px',
                  padding: '18px 20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
                  boxShadow: '0 2px 8px rgba(48,37,42,0.03)',
                }}
                className="noticia-card-horizontal"
              >
                {/* Foto Lateral 3:2 */}
                <div
                  style={{
                    width: '240px',
                    minWidth: '240px',
                    aspectRatio: '3 / 2',
                    background: '#2b2628',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                  className="noticia-thumb-lateral"
                >
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={item.titulo}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: `50% ${focoY}%`,
                        display: 'block',
                      }}
                    />
                  ) : (
                    /* Imagem padrão com fundo cinza escuro e logo maior ocupando ~40% (M11-D) */
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#2b2628',
                        padding: '12px',
                      }}
                    >
                      <img
                        src="/logo-sindicato.png"
                        alt="Sindicato dos Químicos"
                        style={{
                          maxWidth: '42%',
                          maxHeight: '42%',
                          objectFit: 'contain',
                          filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                        }}
                      />
                    </div>
                  )}

                  {orig === 'youtube' && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#b91c1c',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: '3px',
                        letterSpacing: '0.4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      ▶ VÍDEO
                    </span>
                  )}
                  {orig === 'instagram' && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#be185d',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: '3px',
                        letterSpacing: '0.4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      📷 INSTAGRAM
                    </span>
                  )}
                </div>

                {/* Conteúdo ao lado */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {item.chapeu && (
                      <span
                        style={{
                          color: '#861e32',
                          fontSize: '12px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                        }}
                      >
                        {item.chapeu}
                      </span>
                    )}
                    {item.chapeu && item.publicado_em && (
                      <span style={{ color: '#d0c2c7', fontSize: '12px' }}>•</span>
                    )}
                    {item.publicado_em && (
                      <span style={{ fontSize: '12.5px', color: '#71636a' }}>
                        {formatarDataExtenso(item.publicado_em)}
                      </span>
                    )}
                  </div>

                  <h2
                    style={{
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '22px',
                      fontWeight: 800,
                      lineHeight: 1.22,
                      color: '#1a1417',
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.1px',
                    }}
                    className="noticia-titulo-hover"
                  >
                    {item.titulo}
                  </h2>

                  {item.resumo && (
                    <p
                      style={{
                        fontSize: '14.5px',
                        lineHeight: 1.55,
                        color: '#554950',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.resumo}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── PAGINAÇÃO ── */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
          <button
            onClick={() => setPagina(1)}
            disabled={pagina === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd7de',
              background: '#ffffff',
              borderRadius: '4px',
              cursor: pagina === 1 ? 'not-allowed' : 'pointer',
              opacity: pagina === 1 ? 0.5 : 1,
              fontSize: '13px',
            }}
          >
            « Início
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPagina(num)}
              style={{
                padding: '8px 14px',
                border: num === pagina ? '1px solid #861e32' : '1px solid #cbd7de',
                background: num === pagina ? '#861e32' : '#ffffff',
                color: num === pagina ? '#ffffff' : '#30252a',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: num === pagina ? 700 : 500,
              }}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPagina(totalPaginas)}
            disabled={pagina === totalPaginas}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd7de',
              background: '#ffffff',
              borderRadius: '4px',
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
              opacity: pagina === totalPaginas ? 0.5 : 1,
              fontSize: '13px',
            }}
          >
            Fim »
          </button>
        </div>
      )}

      <style>{`
        .noticia-card-horizontal:hover {
          border-color: #861e32 !important;
          box-shadow: 0 4px 14px rgba(134, 30, 50, 0.08) !important;
        }
        .noticia-card-horizontal:hover .noticia-titulo-hover {
          color: #861e32 !important;
        }
        @media (max-width: 720px) {
          .noticia-card-horizontal {
            flex-direction: column !important;
            gap: 14px !important;
            padding: 14px !important;
          }
          .noticia-thumb-lateral {
            width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
