'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

import { formatarDataExtenso } from '@/lib/data-formatada'

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
}

interface ListaNoticiasPublicaProps {
  noticiasIniciais: NoticiaItemPublico[]
}

const ITENS_POR_PAGINA = 20

export default function ListaNoticiasPublica({ noticiasIniciais }: ListaNoticiasPublicaProps) {
  const [busca, setBusca] = useState('')
  const [chapeuSelecionado, setChapeuSelecionado] = useState<string>('todos')
  const [pagina, setPagina] = useState(1)

  // Extrai lista única de assuntos / chapéus
  const chapeusDisponiveis = useMemo(() => {
    const set = new Set<string>()
    noticiasIniciais.forEach((n) => {
      if (n.chapeu && n.chapeu.trim()) set.add(n.chapeu.trim())
    })
    return Array.from(set).sort()
  }, [noticiasIniciais])

  // Filtra as matérias
  const filtradas = useMemo(() => {
    return noticiasIniciais.filter((n) => {
      if (chapeuSelecionado !== 'todos' && n.chapeu !== chapeuSelecionado) {
        return false
      }
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const noTitulo = n.titulo.toLowerCase().includes(termo)
        const noResumo = n.resumo?.toLowerCase().includes(termo) ?? false
        const noChapeu = n.chapeu?.toLowerCase().includes(termo) ?? false
        if (!noTitulo && !noResumo && !noChapeu) return false
      }
      return true
    })
  }, [noticiasIniciais, busca, chapeuSelecionado])

  const totalPaginas = Math.ceil(filtradas.length / ITENS_POR_PAGINA) || 1
  const itensPagina = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA
    return filtradas.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [filtradas, pagina])

  const temDestaque = busca.trim() === '' && chapeuSelecionado === 'todos' && pagina === 1 && itensPagina.length > 0
  const materiaDestaque = temDestaque ? itensPagina[0] : null
  const materiasParaGrade = temDestaque ? itensPagina.slice(1) : itensPagina

  function mudarBusca(val: string) {
    setBusca(val)
    setPagina(1)
  }

  function mudarChapeu(val: string) {
    setChapeuSelecionado(val)
    setPagina(1)
  }

  return (
    <div>
      {/* ── BARRA DE BUSCA E FILTROS ── */}
      <div
        style={{
          background: '#faf8f9',
          border: '1px solid #ebdbe0',
          borderRadius: '6px',
          padding: '18px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71636a', marginBottom: '6px', textTransform: 'uppercase' }}>
              Pesquisar Notícias
            </label>
            <input
              type="text"
              value={busca}
              onChange={(e) => mudarBusca(e.target.value)}
              placeholder="Digite termos como campanha salarial, assembleia, CCT..."
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {chapeusDisponiveis.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71636a', marginBottom: '6px', textTransform: 'uppercase' }}>
                Filtrar por Assunto
              </label>
              <select
                value={chapeuSelecionado}
                onChange={(e) => mudarChapeu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid #cbd7de',
                  borderRadius: '5px',
                  fontSize: '14px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                <option value="todos">Todos os assuntos ({noticiasIniciais.length})</option>
                {chapeusDisponiveis.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#71636a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Exibindo <strong>{filtradas.length}</strong> {filtradas.length === 1 ? 'matéria encontrada' : 'matérias encontradas'}</span>
          {(busca || chapeuSelecionado !== 'todos') && (
            <button
              onClick={() => { setBusca(''); setChapeuSelecionado('todos'); setPagina(1) }}
              style={{ background: 'none', border: 'none', color: '#861e32', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── SUPER DESTAQUE DA MATÉRIA PRINCIPAL (Quando sem filtro e na 1ª página) ── */}
      {temDestaque && materiaDestaque && (() => {
        let fotoUrlDestaque = materiaDestaque.banner_url
        let focoYDestaque = materiaDestaque.imagem_y ?? 50
        if (materiaDestaque.fotos_json) {
          try {
            const arr = JSON.parse(materiaDestaque.fotos_json)
            if (arr[0]?.url) {
              fotoUrlDestaque = arr[0].url
              focoYDestaque = arr[0].foco ?? focoYDestaque
            }
          } catch {}
        }

        return (
          <div style={{ marginBottom: '36px' }}>
            <Link
              href={`/noticias/${materiaDestaque.slug}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                background: '#ffffff',
                border: '1px solid #ebdbe0',
                borderRadius: '8px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 14px rgba(48,37,42,0.05)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="news-card-hover"
            >
              <div
                style={{
                  aspectRatio: '16 / 10',
                  minHeight: '260px',
                  background: '#24141A',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {fotoUrlDestaque ? (
                  <img
                    src={fotoUrlDestaque}
                    alt={materiaDestaque.titulo}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `50% ${focoYDestaque}%`,
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8f2f4',
                    }}
                  >
                    <img
                      src="/logo-sindicato.png"
                      alt="Sindicato"
                      style={{ maxHeight: '72px', opacity: 0.85 }}
                    />
                  </div>
                )}
                {materiaDestaque.chapeu && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: '#861e32',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 9px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {materiaDestaque.chapeu}
                  </span>
                )}
              </div>

              <div
                style={{
                  padding: '28px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {materiaDestaque.publicado_em && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      color: '#71636a',
                      marginBottom: '10px',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatarDataExtenso(materiaDestaque.publicado_em)}</span>
                  </div>
                )}
                <h2
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: '#1a1417',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {materiaDestaque.titulo}
                </h2>
                {materiaDestaque.resumo && (
                  <p
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: '#554950',
                      margin: '0 0 20px 0',
                    }}
                  >
                    {materiaDestaque.resumo}
                  </p>
                )}
                <div>
                  <span
                    style={{
                      background: '#861e32',
                      color: '#ffffff',
                      padding: '9px 18px',
                      borderRadius: '5px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Ler matéria completa →
                  </span>
                </div>
              </div>
            </Link>

            {materiasParaGrade.length > 0 && (
              <div
                style={{
                  margin: '36px 0 20px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '20px',
                    background: '#861e32',
                    display: 'inline-block',
                    borderRadius: '2px',
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '22px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#30252a',
                    margin: 0,
                  }}
                >
                  Mais Notícias da Categoria
                </h3>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── GRADE DE NOTÍCIAS ── */}
      {itensPagina.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#71636a' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>Nenhuma notícia encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px', marginBottom: '32px' }}>
          {materiasParaGrade.map((item) => {
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

            return (
              <Link
                key={item.id}
                href={`/noticias/${item.slug}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebdbe0',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                className="news-card-hover"
              >
                <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#eee', overflow: 'hidden', position: 'relative' }}>
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
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4', padding: '20px' }}>
                      <img
                        src="/logo-sindicato.png"
                        alt="Sindicato dos Químicos"
                        style={{ maxHeight: '72px', maxWidth: '80%', objectFit: 'contain', opacity: 0.85 }}
                      />
                    </div>
                  )}
                  {item.chapeu && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: '#861e32',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.chapeu}
                    </span>
                  )}
                </div>

                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {item.publicado_em && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71636a', marginBottom: '8px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{formatarDataExtenso(item.publicado_em)}</span>
                      </div>
                    )}
                    <h3 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.35, color: '#30252a', margin: '0 0 8px 0' }}>
                      {item.titulo}
                    </h3>
                    {item.resumo && (
                      <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#71636a', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.resumo}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#861e32' }}>
                    Ler matéria completa →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── PAGINAÇÃO (CONFORME DOCUMENTO MESTRE § 1.7) ── */}
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
    </div>
  )
}
