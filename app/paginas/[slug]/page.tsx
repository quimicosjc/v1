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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pagina } = await supabase
    .from('conteudos')
    .select('titulo, subtitulo, corpo, banner_url, noindex')
    .eq('slug', slug)
    .eq('tipo', 'avulsa')
    .eq('status', 'publicado')
    .maybeSingle()

  if (!pagina) {
    return {
      title: 'Página não encontrada · Sindicato dos Químicos SJC',
      robots: { index: false, follow: false },
    }
  }

  const descricao = pagina.subtitulo || stripHtml(pagina.corpo || '').slice(0, 160) || 'Página do Sindicato dos Químicos de São José dos Campos e Região.'

  return {
    title: `${pagina.titulo} · Sindicato dos Químicos SJC`,
    description: descricao,
    robots: pagina.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: pagina.titulo,
      description: descricao,
      images: pagina.banner_url ? [pagina.banner_url] : [],
    },
  }
}

export default async function PaginaAvulsaPublicaPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pagina, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('slug', slug)
    .eq('tipo', 'avulsa')
    .eq('status', 'publicado')
    .maybeSingle()

  if (error || !pagina) {
    notFound()
  }

  // Parse fotos
  let fotos: FotoItem[] = []
  if (pagina.fotos_json) {
    try {
      fotos = JSON.parse(pagina.fotos_json) as FotoItem[]
    } catch {
      fotos = []
    }
  } else if (pagina.banner_url) {
    fotos = [{ url: pagina.banner_url, foco: pagina.imagem_y ?? 50 }]
  }

  const fotoPrincipal = fotos[0] ?? null
  const fotosGaleria = fotos.slice(1)

  // Parse documentos
  let documentos: DocumentoItem[] = []
  if (pagina.documentos_json) {
    try {
      documentos = JSON.parse(pagina.documentos_json) as DocumentoItem[]
    } catch {
      documentos = []
    }
  }

  // Parse tags
  let tags: string[] = []
  if (pagina.tags_json) {
    try {
      tags = JSON.parse(pagina.tags_json) as string[]
    } catch {
      tags = []
    }
  }

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado
  const corpoFormatado = (pagina.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')

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
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '14px' }}>
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
          </Link>

          <Link
            href="/admin/avulsas"
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

      {/* Conteúdo principal da Página Avulsa */}
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
          {pagina.chapeu && (
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
              {pagina.chapeu}
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
            {pagina.titulo}
          </h1>

          {/* Subtítulo */}
          {pagina.subtitulo && (
            <div
              style={{
                fontSize: '18px',
                lineHeight: 1.5,
                color: '#71636a',
                marginBottom: '24px',
                borderLeft: '3px solid #861e32',
                paddingLeft: '14px',
              }}
            >
              {pagina.subtitulo}
            </div>
          )}

          {/* Foto Principal com Enquadramento 3:2 Preservado */}
          {fotoPrincipal && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f0f0f0',
                }}
              >
                <img
                  src={fotoPrincipal.url}
                  alt={pagina.titulo}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `50% ${fotoPrincipal.foco ?? 50}%`,
                    display: 'block',
                  }}
                />
              </div>
              {fotoPrincipal.legenda && (
                <div style={{ fontSize: '13px', color: '#71636a', marginTop: '8px', fontStyle: 'italic' }}>
                  {fotoPrincipal.legenda}
                </div>
              )}
            </div>
          )}

          {/* Galeria de Fotos Adicionais (se houver) */}
          {fotosGaleria.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '12px' }}>
                Fotos complementares
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {fotosGaleria.map((fg, idx) => (
                  <div key={fg.url} style={{ borderRadius: '4px', overflow: 'hidden', background: '#f0f0f0', aspectRatio: '3 / 2' }}>
                    <img
                      src={fg.url}
                      alt={`Foto complementar ${idx + 2}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: `50% ${fg.foco ?? 50}%`,
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corpo do Texto Sanitizado */}
          <div
            className="pagina-conteudo"
            style={{
              fontSize: '16px',
              lineHeight: 1.75,
              color: '#30252a',
              marginTop: '20px',
            }}
            dangerouslySetInnerHTML={{ __html: corpoFormatado }}
          />

          {/* Estilos para elementos internos renderizados do RichEditor */}
          <style>{`
            .pagina-conteudo p { margin: 0 0 16px 0; }
            .pagina-conteudo h2 { font-size: 22px; font-weight: 700; color: #30252a; margin: 28px 0 12px 0; }
            .pagina-conteudo h3 { font-size: 18px; font-weight: 600; color: #30252a; margin: 20px 0 8px 0; }
            .pagina-conteudo blockquote { border-left: 3px solid #861e32; margin: 20px 0; padding-left: 16px; color: #71636a; font-style: italic; }
            .pagina-conteudo ul, .pagina-conteudo ol { padding-left: 24px; margin-bottom: 16px; }
            .pagina-conteudo li { margin-bottom: 6px; }
            .pagina-conteudo a { color: #861e32; text-decoration: underline; }
            .pagina-conteudo img { max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 4px; }
            .pagina-conteudo table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .pagina-conteudo th, .pagina-conteudo td { border: 1px solid #cbd7de; padding: 10px 14px; text-align: left; }
            .pagina-conteudo th { background: #f8fafb; font-weight: 600; color: #30252a; }
            .pagina-conteudo .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 20px 0; border-radius: 6px; overflow: hidden; background: #000; }
            .pagina-conteudo .iframe-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          `}</style>

          {/* Documentos Anexos */}
          {documentos.length > 0 && (
            <div style={{ marginTop: '36px', borderTop: '1px solid #e4dce0', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', marginBottom: '14px' }}>
                Documentos anexados
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentos.map((doc) => (
                  <div
                    key={doc.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafb',
                      border: '1px solid #cbd7de',
                      borderRadius: '6px',
                      padding: '12px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#30252a' }}>
                          {doc.nome}
                        </div>
                        <small style={{ color: '#71636a', textTransform: 'uppercase' }}>
                          Arquivo {doc.tipo}
                        </small>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#861e32',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {doc.tipo === 'pdf' ? 'Abrir PDF ↗' : 'Download ⤓'}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginTop: '28px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    background: '#f0e8ea',
                    color: '#65172a',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      {/* Rodapé institucional */}
      <footer
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e4dce0',
          padding: '24px 20px',
          textAlign: 'center',
          color: '#71636a',
          fontSize: '13px',
        }}
      >
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div>Sindicato dos Químicos de São José dos Campos e Região</div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            Praça Romualdo César de Almeida, 120 — Jardim Sul, São José dos Campos/SP
          </div>
        </div>
      </footer>
    </div>
  )
}
