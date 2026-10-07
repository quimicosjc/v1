'use client'

import React, { useState, useEffect, useCallback } from 'react'

export interface FotoItem {
  url: string
  foco?: number
  legenda?: string
  credito?: string
}

interface CarrosselNoticiaProps {
  fotos: FotoItem[]
  titulo: string
}

export default function CarrosselNoticia({ fotos, titulo }: CarrosselNoticiaProps) {
  const [indice, setIndice] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)

  const total = fotos.length
  if (total === 0) return null

  const fotoAtual = fotos[indice] || fotos[0]
  const focoY = fotoAtual.foco ?? 50

  const proxima = useCallback(() => {
    setIndice((prev) => (prev + 1) % total)
  }, [total])

  const anterior = useCallback(() => {
    setIndice((prev) => (prev - 1 + total) % total)
  }, [total])

  // Navegação por teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (modalAberto) {
        if (e.key === 'Escape') setModalAberto(false)
        if (e.key === 'ArrowRight') proxima()
        if (e.key === 'ArrowLeft') anterior()
        return
      }
      if (total > 1) {
        if (e.key === 'ArrowRight') proxima()
        if (e.key === 'ArrowLeft') anterior()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalAberto, proxima, anterior, total])

  return (
    <figure style={{ margin: '0 0 32px 0' }}>
      {/* ── CONTAINER PRINCIPAL 3:2 COM FOCO EDITORIAL ── */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 2',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f5f0f2',
          border: '1px solid #e4dce0',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(48,37,42,0.04)',
        }}
      >
        <img
          src={fotoAtual.url}
          alt={fotoAtual.legenda || `${titulo} - Foto ${indice + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `50% ${focoY}%`,
            display: 'block',
            transition: 'opacity 0.2s ease',
          }}
        />

        {/* Botão para ampliar e ver foto original sem cortes */}
        <button
          onClick={() => setModalAberto(true)}
          title="Ver foto completa em tamanho original"
          aria-label="Ver foto completa em tamanho original"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(48, 37, 42, 0.75)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          <span>Ver foto completa</span>
        </button>

        {/* Setas flutuantes sobre a imagem se houver mais de uma foto */}
        {total > 1 && (
          <>
            <button
              onClick={anterior}
              title="Foto anterior"
              aria-label="Foto anterior"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(48, 37, 42, 0.7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={proxima}
              title="Próxima foto"
              aria-label="Próxima foto"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(48, 37, 42, 0.7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── BARRA DE CONTROLES DO CARROSSEL (DOCUMENTO MESTRE § 3.4) ── */}
      {total > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#f8fafb',
            border: '1px solid #e4dce0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            marginTop: '-4px',
          }}
        >
          <button
            onClick={anterior}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#30252a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Anterior
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#65172a' }}>
              Foto {indice + 1} de {total}
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {fotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndice(i)}
                  title={`Ir para foto ${i + 1}`}
                  aria-label={`Ir para foto ${i + 1}`}
                  style={{
                    width: i === indice ? '18px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === indice ? '#861e32' : '#cbd7de',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={proxima}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#30252a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* ── LEGENDA E CRÉDITO ── */}
      {(fotoAtual.legenda || fotoAtual.credito) && (
        <figcaption
          style={{
            fontSize: '12.5px',
            color: '#71636a',
            marginTop: '8px',
            lineHeight: 1.4,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px',
            fontStyle: 'italic',
            paddingLeft: '4px',
          }}
        >
          {fotoAtual.legenda && <span>{fotoAtual.legenda}</span>}
          {fotoAtual.credito && <span>Foto: {fotoAtual.credito}</span>}
        </figcaption>
      )}

      {/* ── MODAL DE ZOOM / FOTO COMPLETA (SEM RECORTE) ── */}
      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalAberto(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 14, 17, 0.92)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Barra superior do modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1100px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              color: '#ffffff',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {titulo} {total > 1 ? `(${indice + 1} de ${total})` : ''}
            </div>
            <button
              onClick={() => setModalAberto(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fechar ✕
            </button>
          </div>

          {/* Imagem em tamanho completo com orientação preservada */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '82vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <img
              src={fotoAtual.url}
              alt={fotoAtual.legenda || titulo}
              style={{
                maxWidth: '92vw',
                maxHeight: '82vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '6px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />

            {/* Setas dentro do modal */}
            {total > 1 && (
              <>
                <button
                  onClick={anterior}
                  aria-label="Foto anterior"
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#861e32',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  onClick={proxima}
                  aria-label="Próxima foto"
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#861e32',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {(fotoAtual.legenda || fotoAtual.credito) && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                color: '#e4dce0',
                fontSize: '13px',
                marginTop: '12px',
                textAlign: 'center',
                maxWidth: '800px',
              }}
            >
              {fotoAtual.legenda} {fotoAtual.credito ? `(Foto: ${fotoAtual.credito})` : ''}
            </div>
          )}
        </div>
      )}
    </figure>
  )
}
