'use client'

import React, { useState, useMemo } from 'react'

export interface ProcessoColetivoItem {
  id?: string
  city: string
  company: string
  number: string
  court: string
  subject: string
  status: string
  active?: boolean
}

interface ListaProcessosPublicaProps {
  processosIniciais: ProcessoColetivoItem[]
}

function normalizar(txt: string): string {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function ListaProcessosPublica({ processosIniciais }: ListaProcessosPublicaProps) {
  const [cidadeFiltro, setCidadeFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  const ativos = useMemo(() => {
    return processosIniciais.filter((p) => p.active !== false)
  }, [processosIniciais])

  const cidades = useMemo(() => {
    const ordem = ['Jacareí', 'Taubaté', 'Caçapava', 'São José dos Campos']
    const setCidades = new Set(ativos.map((p) => p.city).filter(Boolean))
    return Array.from(setCidades).sort((a, b) => {
      const ia = ordem.indexOf(a)
      const ib = ordem.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      return a.localeCompare(b)
    })
  }, [ativos])

  const filtrados = useMemo(() => {
    return ativos.filter((p) => {
      if (cidadeFiltro && p.city !== cidadeFiltro) return false
      if (busca.trim()) {
        const termo = normalizar(busca)
        const texto = normalizar(`${p.company} ${p.number} ${p.court} ${p.subject} ${p.status} ${p.city}`)
        if (!texto.includes(termo)) return false
      }
      return true
    })
  }, [ativos, cidadeFiltro, busca])

  function copiarNumero(num: string, id: string) {
    navigator.clipboard.writeText(num)
    setCopiadoId(id)
    setTimeout(() => setCopiadoId(null), 2500)
  }

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Abas por Cidade */}
      <div
        role="tablist"
        aria-label="Filtrar processos por cidade"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}
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
          }}
        >
          Todas as Cidades ({ativos.length})
        </button>
        {cidades.map((cid) => {
          const count = ativos.filter((p) => p.city === cid).length
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
              }}
            >
              {cid} ({count})
            </button>
          )
        })}
      </div>

      {/* Campo de Busca */}
      <div
        style={{
          background: '#faf8f9',
          border: '1px solid #ebdbe0',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por fábrica (ex: Johnson, Monsanto, Henkel, Teknia) ou número do processo…"
          aria-label="Buscar processo coletivo"
          style={{
            flex: '1 1 300px',
            padding: '10px 14px',
            border: '1px solid #cbd7de',
            borderRadius: '6px',
            fontSize: '14.5px',
            background: '#ffffff',
            color: '#1a1417',
            outline: 'none',
          }}
        />
        <a
          href="https://pje.trt15.jus.br/consultaprocessual/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#1B2E4B',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Consultar no Portal TRT-15 ↗</span>
        </a>
      </div>

      {/* Lista agrupada por cidade */}
      {cidades
        .filter((cid) => !cidadeFiltro || cid === cidadeFiltro)
        .map((cid) => {
          const itensCidade = filtrados.filter((p) => p.city === cid)
          if (itensCidade.length === 0) return null
          return (
            <section key={cid} style={{ marginBottom: '36px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '2px solid #861e32',
                  paddingBottom: '8px',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#861e32', margin: 0 }}>
                  {cid}
                </h2>
                <span
                  style={{
                    background: '#f8e9ec',
                    color: '#861e32',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {itensCidade.length} {itensCidade.length === 1 ? 'processo' : 'processos'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {itensCidade.map((proc, idx) => {
                  const keyId = proc.id || `${cid}-${proc.company}-${idx}`
                  const isCaixaFederal = proc.number.includes('.4.03.')
                  const consultaUrl = isCaixaFederal
                    ? 'https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam'
                    : 'https://pje.trt15.jus.br/consultaprocessual/'

                  return (
                    <div
                      key={keyId}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e4dce0',
                        borderLeft: '4px solid #861e32',
                        borderRadius: '8px',
                        padding: '18px 20px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#30252a', margin: 0, lineHeight: 1.3 }}>
                            {proc.company}
                          </h3>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#f0f4f8',
                              color: '#1B2E4B',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {proc.court}
                          </span>
                        </div>

                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#861e32',
                            background: '#faf6f7',
                            padding: '6px 10px',
                            borderRadius: '5px',
                            border: '1px solid #ebdbe0',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>Processo nº {proc.number}</span>
                          <button
                            type="button"
                            onClick={() => copiarNumero(proc.number, keyId)}
                            style={{
                              background: copiadoId === keyId ? '#23634e' : '#ffffff',
                              color: copiadoId === keyId ? '#ffffff' : '#30252a',
                              border: '1px solid #cbd7de',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontFamily: 'sans-serif',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {copiadoId === keyId ? '✓ Copiado' : 'Copiar nº'}
                          </button>
                        </div>

                        {proc.subject && (
                          <div style={{ fontSize: '13.5px', color: '#30252a', marginBottom: '6px' }}>
                            <strong>Objeto:</strong> {proc.subject}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: '13.5px',
                            color: '#1a3a2a',
                            background: '#eef7f2',
                            border: '1px solid #bce0cc',
                            borderRadius: '6px',
                            padding: '9px 12px',
                            lineHeight: 1.45,
                          }}
                        >
                          <strong>Andamento / Situação:</strong> {proc.status}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f0e8ea', fontSize: '12px' }}>
                        <span style={{ color: '#71636a' }}>Dúvidas: (12) 3921-8177</span>
                        <a
                          href={consultaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#861e32', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          Consultar no Tribunal ↗
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
    </div>
  )
}
