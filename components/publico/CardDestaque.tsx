import React from 'react'
import Link from 'next/link'
import { CORES } from '@/lib/design'
import { formatarDataExtenso } from '@/lib/data-formatada'
import { detectarOrigem } from '@/lib/social-origem'

interface CardDestaqueProps {
  id: string
  titulo: string
  slug: string
  chapeu?: string | null
  fotoUrl?: string | null
  fotoFoco?: number
  dataIso?: string | null
  layout?: 'coluna' | 'grande'
  urlReferencia?: string | null
}

export default function CardDestaque({
  titulo,
  slug,
  chapeu,
  fotoUrl,
  fotoFoco = 50,
  dataIso,
  layout = 'coluna',
  urlReferencia,
}: CardDestaqueProps) {
  const dataFormatada = formatarDataExtenso(dataIso)

  return (
    <article className="card-destaque-article">
      <Link
        href={`/noticias/${slug}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          textDecoration: 'none',
          color: CORES.ink,
          height: '100%',
          background: '#FFFFFF',
          borderRadius: '4px',
          overflow: 'hidden',
          border: `1px solid ${CORES.line}`,
          transition: 'all 0.18s ease',
        }}
        className="card-destaque-link"
      >
        {/* Foto 3:2 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 2',
            background: '#F0E8EA',
            overflow: 'hidden',
          }}
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
                transition: 'transform 0.3s ease',
              }}
              className="card-destaque-img"
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
                padding: '16px',
              }}
            >
              <img
                src="/logo-sindicato.png"
                alt="Sindicato dos Químicos"
                style={{
                  maxWidth: '42%',
                  maxHeight: '42%',
                  objectFit: 'contain',
                  filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
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
                    top: '10px',
                    right: '10px',
                    background: '#b91c1c',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 7px',
                    borderRadius: '3px',
                    letterSpacing: '0.4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    zIndex: 2,
                  }}
                >
                  ▶ VÍDEO
                </span>
              )
            }
            if (orig === 'instagram') {
              return (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#be185d',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 7px',
                    borderRadius: '3px',
                    letterSpacing: '0.4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    zIndex: 2,
                  }}
                >
                  📷 INSTAGRAM
                </span>
              )
            }
            return null
          })()}
        </div>

        {/* Conteúdo editorial */}
        <div
          style={{
            padding: layout === 'grande' ? '18px 20px' : '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {/* Chapéu / Kicker */}
          {chapeu && (
            <div
              style={{
                color: CORES.action,
                fontSize: layout === 'grande' ? '12.5px' : '11.5px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: '6px',
                fontFamily: 'var(--font-condensed), sans-serif',
              }}
            >
              {chapeu}
            </div>
          )}

          {/* Título */}
          <h3
            style={{
              margin: '0 0 10px 0',
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: layout === 'grande' ? '24px' : '19px',
              fontWeight: 700,
              lineHeight: 1.15,
              color: CORES.ink,
              transition: 'color 0.15s ease',
            }}
            className="card-destaque-title"
          >
            {titulo}
          </h3>

          {/* Data */}
          {dataFormatada && (
            <div
              style={{
                fontSize: '11.5px',
                color: CORES.muted,
                marginTop: 'auto',
                paddingTop: '6px',
              }}
            >
              {dataFormatada}
            </div>
          )}
        </div>
      </Link>

      <style>{`
        .card-destaque-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08) !important;
          border-color: ${CORES.action} !important;
        }
        .card-destaque-link:hover .card-destaque-img {
          transform: scale(1.03);
        }
        .card-destaque-link:hover .card-destaque-title {
          color: ${CORES.action} !important;
        }
      `}</style>
    </article>
  )
}
