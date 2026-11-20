'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CORES } from '@/lib/design'
import {
  TEMPO_BANNER_PADRAO_SEG,
  sanitizarTempoBannerSegundos,
} from '@/lib/banner-config'

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
  duracaoSegundos?: number
}

const TICK_MS = 100

export default function BannerRotativo({
  banners,
  duracaoSegundos = TEMPO_BANNER_PADRAO_SEG,
}: BannerRotativoProps) {
  const listaAtivos = banners.filter((b) => b.ativo !== false && b.imagem)
  const segundosValidos = sanitizarTempoBannerSegundos(duracaoSegundos)
  const duracaoBannerMs = segundosValidos * 1000

  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pausadoManual, setPausadoManual] = useState(false)
  const [hoverOuFoco, setHoverOuFoco] = useState(false)
  const [tempoRestanteMs, setTempoRestanteMs] = useState(duracaoBannerMs)

  const total = listaAtivos.length
  const estaPausado = pausadoManual || hoverOuFoco

  // Sincroniza timer caso a duração configurada mude
  useEffect(() => {
    setTempoRestanteMs(duracaoBannerMs)
  }, [duracaoBannerMs])

  // Respeita preferência por movimento reduzido (L08)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        setPausadoManual(true)
      }
    }
  }, [])

  useEffect(() => {
    if (total <= 1 || estaPausado) return

    const interval = setInterval(() => {
      setTempoRestanteMs((prev) => {
        if (prev <= TICK_MS) {
          setIndiceAtual((curr) => (curr + 1) % total)
          return duracaoBannerMs
        }
        return prev - TICK_MS
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [total, estaPausado, duracaoBannerMs])

  const anterior = useCallback(() => {
    setIndiceAtual((prev) => (prev - 1 + total) % total)
    setTempoRestanteMs(duracaoBannerMs)
  }, [total, duracaoBannerMs])

  const proximo = useCallback(() => {
    setIndiceAtual((prev) => (prev + 1) % total)
    setTempoRestanteMs(duracaoBannerMs)
  }, [total, duracaoBannerMs])

  const irPara = useCallback(
    (idx: number) => {
      setIndiceAtual(idx)
      setTempoRestanteMs(duracaoBannerMs)
    },
    [duracaoBannerMs]
  )

  if (total === 0) return null

  const segundosRestantes = Math.max(1, Math.ceil(tempoRestanteMs / 1000))

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Banners institucionais rotativos"
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setHoverOuFoco(true)}
      onMouseLeave={() => setHoverOuFoco(false)}
      onFocus={() => setHoverOuFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoverOuFoco(false)
        }
      }}
      onTouchStart={() => setHoverOuFoco(true)}
      onTouchEnd={() => setHoverOuFoco(false)}
      onKeyDown={(e) => {
        if (total <= 1) return
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          anterior()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          proximo()
        }
      }}
      className="banner-rotativo-wrapper"
    >
      <div
        aria-live="off"
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
              aria-hidden={!ativo}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: ativo ? 1 : 0,
                transition: 'opacity 0.65s ease-in-out',
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
          {/* Botão de Pausa / Retomada acessível por toque e teclado (L08) */}
          <button
            type="button"
            onClick={() => setPausadoManual((prev) => !prev)}
            aria-pressed={pausadoManual}
            aria-label={estaPausado ? 'Retomar rotação automática dos banners' : 'Pausar rotação automática dos banners'}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 4,
              background: estaPausado ? 'rgba(134, 30, 50, 0.9)' : 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              padding: '5px 12px',
              minHeight: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'background 0.2s ease',
            }}
            title={estaPausado ? 'Clique para retomar a rotação' : 'Clique para pausar a rotação'}
          >
            {estaPausado ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Pausado</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>{`${segundosRestantes}s`}</span>
              </>
            )}
          </button>

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
              background: 'rgba(0,0,0,0.52)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              zIndex: 4,
            }}
            className="banner-nav-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              background: 'rgba(0,0,0,0.52)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              zIndex: 4,
            }}
            className="banner-nav-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              gap: '8px',
              zIndex: 4,
            }}
          >
            {listaAtivos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o banner ${i + 1} de ${total}`}
                aria-current={i === indiceAtual ? 'true' : undefined}
                style={{
                  width: i === indiceAtual ? '26px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: i === indiceAtual ? CORES.action : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(0,0,0,0.2)',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
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
        @media (prefers-reduced-motion: reduce) {
          .banner-rotativo-frame > div {
            transition: none !important;
          }
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
