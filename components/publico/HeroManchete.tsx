import React from 'react'
import Link from 'next/link'
import { CORES } from '@/lib/design'
import { formatarDataExtenso } from '@/lib/data-formatada'
import { detectarOrigem } from '@/lib/social-origem'

interface HeroMancheteProps {
  id: string
  titulo: string
  slug: string
  chapeu?: string | null
  resumo?: string | null
  fotoUrl?: string | null
  fotoFoco?: number
  dataIso?: string | null
  urlReferencia?: string | null
}

export default function HeroManchete({
  titulo,
  slug,
  chapeu,
  resumo,
  fotoUrl,
  fotoFoco = 50,
  dataIso,
  urlReferencia,
}: HeroMancheteProps) {
  const dataFormatada = formatarDataExtenso(dataIso)

  return (
    <article className="hero-manchete-article">
      <Link
        href={`/noticias/${slug}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '62% 38%',
          background: CORES.primary,
          color: '#FFFFFF',
          textDecoration: 'none',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(101,23,42,0.16)',
          transition: 'all 0.2s ease',
        }}
        className="hero-manchete-card"
      >
        {/* Foto 3:2 com enquadramento vertical */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 2',
            background: '#1A0E13',
            overflow: 'hidden',
          }}
          className="hero-manchete-foto-container"
        >
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={titulo}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `50% ${fotoFoco}%`,
                display: 'block',
                transition: 'transform 0.35s ease',
              }}
              className="hero-foto-img"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2b2628',
                padding: '24px',
              }}
            >
              <img
                src="/logo-sindicato.png"
                alt="Sindicato dos Químicos"
                style={{
                  maxWidth: '42%',
                  maxHeight: '42%',
                  objectFit: 'contain',
                  filter: 'brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.35))',
                }}
              />
            </div>
          )}
          {(() => {
            const orig = detectarOrigem(urlReferencia)
            if (orig === 'youtube') {
              return (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: '#b91c1c',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                >
                  ▶ VÍDEO EM DESTAQUE
                </span>
              )
            }
            if (orig === 'instagram') {
              return (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: '#be185d',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                >
                  📷 INSTAGRAM OFICIAL
                </span>
              )
            }
            return null
          })()}
        </div>

        {/* Painel Bordô Editorial */}
        <div
          style={{
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
          className="hero-manchete-content"
        >
          {/* Chapéu */}
          {chapeu && (
            <div
              style={{
                display: 'inline-block',
                color: '#FFB8C5',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontFamily: 'var(--font-condensed), sans-serif',
              }}
            >
              {chapeu}
            </div>
          )}

          {/* Título Principal */}
          <h2
            style={{
              margin: '0 0 14px 0',
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '34px',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '0.4px',
              color: '#FFFFFF',
              textTransform: 'uppercase',
            }}
            className="hero-manchete-title"
          >
            {titulo}
          </h2>

          {/* Resumo curto opcional */}
          {resumo && (
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14.5px',
                lineHeight: 1.45,
                color: '#F6E7EC',
                opacity: 0.9,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              className="hero-manchete-resumo"
            >
              {resumo}
            </p>
          )}

          {/* Data formatada sem zeros à esquerda */}
          {dataFormatada && (
            <div
              style={{
                fontSize: '12.5px',
                color: '#E4DCE0',
                opacity: 0.8,
                marginTop: 'auto',
                paddingTop: '8px',
              }}
            >
              {dataFormatada}
            </div>
          )}
        </div>
      </Link>

      <style>{`
        .hero-manchete-card:hover {
          box-shadow: 0 8px 32px rgba(101,23,42,0.28) !important;
          transform: translateY(-2px);
        }
        .hero-manchete-card:hover .hero-foto-img {
          transform: scale(1.02);
        }
        @media (max-width: 900px) {
          .hero-manchete-card {
            grid-template-columns: 1fr !important;
          }
          .hero-manchete-foto-container {
            aspectRatio: 3 / 2 !important;
          }
          .hero-manchete-content {
            padding: 24px 20px !important;
          }
          .hero-manchete-title {
            font-size: 26px !important;
          }
        }
        @media (max-width: 540px) {
          .hero-manchete-title {
            font-size: 22px !important;
          }
          .hero-manchete-resumo {
            display: none !important;
          }
        }
      `}</style>
    </article>
  )
}
