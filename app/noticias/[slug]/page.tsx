import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import CarrosselNoticia from '@/components/publico/CarrosselNoticia'
import BarraCompartilhamento from '@/components/publico/BarraCompartilhamento'
import { formatarDataHoraNoticia } from '@/lib/data-formatada'
import { CONTAINER_STYLE } from '@/lib/design'
import { sanitizarHtml } from '@/lib/security'
import { detectarOrigem } from '@/lib/social-origem'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface FotoItem {
  url: string
  foco?: number
  legenda?: string
  credito?: string
}

interface DocumentoItem {
  url: string
  nome: string
  tipo: string
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: noticia } = await supabase
    .from('conteudos')
    .select('titulo, resumo, banner_url')
    .eq('slug', slug)
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .maybeSingle()

  if (!noticia) {
    return {
      title: 'Notícia não encontrada · Sindicato dos Químicos SJC',
    }
  }

  return {
    title: `${noticia.titulo} · Sindicato dos Químicos SJC`,
    description: noticia.resumo || 'Notícia publicada pelo Sindicato dos Químicos de São José dos Campos e Região.',
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumo || undefined,
      images: noticia.banner_url ? [noticia.banner_url] : [],
    },
  }
}

export default async function NoticiaPublicaPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: noticia, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('slug', slug)
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .maybeSingle()

  if (error || !noticia) {
    notFound()
  }

  // Busca matérias relacionadas para o bloco "Leia Também"
  const { data: relacionadasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .neq('id', noticia.id)
    .order('publicado_em', { ascending: false })
    .limit(3)

  const relacionadas: any[] = relacionadasData || []

  // Parse fotos
  let fotos: FotoItem[] = []
  if (noticia.fotos_json) {
    try {
      fotos = JSON.parse(noticia.fotos_json) as FotoItem[]
    } catch {
      fotos = []
    }
  } else if (noticia.banner_url) {
    fotos = [{ url: noticia.banner_url, foco: noticia.imagem_y ?? 50 }]
  }

  // Parse documentos
  let documentos: DocumentoItem[] = []
  if (noticia.documentos_json) {
    try {
      documentos = JSON.parse(noticia.documentos_json) as DocumentoItem[]
    } catch {
      documentos = []
    }
  }

  // Parse tags
  let tags: string[] = []
  if (noticia.tags_json) {
    try {
      tags = JSON.parse(noticia.tags_json) as string[]
    } catch {
      tags = []
    }
  }

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado e sanitiza HTML
  const corpoBruto = (noticia.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')
  const corpoFormatado = sanitizarHtml(corpoBruto)

  const origem = detectarOrigem(noticia.url_referencia)
  const dataExibicao = formatarDataHoraNoticia(noticia.publicado_em || noticia.criado_em)

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', color: '#1a1417' }}>
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="noticias" />

      {/* ── BREADCRUMB LIMPO ALINHADO ÀS MARGENS DO CONTAINER ── */}
      <div style={{ borderBottom: '1px solid #f0e8eb', background: '#faf8f9' }}>
        <div style={{ ...CONTAINER_STYLE, paddingTop: '12px', paddingBottom: '12px' }}>
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#71636a',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ color: '#71636a', textDecoration: 'none' }} className="breadcrumb-link">
              Início
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href="/noticias" style={{ color: '#861e32', textDecoration: 'none', fontWeight: 600 }} className="breadcrumb-link">
              Notícias
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#30252a', fontWeight: 500, maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {noticia.titulo}
            </span>
          </nav>
        </div>
      </div>

      {/* ── ARTIGO COM DIAGRAMAÇÃO EDITORIAL FLUIDA (INSPIRAÇÃO G1) ── */}
      <main style={{ flex: 1, padding: '40px 20px 64px 20px' }}>
        <article style={{ maxWidth: '780px', margin: '0 auto' }}>
          
          {/* Chapéu (sem selos redundantes prévios conforme M6-A e M8-A) */}
          {noticia.chapeu && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  color: '#861e32',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {noticia.chapeu}
              </div>
            </div>
          )}

          {/* Título Principal (+2 pontos: 40px) */}
          <h1
            style={{
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '40px',
              fontWeight: 800,
              lineHeight: 1.12,
              color: '#1a1417',
              margin: '0 0 16px 0',
              letterSpacing: '-0.2px',
            }}
            className="noticia-titulo-h1"
          >
            {noticia.titulo}
          </h1>

          {/* Subtítulo / Lead (+2 pontos: 20px) */}
          {noticia.subtitulo && (
            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.55,
                color: '#554950',
                margin: '0 0 20px 0',
              }}
            >
              {noticia.subtitulo}
            </p>
          )}

          {/* Linha de Metadados (+2 pontos: 15px) */}
          <div
            style={{
              fontSize: '15px',
              color: '#71636a',
              padding: '6px 0 10px 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <time dateTime={noticia.publicado_em || noticia.criado_em}>
              {dataExibicao}
            </time>
            {noticia.credito && (
              <>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>Fonte: <strong>{noticia.credito}</strong></span>
              </>
            )}
          </div>

          {/* Barra de Compartilhamento no Topo */}
          <BarraCompartilhamento titulo={noticia.titulo} modo="topo" />

          {/* Carrossel Editorial de Fotos (M8-B: Não exibir foto se origem YouTube — apenas o vídeo basta) */}
          {origem !== 'youtube' && <CarrosselNoticia fotos={fotos} titulo={noticia.titulo} />}

          {/* Corpo da Notícia (+2 pontos: 20px) */}
          <div
            className="noticia-corpo"
            style={{
              fontSize: '20px',
              lineHeight: 1.8,
              color: '#2b2327',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: corpoFormatado }}
          />

          {/* Barra de Compartilhamento no Rodapé do Artigo */}
          <BarraCompartilhamento titulo={noticia.titulo} modo="rodape" />

          {/* Caixa inferior para redes sociais e fontes (M6-C e M8-C) */}
          {noticia.url_referencia && (
            <div
              style={{
                marginTop: '32px',
                padding: '20px 24px',
                background: origem === 'youtube' ? '#fff5f5' : origem === 'instagram' ? '#fdf2f8' : '#f8fafb',
                border: `1px solid ${origem === 'youtube' ? '#fecaca' : origem === 'instagram' ? '#fbcfe8' : '#e4dce0'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: (origem === 'instagram' || origem === 'youtube') ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '14px',
              }}
            >
              {origem === 'instagram' ? (
                <>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ad1457' }}>
                    Publicação do Instagram
                  </div>
                  <a
                    href={noticia.url_referencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#ad1457',
                      color: 'white',
                      padding: '9px 18px',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Ver no Instagram ↗</span>
                  </a>
                </>
              ) : origem === 'youtube' ? (
                <>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#b91c1c' }}>
                    Publicação do Youtube
                  </div>
                  <a
                    href={noticia.url_referencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#b91c1c',
                      color: 'white',
                      padding: '9px 18px',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Assistir no YouTube ↗</span>
                  </a>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px', textAlign: 'left' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#30252a' }}>Mais informações / Fonte:</strong>
                    <div style={{ fontSize: '12.5px', color: '#71636a', marginTop: '3px', wordBreak: 'break-all' }}>
                      {noticia.url_referencia}
                    </div>
                  </div>
                  <a
                    href={noticia.url_referencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#861e32',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Acessar link ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Documentos Anexos */}
          {documentos.length > 0 && (
            <div
              style={{
                marginTop: '36px',
                background: '#f8fafb',
                border: '1px solid #e4dce0',
                borderRadius: '8px',
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#30252a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  margin: '0 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Documentos e Anexos ({documentos.length})
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentos.map((doc, idx) => {
                  const isPdf = doc.tipo?.includes('pdf') || doc.nome?.toLowerCase().endsWith('.pdf')
                  return (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid #e4dce0',
                        borderRadius: '6px',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span
                          style={{
                            background: isPdf ? '#fbe9eb' : '#eaf1fc',
                            color: isPdf ? '#861e32' : '#365786',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '3px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          {isPdf ? 'PDF' : 'DOC'}
                        </span>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#30252a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.nome}
                        </span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={!isPdf}
                        style={{
                          background: '#861e32',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{isPdf ? 'Visualizar' : 'Baixar'}</span>
                        <span>↗</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Tags da Notícia */}
          {tags.length > 0 && (
            <div style={{ marginTop: '36px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#71636a', textTransform: 'uppercase' }}>
                Tópicos:
              </span>
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#f8fafb',
                    border: '1px solid #e4dce0',
                    color: '#554950',
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}



        </article>

        {/* ── BLOCO LEIA TAMBÉM (RETENÇÃO EDITORIAL) ── */}
        {relacionadas.length > 0 && (
          <section
            style={{
              maxWidth: '1000px',
              margin: '56px auto 0 auto',
              borderTop: '2px solid #ebdbe0',
              paddingTop: '36px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '26px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#30252a',
                  margin: 0,
                  letterSpacing: '0.4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '22px',
                    background: '#861e32',
                    display: 'inline-block',
                    borderRadius: '2px',
                  }}
                />
                Leia Também
              </h2>

              <Link
                href="/noticias"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#861e32',
                  textDecoration: 'none',
                }}
                className="breadcrumb-link"
              >
                Ver todas as notícias →
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '22px',
              }}
            >
              {relacionadas.map((rel: any) => {
                let fotoUrl = rel.banner_url
                let focoY = rel.imagem_y ?? 50
                if (rel.fotos_json) {
                  try {
                    const arr = JSON.parse(rel.fotos_json)
                    if (arr[0]?.url) {
                      fotoUrl = arr[0].url
                      focoY = arr[0].foco ?? focoY
                    }
                  } catch {}
                }

                return (
                  <Link
                    key={rel.id}
                    href={`/noticias/${rel.slug}`}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ebdbe0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    className="news-card-hover"
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '3 / 2',
                        background: '#24141A',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {fotoUrl ? (
                        <img
                          src={fotoUrl}
                          alt={rel.titulo}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: `50% ${focoY}%`,
                            display: 'block',
                          }}
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
                            padding: '12px',
                          }}
                        >
                          <img
                            src="/logo-sindicato.png"
                            alt="Sindicato"
                            style={{
                              maxWidth: '42%',
                              maxHeight: '42%',
                              objectFit: 'contain',
                              filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                            }}
                          />
                        </div>
                      )}
                      {rel.chapeu && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: '#861e32',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '3px 7px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {rel.chapeu}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '16px 18px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          lineHeight: 1.35,
                          color: '#30252a',
                          margin: '0 0 12px 0',
                        }}
                      >
                        {rel.titulo}
                      </h3>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#861e32',
                        }}
                      >
                        Ler notícia →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

      {/* Estilos Tipográficos Scoped para o HTML da Notícia */}
      <style>{`
        .breadcrumb-link:hover {
          text-decoration: underline !important;
        }
        @media (max-width: 640px) {
          .noticia-titulo-h1 {
            font-size: 26px !important;
            line-height: 1.3 !important;
          }
        }
        .noticia-corpo p {
          margin: 0 0 24px 0 !important;
          line-height: 1.8 !important;
        }
        .noticia-corpo h2 {
          font-size: 24px !important;
          font-weight: 800 !important;
          color: #1a1417 !important;
          margin: 36px 0 16px 0 !important;
          line-height: 1.3 !important;
          letter-spacing: -0.3px !important;
        }
        .noticia-corpo h3 {
          font-size: 20px !important;
          font-weight: 700 !important;
          color: #1a1417 !important;
          margin: 28px 0 12px 0 !important;
          line-height: 1.35 !important;
        }
        .noticia-corpo a {
          color: #861e32 !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
        .noticia-corpo ul, .noticia-corpo ol {
          margin: 0 0 24px 0 !important;
          padding-left: 28px !important;
          line-height: 1.75 !important;
        }
        .noticia-corpo li {
          margin-bottom: 8px !important;
        }
        .noticia-corpo blockquote {
          border-left: 4px solid #861e32 !important;
          margin: 28px 0 !important;
          padding: 12px 20px !important;
          background: #faf7f8 !important;
          color: #554950 !important;
          font-style: italic !important;
          border-radius: 0 6px 6px 0 !important;
        }
        .noticia-corpo img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 24px 0 !important;
          display: block !important;
        }
        .noticia-corpo table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 28px 0 !important;
          font-size: 14.5px !important;
        }
        .noticia-corpo th, .noticia-corpo td {
          border: 1px solid #e4dce0 !important;
          padding: 10px 14px !important;
          text-align: left !important;
        }
        .noticia-corpo th {
          background: #f8fafb !important;
          font-weight: 700 !important;
          color: #30252a !important;
        }
        .noticia-corpo iframe {
          max-width: 100% !important;
          border: none !important;
          border-radius: 6px !important;
          margin: 24px auto !important;
          display: block !important;
        }
        .noticia-corpo iframe:not([src*="instagram"]) {
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
        }
        .noticia-corpo iframe[src*="instagram"] {
          width: 100% !important;
          max-width: 540px !important;
          min-height: 680px !important;
          height: 680px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  )
}
