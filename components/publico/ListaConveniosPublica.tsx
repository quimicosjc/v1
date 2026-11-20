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
    const ordemPreferida = ['São José dos Campos', 'Jacareí', 'Taubaté', 'Caçapava']
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
    <div style={{ marginTop: '28px' }}>
      {/* ── ABAS RÁPIDAS POR CIDADE (IGUAL AO SITE OFICIAL) ── */}
      <div
        role="tablist"
        aria-label="Filtrar convênios por cidade"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={cidadeFiltro === ''}
          onClick={() => setCidadeFiltro('')}
          style={{
            background: cidadeFiltro === '' ? '#861e32' : '#ffffff',
            color: cidadeFiltro === '' ? '#ffffff' : '#30252a',
            border: cidadeFiltro === '' ? '1px solid #861e32' : '1px solid #cbd7de',
            borderRadius: '6px',
            padding: '9px 16px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
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
                background: ativo ? '#861e32' : '#ffffff',
                color: ativo ? '#ffffff' : '#30252a',
                border: ativo ? '1px solid #861e32' : '1px solid #cbd7de',
                borderRadius: '6px',
                padding: '9px 16px',
                fontSize: '13.5px',
                fontWeight: ativo ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cid} ({count})
            </button>
          )
        })}
      </div>

      {/* ── BARRA DE PESQUISA E FILTRO DE CATEGORIA ── */}
      <div
        style={{
          background: '#faf8f9',
          border: '1px solid #ebdbe0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '26px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Busca textual */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por escola, faculdade, dentista, farmácia, ótica…"
              aria-label="Buscar convênios por nome ou benefício"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: '1px solid #cbd7de',
                borderRadius: '6px',
                fontSize: '14.5px',
                boxSizing: 'border-box',
                outline: 'none',
                background: '#ffffff',
                color: '#1a1417',
              }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71636a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '12px',
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
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar campo de busca"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#71636a',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              aria-label="Filtrar por categoria"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd7de',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#30252a',
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
          </div>
        </div>

        {/* Resumo da busca e botão limpar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #ebdbe0',
            fontSize: '13px',
            color: '#71636a',
          }}
        >
          <span>
            Exibindo <strong>{filtrados.length}</strong> de {conveniosAtivos.length} convênios credenciados
          </span>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#861e32',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
              }}
            >
              <span>✕ Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ── GRADE DE CONVÊNIOS ── */}
      {filtrados.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd7de',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#71636a',
          }}
        >
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#30252a', margin: '0 0 8px 0' }}>
            Nenhum convênio encontrado
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
            Não encontramos parceiros com os termos ou filtros selecionados. Limpe os filtros para ver toda a rede credenciada.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            style={{
              background: '#861e32',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver todos os convênios
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
            gap: '18px',
          }}
        >
          {filtrados.map((c, idx) => (
            <div
              key={c.id || `${c.name}-${idx}`}
              style={{
                background: '#ffffff',
                border: '1px solid #e4dce0',
                borderTop: '4px solid #861e32',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#861e32',
                      background: '#f8f2f4',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.kind}
                  </span>
                  <span style={{ fontSize: '12px', color: '#52434a', fontWeight: 700 }}>
                    📍 {c.city}
                  </span>
                </div>

                <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#30252a', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {c.name}
                </h3>

                {c.description && (
                  <p style={{ fontSize: '13.5px', color: '#52434a', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    {c.description}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f0e8ea', paddingTop: '12px', fontSize: '13px', color: '#4a3f45', display: 'grid', gap: '7px' }}>
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <a
                      href={`tel:${c.phone.split('/')[0].replace(/[^\d+]/g, '')}`}
                      style={{ color: '#861e32', fontWeight: 700, textDecoration: 'none' }}
                    >
                      {c.phone}
                    </a>
                  </div>
                )}

                {c.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${c.name} ${c.address} ${c.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#30252a', textDecoration: 'underline', lineHeight: 1.4 }}
                    >
                      {c.address} <span style={{ fontSize: '11px', color: '#861e32', fontWeight: 600 }}>(Mapa ↗)</span>
                    </a>
                  </div>
                )}

                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <a href={`mailto:${c.email}`} style={{ color: '#861e32', textDecoration: 'underline', wordBreak: 'break-all' }}>
                      {c.email}
                    </a>
                  </div>
                )}

                {c.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <a
                      href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#861e32', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                    </a>
                  </div>
                )}

                <div style={{ fontSize: '11.5px', color: '#825914', background: '#fff9ea', border: '1px solid #f3d489', padding: '5px 8px', borderRadius: '4px', marginTop: '4px' }}>
                  Apresente a carteirinha do Sindicato e documento com foto.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
