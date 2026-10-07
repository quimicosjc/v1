import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'

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
    .eq('status', 'publicado')
    .maybeSingle()

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

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado
  const corpoFormatado = (noticia.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', display: 'flex', flexDirection: 'column', color: '#30252a' }}>
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="noticias" />

      {/* ── FAIXA HERO INSTITUCIONAL COM BREADCRUMB ── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e4dce0',
          padding: '24px 20px 28px 20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Breadcrumb navegável */}
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
              Imprensa
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href="/noticias" style={{ color: '#71636a', textDecoration: 'none' }} className="breadcrumb-link">
              Notícias
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#30252a', fontWeight: 600, maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {noticia.titulo}
            </span>
          </nav>
        </div>
      </section>

      {/* Conteúdo principal da Notícia */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <article
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4dce0',
            boxShadow: '0 4px 16px rgba(48,37,42,0.04)',
            padding: '40px 44px',
          }}
        >
          {/* Chapéu / Assunto */}
          {noticia.chapeu && (
            <div
              style={{
                color: '#861e32',
                fontSize: '12.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
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
              letterSpacing: '-0.3px',
            }}
          >
            {noticia.titulo}
          </h1>

          {/* Subtítulo / Lead */}
          {noticia.subtitulo && (
            <div
              style={{
                fontSize: '17px',
                lineHeight: 1.6,
                color: '#65575e',
                borderLeft: '3px solid #861e32',
                paddingLeft: '14px',
                margin: '0 0 24px 0',
              }}
            >
              {noticia.subtitulo}
            </div>
          )}

          {/* Linha de Metadados: Data, Crédito, Destaque */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 0',
              borderTop: '1px solid #e4dce0',
              borderBottom: '1px solid #e4dce0',
              marginBottom: '32px',
              fontSize: '13px',
              color: '#71636a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Publicado em <strong>{formatarDataCompleta(noticia.publicado_em || noticia.criado_em)}</strong></span>
              </div>

              {noticia.credito && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Por <strong>{noticia.credito}</strong></span>
                </div>
              )}
            </div>

            {noticia.destaque && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#fff2df',
                  color: '#825914',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#825914" stroke="#825914" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Notícia em Destaque
              </span>
            )}
          </div>

          {/* Foto Principal com Preservação de Orientação Original (Regra de Ouro) */}
          {fotoPrincipal && (
            <figure style={{ margin: '0 0 36px 0' }}>
              <div
                style={{
                  width: '100%',
                  maxHeight: '540px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#f8fafb',
                  border: '1px solid #e4dce0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={fotoPrincipal.url}
                  alt={fotoPrincipal.legenda || noticia.titulo}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '540px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              {(fotoPrincipal.legenda || fotoPrincipal.credito) && (
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
                  <span>{fotoPrincipal.legenda}</span>
                  {fotoPrincipal.credito && (
                    <span>Foto: {fotoPrincipal.credito}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* Corpo da Notícia com Estilização HTML Scoped */}
          <div
            className="noticia-corpo"
            dangerouslySetInnerHTML={{ __html: corpoFormatado }}
          />

          {/* Fotos adicionais da matéria com Preservação de Orientação Original (Regra de Ouro) */}
          {fotosGaleria.length > 0 && (
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {fotosGaleria.map((foto, idx) => (
                <figure key={idx} style={{ margin: 0 }}>
                  <div
                    style={{
                      width: '100%',
                      maxHeight: '540px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f8fafb',
                      border: '1px solid #e4dce0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={foto.url}
                      alt={foto.legenda || `Foto ${idx + 2}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '540px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>
                  {(foto.legenda || foto.credito) && (
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
                      <span>{foto.legenda}</span>
                      {foto.credito && (
                        <span>Foto: {foto.credito}</span>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
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

          {/* Navegação Inferior: Retornar às Notícias */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #e4dce0', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              href="/noticias"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#861e32',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
              className="breadcrumb-link"
            >
              ← Voltar para todas as notícias
            </Link>
          </div>
        </article>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

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
        .noticia-corpo iframe,
        .noticia-corpo .iframe-wrapper iframe {
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
          border: none !important;
          border-radius: 6px !important;
          margin: 24px 0 !important;
          display: block !important;
        }
        .noticia-corpo .iframe-wrapper {
          position: relative !important;
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
          margin: 24px 0 !important;
          border-radius: 6px !important;
          overflow: hidden !important;
          background: #000 !important;
        }
      `}</style>
    </div>
  )
}
