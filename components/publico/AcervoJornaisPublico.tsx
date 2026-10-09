'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CORES, CONTAINER_STYLE } from '@/lib/design'

export interface EdicaoItem {
  id: string
  numero: string | number
  mes_ano: string
  capa_url?: string | null
  pdf_url?: string | null
  data_publicacao?: string | null
  criado_em: string
  publicacoes_jornal?: { id?: string; nome: string } | null
  publicacao_id?: string
}

export interface PublicacaoItem {
  id: string
  nome: string
  descricao?: string | null
}

interface AcervoJornaisPublicoProps {
  edicoes: EdicaoItem[]
  publicacoes: PublicacaoItem[]
}

const ITENS_POR_PAGINA_MOBILE = 20

export default function AcervoJornaisPublico({ edicoes, publicacoes }: AcervoJornaisPublicoProps) {
  // Encontra id padrão do Boca no Trombone
  const pubBoca = publicacoes.find((p) => p.nome.toLowerCase().includes('boca no trombone'))
  const [pubSelecionadaId, setPubSelecionadaId] = useState<string>(pubBoca?.id || (publicacoes[0]?.id ?? ''))
  const [dropAberto, setDropAberto] = useState(false)
  const [paginaMobile, setPaginaMobile] = useState(1)
  const [edicaoDestaqueId, setEdicaoDestaqueId] = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
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

  // Publicação atual
  const publicacaoAtual = publicacoes.find((p) => p.id === pubSelecionadaId) || publicacoes[0]
  const tituloPagina = publicacaoAtual ? publicacaoAtual.nome : 'Boca no Trombone'

  // Filtra as edições pela publicação selecionada
  const edicoesFiltradas = useMemo(() => {
    return edicoes.filter((ed) => {
      if (!pubSelecionadaId) return true
      const nomePub = ed.publicacoes_jornal?.nome?.toLowerCase() || ''
      const matchId = ed.publicacoes_jornal?.id === pubSelecionadaId || ed.publicacao_id === pubSelecionadaId
      if (matchId) return true
      if (publicacaoAtual?.nome) {
        return nomePub === publicacaoAtual.nome.toLowerCase()
      }
      return true
    })
  }, [edicoes, pubSelecionadaId, publicacaoAtual])

  // Edição destaque: selecionada manualmente ou a mais recente da lista
  const edicaoDestaque = useMemo(() => {
    if (edicaoDestaqueId) {
      const encontrada = edicoesFiltradas.find((e) => e.id === edicaoDestaqueId)
      if (encontrada) return encontrada
    }
    return edicoesFiltradas[0] || null
  }, [edicoesFiltradas, edicaoDestaqueId])

  // Edições anteriores (todas exceto o destaque)
  const edicoesAnteriores = useMemo(() => {
    if (!edicaoDestaque) return edicoesFiltradas
    return edicoesFiltradas.filter((e) => e.id !== edicaoDestaque.id)
  }, [edicoesFiltradas, edicaoDestaque])

  // Paginação Mobile (20 em 20)
  const totalPaginasMobile = Math.max(1, Math.ceil(edicoesAnteriores.length / ITENS_POR_PAGINA_MOBILE))
  const indiceInicio = (paginaMobile - 1) * ITENS_POR_PAGINA_MOBILE
  const edicoesMobilePagina = edicoesAnteriores.slice(indiceInicio, indiceInicio + ITENS_POR_PAGINA_MOBILE)

  function trocarPublicacao(id: string) {
    setPubSelecionadaId(id)
    setDropAberto(false)
    setPaginaMobile(1)
    setEdicaoDestaqueId(null)
  }

  return (
    <>
      {/* ── FAIXA HERO INSTITUCIONAL: TÍTULO 'BOCA NO TROMBONE' + DROPDOWN (SEM SUBTÍTULO) ── */}
      <section
        style={{
          background: '#faf8f9',
          borderBottom: '1px solid #ebdbe0',
          padding: '22px 0 24px 0',
        }}
      >
        <div style={CONTAINER_STYLE}>
          {/* Breadcrumb navegável (oculto no mobile) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#71636a',
              marginBottom: '14px',
              flexWrap: 'wrap',
            }}
            className="jornais-breadcrumb"
          >
            <Link href="/" style={{ color: '#71636a', textDecoration: 'none' }}>
              Início
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#861e32', fontWeight: 600 }}>{tituloPagina}</span>
          </nav>

          {/* Cabeçalho com Título e Dropdown de outros jornais na mesma linha / bloco */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '38px',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  textTransform: 'uppercase',
                  color: '#30252a',
                  margin: 0,
                  letterSpacing: '0.4px',
                }}
                className="jornais-titulo-h1"
              >
                {tituloPagina}
              </h1>
            </div>

            {/* Dropdown elegante de publicações */}
            {publicacoes.length > 1 && (
              <div style={{ position: 'relative' }} ref={dropRef}>
                <button
                  type="button"
                  onClick={() => setDropAberto(!dropAberto)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#FFFFFF',
                    border: '1.5px solid #cbd7de',
                    borderRadius: '6px',
                    padding: '9px 16px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#30252a',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                  className="btn-dropdown-jornais"
                  aria-expanded={dropAberto}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <span>Outros jornais</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: dropAberto ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      opacity: 0.7,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropAberto && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      background: '#FFFFFF',
                      border: '1px solid #cbd7de',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(48,37,42,0.14)',
                      padding: '6px',
                      minWidth: '240px',
                      zIndex: 30,
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#71636a', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '0.5px' }}>
                      Escolha a publicação:
                    </div>
                    {publicacoes.map((pub) => {
                      const ativo = pub.id === pubSelecionadaId
                      return (
                        <button
                          key={pub.id}
                          type="button"
                          onClick={() => trocarPublicacao(pub.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            background: ativo ? '#F8F2F4' : 'transparent',
                            color: ativo ? '#861e32' : '#30252a',
                            fontWeight: ativo ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                          className="item-drop-jornal"
                        >
                          <span>{pub.nome}</span>
                          {ativo && <span style={{ color: '#861e32' }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main style={{ flex: 1, padding: '32px 0 60px 0' }}>
        <div style={CONTAINER_STYLE}>
          
          {/* 1. DESTAQUE DA EDIÇÃO SELECIONADA OU MAIS RECENTE */}
          {edicaoDestaque ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #ebdbe0',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 18px rgba(48,37,42,0.06)',
                marginBottom: '36px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              }}
              className="jornal-destaque-card"
            >
              {/* Capa com proporção vertical física */}
              <div
                style={{
                  background: '#24141A',
                  padding: '24px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    maxWidth: '220px',
                    width: '100%',
                    aspectRatio: '1 / 1.42',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  {edicaoDestaque.capa_url ? (
                    <img
                      src={edicaoDestaque.capa_url}
                      alt={`Capa ${edicaoDestaque.numero}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#351d27', color: '#fff', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                      {edicaoDestaque.publicacoes_jornal?.nome || tituloPagina} nº {edicaoDestaque.numero}
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da edição */}
              <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e9f3ef',
                    color: '#23634e',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    alignSelf: 'flex-start',
                  }}
                >
                  <span>●</span>
                  <span>Edição em Destaque</span>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#30252a',
                    margin: '0 0 6px 0',
                    lineHeight: 1.15,
                  }}
                  className="jornal-destaque-titulo"
                >
                  {edicaoDestaque.publicacoes_jornal?.nome || tituloPagina} — Edição nº {edicaoDestaque.numero}
                </h2>

                <div style={{ fontSize: '13.5px', color: '#71636a', marginBottom: '18px' }}>
                  Publicação: <strong>{edicaoDestaque.mes_ano || 'Edição Oficial'}</strong>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {edicaoDestaque.pdf_url ? (
                    <>
                      <a
                        href={edicaoDestaque.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          background: '#861e32',
                          color: '#ffffff',
                          padding: '10px 18px',
                          borderRadius: '5px',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <line x1="9" y1="15" x2="12" y2="18" />
                          <line x1="15" y1="15" x2="12" y2="18" />
                        </svg>
                        <span>Baixar PDF</span>
                      </a>

                      <a
                        href={edicaoDestaque.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd7de',
                          color: '#30252a',
                          padding: '10px 16px',
                          borderRadius: '5px',
                          fontSize: '13px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Ver no navegador ↗</span>
                      </a>
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#71636a' }}>PDF em processamento</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '36px', textAlign: 'center', color: '#71636a', marginBottom: '32px' }}>
              Nenhuma edição cadastrada para esta publicação.
            </div>
          )}

          {/* 2. EDIÇÕES ANTERIORES:
                 - NO DESKTOP: Grid visual de capas
                 - NO MOBILE: Lista textual de 20 em 20 com botões Início e Fim */}
          {edicoesAnteriores.length > 0 && (
            <div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '20px', background: '#861e32', display: 'inline-block', borderRadius: '2px' }} />
                <h2
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '22px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#30252a',
                    margin: 0,
                    letterSpacing: '0.4px',
                  }}
                >
                  Edições Anteriores
                </h2>
              </div>

              {/* ── VISUALIZAÇÃO DESKTOP: GRID COM CAPAS ── */}
              <div className="jornais-desktop-grid">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {edicoesAnteriores.map((ed) => {
                    const pubNome = ed.publicacoes_jornal?.nome || tituloPagina
                    return (
                      <div
                        key={ed.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e4dce0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Capa */}
                        <div style={{ aspectRatio: '1 / 1.42', background: '#24141A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                          {ed.capa_url ? (
                            <img src={ed.capa_url} alt={`Capa ${pubNome} nº ${ed.numero}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#ffffff', padding: '16px' }}>
                              <strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>{pubNome}</strong>
                            </div>
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              background: '#861e32',
                              color: '#ffffff',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '3px 7px',
                              borderRadius: '3px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Nº {ed.numero}
                          </span>
                        </div>

                        {/* Dados e Botão */}
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '11.5px', color: '#71636a', marginBottom: '4px' }}>
                              {ed.mes_ano || 'Edição Regular'}
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 6px 0' }}>
                              {pubNome} — Edição nº {ed.numero}
                            </h3>
                          </div>

                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            {ed.pdf_url ? (
                              <a
                                href={ed.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#861e32',
                                  color: '#ffffff',
                                  padding: '8px 14px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  flex: 1,
                                  justifyContent: 'center',
                                }}
                              >
                                Abrir PDF ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#71636a' }}>Sem PDF</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEdicaoDestaqueId(ed.id)
                                window.scrollTo({ top: 120, behavior: 'smooth' })
                              }}
                              style={{
                                background: '#f8f2f4',
                                border: '1px solid #ebdbe0',
                                color: '#861e32',
                                padding: '8px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Destacar esta edição no topo"
                            >
                              Destacar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── VISUALIZAÇÃO MOBILE (ITEM 10): LISTA DE TEXTO COM PAGINAÇÃO 20 EM 20 ── */}
              <div className="jornais-mobile-list">
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #e4dce0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {edicoesMobilePagina.map((ed, index) => {
                    const pubNome = ed.publicacoes_jornal?.nome || tituloPagina
                    const isUltimo = index === edicoesMobilePagina.length - 1

                    return (
                      <div
                        key={ed.id}
                        style={{
                          padding: '12px 14px',
                          borderBottom: isUltimo ? 'none' : '1px solid #f0e8eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                          onClick={() => {
                            setEdicaoDestaqueId(ed.id)
                            window.scrollTo({ top: 60, behavior: 'smooth' })
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                background: '#861e32',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '3px',
                              }}
                            >
                              nº {ed.numero}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#30252a' }}>
                              {ed.mes_ano || 'Edição Regular'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#71636a', marginTop: '2px' }}>
                            {pubNome} • Toque para ver no topo
                          </div>
                        </div>

                        {ed.pdf_url && (
                          <a
                            href={ed.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#F8F2F4',
                              border: '1px solid #ebdbe0',
                              color: '#861e32',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>PDF</span>
                            <span>↗</span>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Controles de Paginação Mobile (Início / Anterior / Próxima / Fim) */}
                {totalPaginasMobile > 1 && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #e4dce0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPaginaMobile(1)}
                        disabled={paginaMobile === 1}
                        style={{
                          background: paginaMobile === 1 ? '#f5f5f5' : '#FFFFFF',
                          color: paginaMobile === 1 ? '#a0a0a0' : '#30252a',
                          border: '1px solid #cbd7de',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: paginaMobile === 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        « Início
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaginaMobile((p) => Math.max(1, p - 1))}
                        disabled={paginaMobile === 1}
                        style={{
                          background: paginaMobile === 1 ? '#f5f5f5' : '#FFFFFF',
                          color: paginaMobile === 1 ? '#a0a0a0' : '#30252a',
                          border: '1px solid #cbd7de',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: paginaMobile === 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ‹
                      </button>
                    </div>

                    <div style={{ fontWeight: 600, color: '#52434a', fontSize: '12px' }}>
                      Pág. {paginaMobile} de {totalPaginasMobile}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPaginaMobile((p) => Math.min(totalPaginasMobile, p + 1))}
                        disabled={paginaMobile === totalPaginasMobile}
                        style={{
                          background: paginaMobile === totalPaginasMobile ? '#f5f5f5' : '#FFFFFF',
                          color: paginaMobile === totalPaginasMobile ? '#a0a0a0' : '#30252a',
                          border: '1px solid #cbd7de',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: paginaMobile === totalPaginasMobile ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaginaMobile(totalPaginasMobile)}
                        disabled={paginaMobile === totalPaginasMobile}
                        style={{
                          background: paginaMobile === totalPaginasMobile ? '#f5f5f5' : '#FFFFFF',
                          color: paginaMobile === totalPaginasMobile ? '#a0a0a0' : '#30252a',
                          border: '1px solid #cbd7de',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: paginaMobile === totalPaginasMobile ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Fim »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`
        .btn-dropdown-jornais:hover {
          border-color: #861e32 !important;
          color: #861e32 !important;
        }
        .item-drop-jornal:hover {
          background: #f8f4f5 !important;
          color: #861e32 !important;
        }
        /* Por padrão desktop */
        .jornais-desktop-grid {
          display: block;
        }
        .jornais-mobile-list {
          display: none;
        }

        /* Regras responsivas no mobile */
        @media (max-width: 680px) {
          .jornais-breadcrumb {
            display: none !important;
          }
          .jornais-titulo-h1 {
            font-size: 28px !important;
          }
          .jornal-destaque-card {
            grid-template-columns: 1fr !important;
            margin-bottom: 24px !important;
          }
          .jornal-destaque-titulo {
            font-size: 22px !important;
          }
          .jornais-desktop-grid {
            display: none !important;
          }
          .jornais-mobile-list {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
