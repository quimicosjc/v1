'use client'

import React, { useState, useEffect } from 'react'
import { CORES } from '@/lib/design'

export interface BannerItemData {
  id: string
  imagem: string
  imagem_mobile?: string | null
  link?: string | null
  titulo?: string | null
  ativo?: boolean
}

interface BannerRotativoProps {
  banners: BannerItemData[]
}

const DURACAO_BANNER_MS = 6000
const TICK_MS = 100

export default function BannerRotativo({ banners }: BannerRotativoProps) {
  const listaAtivos = banners.filter((b) => b.ativo !== false && b.imagem)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [tempoRestanteMs, setTempoRestanteMs] = useState(DURACAO_BANNER_MS)

  const total = listaAtivos.length

  useEffect(() => {
    if (total <= 1 || pausado) return

    const interval = setInterval(() => {
      setTempoRestanteMs((prev) => {
        if (prev <= TICK_MS) {
          setIndiceAtual((curr) => (curr + 1) % total)
          return DURACAO_BANNER_MS
        }
        return prev - TICK_MS
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [total, pausado])

  if (total === 0) return null

  function anterior() {
    setIndiceAtual((prev) => (prev - 1 + total) % total)
    setTempoRestanteMs(DURACAO_BANNER_MS)
  }

  function proximo() {
    setIndiceAtual((prev) => (prev + 1) % total)
    setTempoRestanteMs(DURACAO_BANNER_MS)
  }

  function irPara(idx: number) {
    setIndiceAtual(idx)
    setTempoRestanteMs(DURACAO_BANNER_MS)
  }

  const segundosRestantes = Math.max(1, Math.ceil(tempoRestanteMs / 1000))
  const progressoPercentual = Math.min(100, Math.max(0, ((DURACAO_BANNER_MS - tempoRestanteMs) / DURACAO_BANNER_MS) * 100))

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      className="banner-rotativo-wrapper"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#1A0E13',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        className="banner-rotativo-frame"
      >
        {/* Renderização em camadas com transição suave fade (opacity) */}
        {listaAtivos.map((banner, i) => {
          const ativo = i === indiceAtual
          const BannerContent = (
            <picture style={{ width: '100%', height: '100%', display: 'block' }}>
              {banner.imagem_mobile && (
                <source media="(max-width: 640px)" srcSet={banner.imagem_mobile} />
              )}
              <img
                src={banner.imagem}
                alt={banner.titulo || 'Banner institucional'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                className="banner-rotativo-img"
              />
            </picture>
          )

          return (
            <div
              key={banner.id}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: ativo ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
                pointerEvents: ativo ? 'auto' : 'none',
                zIndex: ativo ? 2 : 1,
              }}
            >
              {banner.link ? (
                <a
                  href={banner.link}
                  target={banner.link.startsWith('http') ? '_blank' : '_self'}
                  rel={banner.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}
                  tabIndex={ativo ? 0 : -1}
                >
                  {BannerContent}
                </a>
              ) : (
                BannerContent
              )}
            </div>
          )
        })}
      </div>

      {/* Controles, timer e indicadores (apenas quando total > 1) */}
      {total > 1 && (
        <>
          {/* Mostrador com Timer elegante no canto superior direito */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 4,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              fontFamily: 'monospace',
            }}
            title={pausado ? 'Rotação pausada com o cursor' : `Próximo banner em ${segundosRestantes}s`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{pausado ? 'Pausa' : `${segundosRestantes}s`}</span>
          </div>

          {/* Seta Esquerda */}
          <button
            type="button"
            onClick={anterior}
            aria-label="Banner anterior"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              zIndex: 4,
            }}
            className="banner-nav-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Seta Direita */}
          <button
            type="button"
            onClick={proximo}
            aria-label="Próximo banner"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              zIndex: 4,
            }}
            className="banner-nav-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Indicadores de posição (bolinhas) */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 4,
            }}
          >
            {listaAtivos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o banner ${i + 1}`}
                style={{
                  width: i === indiceAtual ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === indiceAtual ? CORES.action : 'rgba(255,255,255,0.6)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        .banner-rotativo-frame {
          aspect-ratio: 9 / 2;
        }
        .banner-nav-btn:hover {
          background: ${CORES.action} !important;
        }
        @media (max-width: 640px) {
          .banner-rotativo-frame {
            aspect-ratio: 4 / 3 !important;
          }
        }
      `}</style>
    </div>
  )
}
