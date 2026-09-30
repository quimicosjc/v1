import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    .single()

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

function formatarDataCompleta(dataIso: string | null): string {
  if (!dataIso) return ''
  try {
    const d = new Date(dataIso)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dataIso
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
    .single()

  if (error || !noticia) {
    notFound()
  }

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

  const fotoPrincipal = fotos[0] ?? null
  const fotosGaleria = fotos.slice(1)

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

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', display: 'flex', flexDirection: 'column', color: '#30252a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Topo institucional */}
      <header
        style={{
          background: '#65172A',
          color: '#ffffff',
          borderBottom: '3px solid #861e32',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '920px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo-sindicato.png"
              alt="Logo Sindicato dos Químicos SJC"
              style={{ height: '42px', width: 'auto', display: 'block' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: 1.2 }}>
                Sindicato dos Químicos
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, letterSpacing: '0.2px' }}>
                São José dos Campos e Região
              </div>
            </div>
          </div>

          <Link
            href="/admin/noticias"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '5px',
              padding: '6px 14px',
              fontSize: '12px',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Painel de Controle
          </Link>
        </div>
      </header>

      {/* Conteúdo principal da Notícia */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <article
          style={{
            maxWidth: '840px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e4dce0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '36px 40px',
          }}
        >
          {/* Chapéu / Assunto */}
          {noticia.chapeu && (
            <div
              style={{
                color: '#861e32',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '12px',
              }}
            >
              {noticia.chapeu}
            </div>
          )}

          {/* Título Principal */}
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#30252a',
              margin: '0 0 16px 0',
            }}
          >
            {noticia.titulo}
          </h1>

          {/* Subtítulo */}
          {noticia.subtitulo && (
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#71636a',
                margin: '0 0 20px 0',
              }}
            >
              {noticia.subtitulo}
            </h2>
          )}

          {/* Linha de Metadados: Data, Crédito, Compartilhar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '14px 0',
              borderTop: '1px solid #e4dce0',
              borderBottom: '1px solid #e4dce0',
              marginBottom: '28px',
              fontSize: '13px',
              color: '#71636a',
            }}
          >
            <div>
              <span>Publicado em <strong>{formatarDataCompleta(noticia.publicado_em || noticia.criado_em)}</strong></span>
              {noticia.credito && (
                <span style={{ marginLeft: '12px' }}>
                  • Por <strong>{noticia.credito}</strong>
                </span>
              )}
            </div>

            {noticia.destaque && (
              <span
                style={{
                  background: '#fff2df',
                  color: '#825914',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                ★ Notícia em Destaque
              </span>
            )}
          </div>

          {/* Foto Principal */}
          {fotoPrincipal && (
            <figure style={{ margin: '0 0 32px 0' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f0e8ea',
                }}
              >
                <img
                  src={fotoPrincipal.url}
                  alt={fotoPrincipal.legenda || noticia.titulo}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `50% ${fotoPrincipal.foco ?? 50}%`,
                    display: 'block',
                  }}
                />
              </div>
              {(fotoPrincipal.legenda || fotoPrincipal.credito) && (
                <figcaption
                  style={{
                    fontSize: '13px',
                    color: '#71636a',
                    marginTop: '8px',
                    lineHeight: 1.4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span>{fotoPrincipal.legenda}</span>
                  {fotoPrincipal.credito && (
                    <span style={{ fontStyle: 'italic', opacity: 0.85 }}>Foto: {fotoPrincipal.credito}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* Corpo da Notícia com Estilização HTML Scoped */}
          <div
            className="noticia-corpo"
            dangerouslySetInnerHTML={{ __html: noticia.corpo || '' }}
          />

          {/* URL de Referência */}
          {noticia.url_referencia && (
            <div
              style={{
                marginTop: '32px',
                padding: '14px 18px',
                background: '#f8fafb',
                border: '1px solid #e4dce0',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#30252a',
              }}
            >
              <strong>Fonte / Matéria original: </strong>{' '}
              <a
                href={noticia.url_referencia}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#791c30', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                {noticia.url_referencia}
              </a>
            </div>
          )}

          {/* Galeria de Fotos Adicionais */}
          {fotosGaleria.length > 0 && (
            <section style={{ marginTop: '40px', borderTop: '1px solid #e4dce0', paddingTop: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30252a', margin: '0 0 16px 0' }}>
                Mais fotos da matéria ({fotosGaleria.length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '16px',
                }}
              >
                {fotosGaleria.map((foto, idx) => (
                  <figure key={idx} style={{ margin: 0 }}>
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '3 / 2',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#f0e8ea',
                      }}
                    >
                      <img
                        src={foto.url}
                        alt={foto.legenda || `Foto ${idx + 2}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${foto.foco ?? 50}%`,
                          display: 'block',
                        }}
                      />
                    </div>
                    {foto.legenda && (
                      <figcaption style={{ fontSize: '12px', color: '#71636a', marginTop: '6px' }}>
                        {foto.legenda}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Documentos Anexos */}
          {documentos.length > 0 && (
            <section style={{ marginTop: '40px', borderTop: '1px solid #e4dce0', paddingTop: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30252a', margin: '0 0 16px 0' }}>
                Documentos para download ({documentos.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentos.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      background: '#f8fafb',
                      border: '1px solid #e4dce0',
                      borderRadius: '6px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#30252a' }}>
                          {doc.nome}
                        </div>
                        <div style={{ fontSize: '12px', color: '#71636a' }}>
                          Tipo: {doc.tipo.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        background: '#861e32',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Baixar arquivo ↗
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div
              style={{
                marginTop: '36px',
                borderTop: '1px solid #e4dce0',
                paddingTop: '20px',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#71636a' }}>Tags:</span>
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#f0e8ea',
                    color: '#65172a',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      {/* Rodapé institucional */}
      <footer
        style={{
          background: '#30252a',
          color: '#e4dce0',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '13px',
          borderTop: '1px solid #4a3b42',
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          Sindicato dos Químicos de São José dos Campos e Região
        </p>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '12px' }}>
          Todos os direitos reservados • Sistema Institucional
        </p>
      </footer>

      {/* Estilos Scoped para a renderização do corpo da notícia */}
      <style>{`
        .noticia-corpo {
          font-size: 17px;
          line-height: 1.8;
          color: #30252a;
        }
        .noticia-corpo p {
          margin: 0 0 20px 0;
        }
        .noticia-corpo h2 {
          font-size: 24px;
          font-weight: 700;
          color: #30252a;
          margin: 36px 0 16px 0;
          border-bottom: 1px solid #f0e8ea;
          padding-bottom: 8px;
        }
        .noticia-corpo h3 {
          font-size: 20px;
          font-weight: 600;
          color: #30252a;
          margin: 28px 0 12px 0;
        }
        .noticia-corpo blockquote {
          border-left: 4px solid #861e32;
          margin: 24px 0;
          padding: 12px 20px;
          background: #faf6f7;
          color: #65172a;
          font-style: italic;
          border-radius: 0 4px 4px 0;
        }
        .noticia-corpo a {
          color: #791c30;
          text-decoration: underline;
          font-weight: 500;
        }
        .noticia-corpo img {
          width: 100% !important;
          height: auto !important;
          display: block;
          border-radius: 6px;
          margin: 24px 0;
        }
        .noticia-corpo table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 15px;
        }
        .noticia-corpo th,
        .noticia-corpo td {
          border: 1px solid #e4dce0;
          padding: 10px 14px;
          text-align: left;
          word-break: break-word;
        }
        .noticia-corpo th {
          background: #f8fafb;
          font-weight: 600;
          color: #30252a;
        }
        .noticia-corpo ul,
        .noticia-corpo ol {
          padding-left: 24px;
          margin: 0 0 20px 0;
        }
        .noticia-corpo li {
          margin-bottom: 8px;
        }
        .noticia-corpo iframe {
          width: 100% !important;
          aspect-ratio: 16 / 9;
          border: none;
          border-radius: 6px;
          margin: 24px 0;
        }
      `}</style>
    </div>
  )
}
