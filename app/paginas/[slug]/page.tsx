import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FormularioSindicalizacao from '@/components/publico/FormularioSindicalizacao'
import FormularioCarteirinha from '@/components/publico/FormularioCarteirinha'
import FormularioAtualizacao from '@/components/publico/FormularioAtualizacao'
import FormularioDenuncia from '@/components/publico/FormularioDenuncia'
import FormularioCadastroNoticias from '@/components/publico/FormularioCadastroNoticias'

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
    .in('tipo', ['avulsa', 'institucional'])
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

export default async function PaginaPublicaPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pagina, error } = await supabase
    .from('conteudos')
    .select('*')
    .eq('slug', slug)
    .in('tipo', ['avulsa', 'institucional'])
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

  // Parse tags / dados estruturados
  let tags: string[] = []
  let dadosEstruturados: any = null
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string') {
          tags = parsed as string[]
        } else {
          dadosEstruturados = { records: parsed }
        }
      } else if (typeof parsed === 'object') {
        dadosEstruturados = parsed
      }
    } catch {
      tags = []
    }
  }

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado
  const corpoFormatado = (pagina.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')

  const records = dadosEstruturados?.records || []
  const tipoPagina = dadosEstruturados?.tipoPagina || ''

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
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href={pagina.tipo === 'institucional' ? '/admin/paginas' : '/admin/avulsas'}
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
        </div>
      </header>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <article
          style={{
            maxWidth: '880px',
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
                fontSize: '17px',
                lineHeight: 1.55,
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
                  maxHeight: '440px',
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

          {/* Corpo do Texto Sanitizado */}
          {corpoFormatado && (
            <div
              className="pagina-conteudo"
              style={{
                fontSize: '16px',
                lineHeight: 1.75,
                color: '#30252a',
                marginTop: '16px',
              }}
              dangerouslySetInnerHTML={{ __html: corpoFormatado }}
            />
          )}

          {/* ── SEÇÃO DE DADOS ESTRUTURADOS INSTITUCIONAIS ── */}

          {/* 1. DIRETORIA */}
          {tipoPagina === 'directors' && records.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              {['Executiva', 'Colegiado'].map((grupo) => {
                const membros = records.filter((r: any) => r.group === grupo && r.active !== false)
                if (membros.length === 0) return null
                return (
                  <div key={grupo} style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', borderBottom: '2px solid #861e32', paddingBottom: '6px', marginBottom: '16px' }}>
                      {grupo === 'Executiva' ? 'Diretoria Executiva' : 'Diretoria Colegiada / Base'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                      {membros.map((m: any) => (
                        <div key={m.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e4dce0', overflow: 'hidden', flexShrink: 0 }}>
                            {m.image ? (
                              <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#861e32' }}>
                                {m.name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#30252a', display: 'block', lineHeight: '1.25' }}>{m.name}</strong>
                            <small style={{ fontSize: '12px', color: '#71636a' }}>{m.company}</small>
                            {m.role && <div style={{ fontSize: '11px', color: '#861e32', fontWeight: 600 }}>{m.role}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 2. CONVÊNIOS */}
          {tipoPagina === 'partners' && records.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {records.filter((r: any) => r.active !== false).map((c: any) => (
                  <div key={c.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32', textTransform: 'uppercase' }}>{c.kind}</span>
                      <span style={{ fontSize: '11px', color: '#71636a' }}>{c.city}</span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', margin: '0 0 6px' }}>{c.name}</h3>
                    <p style={{ fontSize: '13px', color: '#4a3f45', margin: '0 0 8px', lineHeight: '1.4' }}>{c.description}</p>
                    {c.phone && <div style={{ fontSize: '12px', color: '#71636a' }}>📞 {c.phone}</div>}
                    {c.address && <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>📍 {c.address}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. CONTATOS E SEDES */}
          {tipoPagina === 'contacts' && records.length > 0 && (
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {records.filter((r: any) => r.active !== false).map((s: any) => (
                <div key={s.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '18px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 6px' }}>{s.name}</h3>
                  {s.description && <p style={{ fontSize: '13px', color: '#861e32', margin: '0 0 6px', fontWeight: 500 }}>{s.description}</p>}
                  <div style={{ fontSize: '13px', color: '#4a3f45', lineHeight: '1.6' }}>
                    {s.address && <div>📍 <strong>Endereço:</strong> {s.address}</div>}
                    {s.hours && <div>⏰ <strong>Horário:</strong> {s.hours}</div>}
                    {s.phone && <div>📞 <strong>Telefone:</strong> {s.phone}</div>}
                    {s.whatsapp && <div>💬 <strong>WhatsApp:</strong> {s.whatsapp}</div>}
                    {s.email && <div>✉️ <strong>E-mail:</strong> {s.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. LINKS ÚTEIS */}
          {tipoPagina === 'links' && records.length > 0 && (
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {records.filter((r: any) => r.active !== false).map((l: any) => (
                <div key={l.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#30252a', display: 'block' }}>{l.name}</strong>
                    {l.description && <small style={{ fontSize: '12px', color: '#71636a' }}>{l.description}</small>}
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#861e32', color: '#ffffff', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Acessar ↗
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* 5. CCTs e PROCESSOS COLETIVOS */}
          {(tipoPagina === 'documents' || tipoPagina === 'processes' || tipoPagina === 'hours') && records.length > 0 && (
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {records.filter((r: any) => r.active !== false).map((item: any) => (
                <div key={item.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#30252a', display: 'block' }}>{item.name}</strong>
                    {item.company && <div style={{ fontSize: '13px', color: '#4a3f45' }}><strong>Empresa:</strong> {item.company}</div>}
                    {item.number && <div style={{ fontSize: '12px', color: '#71636a' }}><strong>Vara/TRT:</strong> {item.number}</div>}
                    {item.day && <div style={{ fontSize: '13px', color: '#4a3f45' }}>🗓️ {item.day} • {item.hours}</div>}
                    {item.validity && <div style={{ fontSize: '12px', color: '#71636a' }}>Vigência: {item.validity}</div>}
                  </div>
                  {item.file && (
                    <a
                      href={item.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#861e32', color: '#ffffff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Abrir PDF ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 6. TABELA DE PREÇOS DA COLÔNIA */}
          {tipoPagina === 'prices' && records.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {records.filter((r: any) => r.active !== false).map((p: any) => (
                  <div key={p.id} style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32' }}>{p.unit}</span>
                      <span style={{ fontSize: '11px', color: '#71636a' }}>{p.public}</span>
                    </div>
                    <strong style={{ fontSize: '15px', color: '#30252a', display: 'block', marginBottom: '4px' }}>{p.type}</strong>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', marginBottom: '6px' }}>
                      R$ {p.value?.toFixed(2).replace('.', ',')} <small style={{ fontSize: '12px', color: '#71636a' }}>{p.charge}</small>
                    </div>
                    {p.capacity && <div style={{ fontSize: '12px', color: '#30252a' }}>👥 {p.capacity}</div>}
                    {p.notes && <p style={{ fontSize: '12px', color: '#71636a', marginTop: '6px', lineHeight: '1.4' }}>{p.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. FORMULÁRIOS INTERATIVOS PÚBLICOS */}
          {slug === 'fique-socio' && <FormularioSindicalizacao />}
          {slug === 'carteirinha' && <FormularioCarteirinha />}
          {slug === 'atualizar-cadastro' && <FormularioAtualizacao />}
          {slug === 'denuncia' && <FormularioDenuncia />}
          {slug === 'cadastro-noticias' && <FormularioCadastroNoticias />}

          {/* Galeria de Fotos Adicionais (se houver) */}
          {fotosGaleria.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', marginBottom: '12px' }}>
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
