import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import CarrosselNoticia from '@/components/publico/CarrosselNoticia'
import { formatarDataHoraNoticia } from '@/lib/data-formatada'
import { CONTAINER_STYLE } from '@/lib/design'

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

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado
  const corpoFormatado = (noticia.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')

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
          
          {/* Chapéu / Assunto (Estilo G1: minimalista, vermelho bordô, uppercase) */}
          {noticia.chapeu && (
            <div
              style={{
                color: '#861e32',
                fontSize: '12.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              {noticia.chapeu}
            </div>
          )}

          {/* Título Principal (H1 forte, peso 800, entrelinha precisa) */}
          <h1
            style={{
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '38px',
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

          {/* Subtítulo / Lead (Fluido, cinza equilibrado, sem caixa) */}
          {noticia.subtitulo && (
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.55,
                color: '#554950',
                margin: '0 0 20px 0',
              }}
            >
              {noticia.subtitulo}
            </p>
          )}

          {/* Linha de Metadados (Estilo G1: Data com vírgula e sem zero na hora) */}
          <div
            style={{
              fontSize: '13px',
              color: '#71636a',
              padding: '10px 0 20px 0',
              borderBottom: '1px solid #e4dce0',
              marginBottom: '28px',
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

          {/* Carrossel Editorial de Fotos (Documento Mestre § 3.4 com proporção 3:2 e botão de foto completa) */}
          <CarrosselNoticia fotos={fotos} titulo={noticia.titulo} />

          {/* Corpo da Notícia com Leitura Confortável (Estilo G1: 18px, entrelinha 1.8, respiro) */}
          <div
            className="noticia-corpo"
            style={{
              fontSize: '18px',
              lineHeight: 1.8,
              color: '#2b2327',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: corpoFormatado }}
          />

          {/* URL de Referência */}
          {noticia.url_referencia && (
            <div
              style={{
                marginTop: '32px',
                padding: '14px 18px',
                background: '#f8fafb',
                borderLeft: '4px solid #861e32',
                borderRadius: '0 6px 6px 0',
                fontSize: '13.5px',
                color: '#554950',
              }}
            >
              <strong>Mais informações / Fonte:</strong>{' '}
              <a
                href={noticia.url_referencia}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#861e32', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                {noticia.url_referencia}
              </a>
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

          {/* Rodapé da Matéria com Navegação Limpa */}
          <div
            style={{
              marginTop: '48px',
              borderTop: '1px solid #e4dce0',
              paddingTop: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <Link
              href="/noticias"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#861e32',
                fontSize: '14.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
              className="breadcrumb-link"
            >
              <span>←</span>
              <span>Voltar para todas as notícias</span>
            </Link>

            <Link
              href="/"
              style={{
                fontSize: '13px',
                color: '#71636a',
                textDecoration: 'none',
              }}
              className="breadcrumb-link"
            >
              Página inicial
            </Link>
          </div>

        </article>
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
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
          border: none !important;
          border-radius: 6px !important;
          margin: 24px 0 !important;
          display: block !important;
        }
      `}</style>
    </div>
  )
}
