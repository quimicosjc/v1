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
    <div style={{ marginTop: '28px' }}>
      {/* Filtros por Unidade */}
      <div
        role="tablist"
        aria-label="Filtrar fotos da colônia por unidade"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={unidadeFiltro === ''}
          onClick={() => {
            setUnidadeFiltro('')
            setLightboxIdx(null)
          }}
          style={{
            background: unidadeFiltro === '' ? '#861e32' : '#ffffff',
            color: unidadeFiltro === '' ? '#ffffff' : '#30252a',
            border: unidadeFiltro === '' ? '1px solid #861e32' : '1px solid #cbd7de',
            borderRadius: '6px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Todas as Fotos ({fotos.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={unidadeFiltro === 'Caraguatatuba'}
          onClick={() => {
            setUnidadeFiltro('Caraguatatuba')
            setLightboxIdx(null)
          }}
          style={{
            background: unidadeFiltro === 'Caraguatatuba' ? '#861e32' : '#ffffff',
            color: unidadeFiltro === 'Caraguatatuba' ? '#ffffff' : '#30252a',
            border: unidadeFiltro === 'Caraguatatuba' ? '1px solid #861e32' : '1px solid #cbd7de',
            borderRadius: '6px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fotos Caraguá ({fotosCaragua.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={unidadeFiltro === 'São Sebastião'}
          onClick={() => {
            setUnidadeFiltro('São Sebastião')
            setLightboxIdx(null)
          }}
          style={{
            background: unidadeFiltro === 'São Sebastião' ? '#861e32' : '#ffffff',
            color: unidadeFiltro === 'São Sebastião' ? '#ffffff' : '#30252a',
            border: unidadeFiltro === 'São Sebastião' ? '1px solid #861e32' : '1px solid #cbd7de',
            borderRadius: '6px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fotos São Sebastião ({fotosSaoSebastiao.length})
        </button>
      </div>

      {/* Grade de Fotos por Unidade */}
      {['Caraguatatuba', 'São Sebastião']
        .filter((u) => !unidadeFiltro || u === unidadeFiltro)
        .map((unidade) => {
          const lista = fotosVisiveis.filter((f) => f.unidade === unidade)
          if (lista.length === 0) return null

          return (
            <section key={unidade} style={{ marginBottom: '40px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #861e32',
                  marginBottom: '18px',
                }}
              >
                <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#861e32', margin: 0 }}>
                  Fotos ({unidade === 'Caraguatatuba' ? 'Caraguá' : 'São Sebastião'})
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    background: '#f8e9ec',
                    color: '#861e32',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                >
                  {lista.length} fotos
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '16px',
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setLightboxIdx(globalIdx)
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e4dce0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '200px',
                          background: '#f4f6f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.titulo || `Colônia de Férias ${unidade}`}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#30252a' }}>
                          {item.titulo || `${unidade} #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#861e32', fontWeight: 600 }}>
                          Ampliar ⤢
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

      {/* Lightbox Modal */}
      {fotoAtiva && lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 20, 28, 0.92)',
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
              background: '#ffffff',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                borderBottom: '1px solid #e4dce0',
                background: '#faf8f9',
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: '#30252a' }}>
                  {fotoAtiva.titulo || `Colônia de Férias - ${fotoAtiva.unidade}`}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#71636a', marginLeft: '10px' }}>
                  ({lightboxIdx + 1} de {fotosVisiveis.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                style={{
                  background: '#861e32',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Fechar ✕
              </button>
            </div>

            <div
              style={{
                background: '#11161d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '72vh',
                minHeight: '320px',
                position: 'relative',
              }}
            >
              <img
                src={fotoAtiva.url}
                alt={fotoAtiva.titulo || fotoAtiva.unidade}
                style={{
                  maxWidth: '100%',
                  maxHeight: '72vh',
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
                padding: '12px 18px',
                background: '#ffffff',
                borderTop: '1px solid #e4dce0',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + fotosVisiveis.length) % fotosVisiveis.length)
                }
                style={{
                  background: '#f8fafb',
                  border: '1px solid #cbd7de',
                  borderRadius: '5px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#30252a',
                  cursor: 'pointer',
                }}
              >
                ← Foto Anterior
              </button>

              <span style={{ fontSize: '13px', color: '#52434a', fontWeight: 600 }}>
                Unidade {fotoAtiva.unidade}
              </span>

              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % fotosVisiveis.length)}
                style={{
                  background: '#f8fafb',
                  border: '1px solid #cbd7de',
                  borderRadius: '5px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#30252a',
                  cursor: 'pointer',
                }}
              >
                Próxima Foto →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
