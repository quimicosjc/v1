'use client'

import React, { useState, useMemo } from 'react'

export interface ConvenioPublicoItem {
  id?: string
  name: string
  kind: string
  city: string
  description?: string
  phone?: string
  address?: string
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
    const setCidades = new Set(conveniosAtivos.map((c) => c.city).filter(Boolean))
    return Array.from(setCidades).sort()
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
        if (!noNome && !naDesc && !noEnd) return false
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
    <div style={{ marginTop: '32px' }}>
      {/* ── BARRA DE PESQUISA E FILTROS COMBINÁVEIS (L03) ── */}
      <div
        style={{
          background: '#faf8f9',
          border: '1px solid #ebdbe0',
          borderRadius: '8px',
          padding: '18px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Busca textual */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por parceiro, clínica, escola…"
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

          {/* Filtro por Cidade */}
          <div>
            <select
              value={cidadeFiltro}
              onChange={(e) => setCidadeFiltro(e.target.value)}
              aria-label="Filtrar por cidade"
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
              <option value="">Todas as Cidades ({cidades.length})</option>
              {cidades.map((cid) => (
                <option key={cid} value={cid}>
                  {cid}
                </option>
              ))}
            </select>
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
            Exibindo <strong>{filtrados.length}</strong> de {conveniosAtivos.length} convênios disponíveis
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
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#30252a', margin: '0 0 8px 0' }}>
            Nenhum convênio encontrado
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
            Não encontramos parceiros com os termos ou filtros selecionados. Tente usar outras palavras-chave ou limpe os filtros para ver toda a rede credenciada.
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px',
          }}
        >
          {filtrados.map((c, idx) => (
            <div
              key={c.id || `${c.name}-${idx}`}
              style={{
                background: '#ffffff',
                border: '1px solid #e4dce0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#861e32',
                      background: '#f8f2f4',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.kind}
                  </span>
                  <span style={{ fontSize: '12px', color: '#71636a', fontWeight: 500 }}>
                    📍 {c.city}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {c.name}
                </h3>

                {c.description && (
                  <p style={{ fontSize: '13.5px', color: '#52434a', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    {c.description}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f0e8ea', paddingTop: '12px', fontSize: '12.5px', color: '#71636a', display: 'grid', gap: '6px' }}>
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <a
                      href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}
                      style={{ color: '#861e32', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {c.phone}
                    </a>
                  </div>
                )}

                {c.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${c.name} ${c.address} ${c.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#52434a', textDecoration: 'underline' }}
                    >
                      {c.address}
                    </a>
                  </div>
                )}

                <div style={{ fontSize: '11px', color: '#825914', background: '#fff2df', padding: '3px 6px', borderRadius: '4px', marginTop: '4px' }}>
                  Apresentar carteirinha de associado e documento com foto.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
