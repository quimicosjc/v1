'use client'

import React, { useState, useMemo } from 'react'

export interface FotoColoniaItem {
  id?: string
  unidade: string
  url: string
  titulo?: string
  legenda?: string
}

interface GaleriaColoniaPublicaProps {
  fotos: FotoColoniaItem[]
}

export default function GaleriaColoniaPublica({ fotos }: GaleriaColoniaPublicaProps) {
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const fotosCaragua = useMemo(
    () => fotos.filter((f) => f.unidade.toLowerCase().includes('caragua')),
    [fotos]
  )
  const fotosSaoSebastiao = useMemo(
    () => fotos.filter((f) => f.unidade.toLowerCase().includes('sebasti')),
    [fotos]
  )

  const fotosVisiveis = useMemo(() => {
    if (!unidadeFiltro) return fotos
    return fotos.filter((f) => f.unidade === unidadeFiltro)
  }, [fotos, unidadeFiltro])

  const fotoAtiva = lightboxIdx !== null ? fotosVisiveis[lightboxIdx] : null

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Faixa integrada de filtro por unidade — Proposta B (sem caixas quadradas soltas) */}
      <div
        role="tablist"
        aria-label="Filtrar por unidade"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          background: '#65172A',
          borderBottom: '3px solid #861E32',
          marginBottom: '28px',
        }}
      >
        {[
          { id: '', label: `Todas as Fotos (${fotos.length})` },
          { id: 'Caraguatatuba', label: `Caraguá (${fotosCaragua.length})` },
          { id: 'São Sebastião', label: `São Sebastião (${fotosSaoSebastiao.length})` },
        ].map((tab) => {
          const ativo = unidadeFiltro === tab.id
          return (
            <button
              key={tab.id || 'todas'}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => {
                setUnidadeFiltro(tab.id)
                setLightboxIdx(null)
              }}
              style={{
                background: ativo ? '#861E32' : 'transparent',
                color: ativo ? '#FFFFFF' : '#F6E7EC',
                border: 'none',
                borderBottom: ativo ? '3px solid #FFB8C5' : '3px solid transparent',
                padding: '11px 20px',
                fontFamily: 'var(--font-condensed), sans-serif',
                fontSize: '16.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Grade limpa de fotos por unidade (sem legendas óbvias ou redundantes embaixo de cada foto) */}
      {['Caraguatatuba', 'São Sebastião']
        .filter((u) => !unidadeFiltro || u === unidadeFiltro)
        .map((unidade) => {
          const lista = fotosVisiveis.filter((f) => f.unidade === unidade)
          if (lista.length === 0) return null

          return (
            <section key={unidade} style={{ marginBottom: '36px' }}>
              <div
                style={{
                  paddingBottom: '6px',
                  borderBottom: '3px solid #65172A',
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
                  {unidade === 'Caraguatatuba' ? 'Caraguá' : 'São Sebastião'}
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '14px',
                }}
              >
                {lista.map((item, idx) => {
                  const globalIdx = fotosVisiveis.indexOf(item)
                  return (
                    <div
                      key={item.id || item.url || idx}
                      onClick={() => setLightboxIdx(globalIdx)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ampliar imagem ${idx + 1} de ${unidade}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setLightboxIdx(globalIdx)
                      }}
                      className="foto-colonia-card"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E4DCE0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        height: '205px',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={`${unidade} ${idx + 1}`}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.25s ease',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

      {/* Lightbox */}
      {fotoAtiva && lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 12, 14, 0.92)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '960px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 18px',
                background: '#65172A',
                color: '#FFFFFF',
              }}
            >
              <strong
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '18px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {fotoAtiva.unidade === 'Caraguatatuba' ? 'Caraguá' : 'São Sebastião'} ({lightboxIdx + 1}/
                {fotosVisiveis.length})
              </strong>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                style={{
                  background: '#861E32',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '6px 14px',
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Fechar ✕
              </button>
            </div>

            <div
              style={{
                background: '#110E10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '74vh',
                minHeight: '320px',
              }}
            >
              <img
                src={fotoAtiva.url}
                alt={fotoAtiva.unidade}
                style={{
                  maxWidth: '100%',
                  maxHeight: '74vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 18px',
                background: '#FAF8F9',
                borderTop: '1px solid #E4DCE0',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + fotosVisiveis.length) % fotosVisiveis.length)
                }
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD7DE',
                  borderRadius: '3px',
                  padding: '7px 16px',
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#1A1417',
                  cursor: 'pointer',
                }}
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % fotosVisiveis.length)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD7DE',
                  borderRadius: '3px',
                  padding: '7px 16px',
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#1A1417',
                  cursor: 'pointer',
                }}
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .foto-colonia-card:hover img {
          transform: scale(1.03);
        }
      `}</style>
    </div>
  )
}
