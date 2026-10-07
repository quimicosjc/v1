'use client'

import React, { useState, useEffect } from 'react'
import { CORES } from '@/lib/design'

export interface BannerItemData {
  id: string
  imagem: string
  link?: string | null
  titulo?: string | null
  ativo?: boolean
}

interface BannerRotativoProps {
  banners: BannerItemData[]
}

export default function BannerRotativo({ banners }: BannerRotativoProps) {
  const listaAtivos = banners.filter((b) => b.ativo !== false && b.imagem)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const total = listaAtivos.length

  useEffect(() => {
    if (total <= 1 || pausado) return
    const timer = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % total)
    }, 6000)
    return () => clearInterval(timer)
  }, [total, pausado])

  if (total === 0) return null

  const banner = listaAtivos[indiceAtual]

  function anterior() {
    setIndiceAtual((prev) => (prev - 1 + total) % total)
  }

  function proximo() {
    setIndiceAtual((prev) => (prev + 1) % total)
  }

  const BannerContent = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9 / 2',
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#1A0E13',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      className="banner-rotativo-frame"
    >
      <img
        src={banner.imagem}
        alt={banner.titulo || 'Banner institucional'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      className="banner-rotativo-wrapper"
    >
      {banner.link ? (
        <a
          href={banner.link}
          target={banner.link.startsWith('http') ? '_blank' : '_self'}
          rel={banner.link.startsWith('http') ? 'noopener noreferrer' : undefined}
          style={{ display: 'block', textDecoration: 'none' }}
        >
          {BannerContent}
        </a>
      ) : (
        BannerContent
      )}

      {/* Controles de navegação (apenas quando total > 1) */}
      {total > 1 && (
        <>
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
              zIndex: 3,
            }}
            className="banner-nav-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

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
              zIndex: 3,
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
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 3,
            }}
          >
            {listaAtivos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndiceAtual(i)}
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
        .banner-nav-btn:hover {
          background: ${CORES.action} !important;
        }
      `}</style>
    </div>
  )
}
