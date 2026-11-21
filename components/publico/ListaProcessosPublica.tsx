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
    <div style={{ marginTop: '16px' }}>
      {/* Faixa de Cidades em Bloco Bordô (Proposta B — sem caixas quadradas soltas) */}
      <div
        role="tablist"
        aria-label="Filtrar processos por cidade"
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

      {/* Campo de Busca */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4DCE0',
          borderRadius: '4px',
          padding: '12px 16px',
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
          placeholder="Pesquisar por fábrica (Johnson, Monsanto, Henkel, Teknia) ou nº do processo…"
          aria-label="Pesquisar processo coletivo"
          style={{
            flex: '1 1 300px',
            padding: '10px 14px',
            border: '1px solid #CBD7DE',
            borderRadius: '3px',
            fontSize: '14.5px',
            background: '#FAF8F9',
            color: '#1A1417',
            outline: 'none',
          }}
        />
        <a
          href="https://pje.trt15.jus.br/consultaprocessual/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#65172A',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '3px',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Consulta PJe TRT-15 ↗
        </a>
      </div>

      {/* Lista agrupada por cidade (sem rótulos redundantes) */}
      {cidades
        .filter((cid) => !cidadeFiltro || cid === cidadeFiltro)
        .map((cid) => {
          const itensCidade = filtrados.filter((p) => p.city === cid)
          if (itensCidade.length === 0) return null
          return (
            <section key={cid} style={{ marginBottom: '34px' }}>
              <div
                style={{
                  borderBottom: '3px solid #65172A',
                  paddingBottom: '6px',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '26px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: '#65172A',
                    margin: 0,
                  }}
                >
                  {cid}
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {itensCidade.map((proc, idx) => {
                  const keyId = proc.id || `${cid}-${proc.company}-${idx}`
                  return (
                    <div
                      key={keyId}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E4DCE0',
                        borderTop: '4px solid #65172A',
                        borderRadius: '4px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: '8px',
                            marginBottom: '6px',
                          }}
                        >
                          <h3
                            style={{
                              fontFamily: 'var(--font-condensed), sans-serif',
                              fontSize: '22px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: '#1A1417',
                              margin: 0,
                              lineHeight: 1.15,
                            }}
                          >
                            {proc.company}
                          </h3>
                          <span
                            style={{
                              fontFamily: 'var(--font-condensed), sans-serif',
                              fontSize: '13px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: '#861E32',
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
                            color: '#65172A',
                            background: '#FAF8F9',
                            padding: '6px 10px',
                            borderRadius: '3px',
                            border: '1px solid #E4DCE0',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <span>Processo n.º {proc.number}</span>
                          <button
                            type="button"
                            onClick={() => copiarNumero(proc.number, keyId)}
                            style={{
                              background: copiadoId === keyId ? '#23634E' : '#FFFFFF',
                              color: copiadoId === keyId ? '#FFFFFF' : '#1A1417',
                              border: '1px solid #CBD7DE',
                              borderRadius: '3px',
                              padding: '2px 8px',
                              fontFamily: 'var(--font-condensed), sans-serif',
                              fontSize: '12px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            {copiadoId === keyId ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>

                        {proc.subject && proc.subject !== 'Ação Coletiva Trabalhista' && (
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#1A1417',
                              marginBottom: '4px',
                            }}
                          >
                            {proc.subject}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: '14px',
                            color: '#4F4248',
                            lineHeight: 1.5,
                          }}
                        >
                          {proc.status}
                        </div>
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
