'use client'

import React, { useState, useMemo } from 'react'

export interface ConvenioPublicoItem {
  id?: string
  name: string
  kind: string
  city: string
  description?: string
  phone?: string
  whatsapp?: string
  address?: string
  email?: string
  website?: string
  active?: boolean
  order?: number
}

interface ListaConveniosPublicaProps {
  conveniosIniciais: ConvenioPublicoItem[]
}

function normalizar(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function ListaConveniosPublica({ conveniosIniciais }: ListaConveniosPublicaProps) {
  const [busca, setBusca] = useState('')
  const [cidadeFiltro, setCidadeFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const conveniosAtivos = useMemo(() => {
    return conveniosIniciais.filter((c) => c.active !== false)
  }, [conveniosIniciais])

  const cidades = useMemo(() => {
    const ordemPreferida = ['Caçapava', 'Jacareí', 'Taubaté', 'São José dos Campos']
    const setCidades = new Set(conveniosAtivos.map((c) => c.city).filter(Boolean))
    return Array.from(setCidades).sort((a, b) => {
      const ia = ordemPreferida.indexOf(a)
      const ib = ordemPreferida.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b)
    })
  }, [conveniosAtivos])

  const categorias = useMemo(() => {
    const setCats = new Set(conveniosAtivos.map((c) => c.kind).filter(Boolean))
    return Array.from(setCats).sort()
  }, [conveniosAtivos])

  const filtrados = useMemo(() => {
    return conveniosAtivos.filter((c) => {
      if (cidadeFiltro && c.city !== cidadeFiltro) return false
      if (categoriaFiltro && c.kind !== categoriaFiltro) return false

      if (busca.trim()) {
        const termo = normalizar(busca)
        const noNome = normalizar(c.name).includes(termo)
        const naDesc = c.description ? normalizar(c.description).includes(termo) : false
        const noEnd = c.address ? normalizar(c.address).includes(termo) : false
        const naCat = c.kind ? normalizar(c.kind).includes(termo) : false
        if (!noNome && !naDesc && !noEnd && !naCat) return false
      }

      return true
    })
  }, [conveniosAtivos, busca, cidadeFiltro, categoriaFiltro])

  function limparFiltros() {
    setBusca('')
    setCidadeFiltro('')
    setCategoriaFiltro('')
  }

  const temFiltroAtivo = busca.trim() !== '' || cidadeFiltro !== '' || categoriaFiltro !== ''

  return (
    <div style={{ marginTop: '8px' }}>
      {/* ── FAIXA DE CIDADES EM BLOCO BORDÔ (PROPOSTA B — SEM SELETORES QUADRADOS DE IA) ── */}
      <div
        role="tablist"
        aria-label="Filtrar convênios por cidade"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          background: '#65172A',
          borderBottom: '3px solid #861E32',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={cidadeFiltro === ''}
          onClick={() => setCidadeFiltro('')}
          style={{
            background: cidadeFiltro === '' ? '#861E32' : 'transparent',
            color: cidadeFiltro === '' ? '#FFFFFF' : '#F6E7EC',
            border: 'none',
            borderBottom: cidadeFiltro === '' ? '3px solid #FFB8C5' : '3px solid transparent',
            padding: '11px 18px',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontSize: '16.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            cursor: 'pointer',
          }}
        >
          Todos ({conveniosAtivos.length})
        </button>
        {cidades.map((cid) => {
          const count = conveniosAtivos.filter((c) => c.city === cid).length
          const ativo = cidadeFiltro === cid
          return (
            <button
              key={cid}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setCidadeFiltro(ativo ? '' : cid)}
              style={{
                background: ativo ? '#861E32' : 'transparent',
                color: ativo ? '#FFFFFF' : '#F6E7EC',
                border: 'none',
                borderBottom: ativo ? '3px solid #FFB8C5' : '3px solid transparent',
                padding: '11px 18px',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontSize: '16.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                cursor: 'pointer',
              }}
            >
              {cid} ({count})
            </button>
          )
        })}
      </div>

      {/* ── BUSCA E FILTRO DE CATEGORIA ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4DCE0',
          borderRadius: '4px',
          padding: '14px 16px',
          marginBottom: '22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar escola, faculdade, dentista, farmácia, ótica…"
          aria-label="Pesquisar convênios"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #CBD7DE',
            borderRadius: '3px',
            fontSize: '14.5px',
            outline: 'none',
            background: '#FAF8F9',
            color: '#1A1417',
          }}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          aria-label="Filtrar por categoria"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #CBD7DE',
            borderRadius: '3px',
            fontSize: '14.5px',
            background: '#FAF8F9',
            color: '#1A1417',
            outline: 'none',
          }}
        >
          <option value="">Todas as Categorias ({categorias.length})</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {temFiltroAtivo && (
          <button
            type="button"
            onClick={limparFiltros}
            style={{
              background: '#861E32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '3px',
              padding: '10px 16px',
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              justifySelf: 'start',
            }}
          >
            Limpar filtros ✕
          </button>
        )}
      </div>

      {/* ── GRADE DE CONVÊNIOS (SEM REDUNDÂNCIAS REPETIDAS EM CADA CARD) ── */}
      {filtrados.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E4DCE0',
            borderRadius: '4px',
            padding: '40px 24px',
            textAlign: 'center',
            color: '#71636A',
          }}
        >
          <p style={{ fontSize: '15px', margin: '0 0 14px 0' }}>
            Nenhum convênio encontrado para o filtro selecionado.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            style={{
              background: '#861E32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '3px',
              padding: '9px 18px',
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Ver todos
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
            gap: '16px',
          }}
        >
          {filtrados.map((c, idx) => (
            <div
              key={c.id || `${c.name}-${idx}`}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E4DCE0',
                borderTop: '4px solid #65172A',
                borderRadius: '4px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '6px',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#861E32',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                    }}
                  >
                    {c.kind}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '13.5px',
                      color: '#4F4248',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.city}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '21px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#1A1417',
                    margin: '0 0 8px 0',
                    lineHeight: 1.15,
                  }}
                >
                  {c.name}
                </h3>

                {c.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#30252A',
                      margin: '0 0 12px 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {c.description}
                  </p>
                )}
              </div>

              {(c.phone || c.address || c.email || c.website) && (
                <div
                  style={{
                    borderTop: '1px solid #EFE9EC',
                    paddingTop: '10px',
                    fontSize: '13px',
                    color: '#4F4248',
                    display: 'grid',
                    gap: '5px',
                  }}
                >
                  {c.phone && (
                    <div>
                      <a
                        href={`tel:${c.phone.split('/')[0].replace(/[^\d+]/g, '')}`}
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '16px',
                          color: '#65172A',
                          fontWeight: 800,
                          textDecoration: 'none',
                        }}
                      >
                        {c.phone}
                      </a>
                    </div>
                  )}

                  {c.address && (
                    <div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${c.name} ${c.address} ${c.city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#30252A', textDecoration: 'underline', lineHeight: 1.4 }}
                      >
                        {c.address}
                      </a>
                    </div>
                  )}

                  {c.email && (
                    <div>
                      <a
                        href={`mailto:${c.email}`}
                        style={{ color: '#861E32', textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {c.email}
                      </a>
                    </div>
                  )}

                  {c.website && (
                    <div>
                      <a
                        href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#861E32',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          wordBreak: 'break-all',
                        }}
                      >
                        {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
