import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FormularioSindicalizacao from '@/components/publico/FormularioSindicalizacao'
import FormularioCarteirinha from '@/components/publico/FormularioCarteirinha'
import FormularioAtualizacao from '@/components/publico/FormularioAtualizacao'
import FormularioDenuncia from '@/components/publico/FormularioDenuncia'
import FormularioCadastroNoticias from '@/components/publico/FormularioCadastroNoticias'
import FormularioFaleConosco from '@/components/publico/FormularioFaleConosco'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import ColoniaNav from '@/components/publico/ColoniaNav'
import ListaNoticiasPublica, { type NoticiaItemPublico } from '@/components/publico/ListaNoticiasPublica'
import ListaConveniosPublica from '@/components/publico/ListaConveniosPublica'
import ListaProcessosPublica from '@/components/publico/ListaProcessosPublica'
import GaleriaColoniaPublica from '@/components/publico/GaleriaColoniaPublica'
import { CONTAINER_STYLE } from '@/lib/design'
import { sanitizarHtml } from '@/lib/security'

export const revalidate = 300

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

  const slugNormalizado = slug === 'homologacao' ? 'homologacoes' : slug

  const { data: pagina } = await supabase
    .from('conteudos')
    .select('titulo, subtitulo, corpo, banner_url, noindex')
    .eq('slug', slugNormalizado)
    .in('tipo', ['avulsa', 'institucional'])
    .eq('status', 'publicado')
    .maybeSingle()

  if (!pagina) {
    return {
      title: 'Página não encontrada · Sindicato dos Químicos SJC',
      robots: { index: false, follow: false },
    }
  }

  const descricao =
    pagina.subtitulo ||
    stripHtml(pagina.corpo || '').slice(0, 160) ||
    'Página do Sindicato dos Químicos de São José dos Campos e Região.'
  const isDominioOficial = Boolean(
    process.env.NEXT_PUBLIC_SITE_URL &&
      process.env.NEXT_PUBLIC_SITE_URL.includes('quimicosjc.org.br')
  )

  return {
    title: `${pagina.titulo} · Sindicato dos Químicos SJC`,
    description: descricao,
    robots:
      !isDominioOficial || pagina.noindex
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      title: pagina.titulo,
      description: descricao,
      images: pagina.banner_url ? [pagina.banner_url] : [],
    },
  }
}

export default async function PaginaInstitucionalPublica({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const slugNormalizado = slug === 'homologacao' ? 'homologacoes' : slug

  const { data: pagina } = await supabase
    .from('conteudos')
    .select('*')
    .eq('slug', slugNormalizado)
    .in('tipo', ['avulsa', 'institucional'])
    .eq('status', 'publicado')
    .maybeSingle()

  if (!pagina) {
    notFound()
  }

  // Parse das fotos
  let fotos: FotoItem[] = []
  if (pagina.fotos_json) {
    try {
      fotos = JSON.parse(pagina.fotos_json) as FotoItem[]
    } catch {
      fotos = []
    }
  }

  if (fotos.length === 0 && pagina.banner_url && !slugNormalizado.startsWith('colonia')) {
    fotos = [{ url: pagina.banner_url, foco: pagina.imagem_y ?? 50 }]
  }

  const fotoPrincipal =
    fotos.length > 0 && !slugNormalizado.startsWith('colonia') && slugNormalizado !== 'historia'
      ? fotos[0]
      : null
  const fotosGaleria =
    fotos.length > 1 && !slugNormalizado.startsWith('colonia') && slugNormalizado !== 'historia'
      ? fotos.slice(1)
      : []

  // Parse de documentos
  let documentos: DocumentoItem[] = []
  if (pagina.documentos_json) {
    try {
      documentos = JSON.parse(pagina.documentos_json) as DocumentoItem[]
    } catch {
      documentos = []
    }
  }

  // Parse de dados estruturados adicionais
  let dadosEstruturados: any = null
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
          dadosEstruturados = { records: parsed }
        }
      } else if (typeof parsed === 'object') {
        dadosEstruturados = parsed
      }
    } catch {
      dadosEstruturados = null
    }
  }

  const corpoBruto = (pagina.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')
  const corpoFormatado = sanitizarHtml(corpoBruto)

  const records = dadosEstruturados?.records || []
  const tipoPagina = dadosEstruturados?.tipoPagina || ''
  const isColonia = slugNormalizado.startsWith('colonia')

  let noticiasParaLista: NoticiaItemPublico[] = []
  if (slug === 'lista-noticias') {
    const { data: nData } = await supabase
      .from('conteudos')
      .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
      .eq('tipo', 'noticia')
      .eq('status', 'publicado')
      .order('publicado_em', { ascending: false })
    noticiasParaLista = (nData as any[]) || []
  }

  let grupoOrganograma = 'Sindicato'
  let grupoHref = '/paginas/historia'
  if (
    slugNormalizado.startsWith('colonia') ||
    slugNormalizado === 'convenios' ||
    slugNormalizado === 'carteirinha' ||
    slugNormalizado === 'atualizar-cadastro'
  ) {
    grupoOrganograma = 'Serviços'
    grupoHref = '/paginas/colonia'
  } else if (
    slugNormalizado === 'cct' ||
    slugNormalizado === 'juridico' ||
    slugNormalizado === 'processos' ||
    slugNormalizado === 'homologacoes' ||
    slugNormalizado === 'denuncia'
  ) {
    grupoOrganograma = 'Jurídico'
    grupoHref = '/paginas/cct'
  } else if (
    slugNormalizado === 'lista-noticias' ||
    slugNormalizado === 'cadastro-noticias' ||
    slugNormalizado === 'noticias' ||
    slugNormalizado === 'jornais'
  ) {
    grupoOrganograma = 'Imprensa'
    grupoHref = '/noticias'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F5F6',
        display: 'flex',
        flexDirection: 'column',
        color: '#1A1417',
        fontFamily: 'var(--font-barlow), sans-serif',
      }}
    >
      <HeaderPublico slugAtivo={slugNormalizado} />

      {/* ── FAIXA HERO DE IMPACTO SINDICAL BORDÔ (PROPOSTA B) ── */}
      <section
        className="pagina-hero-section"
        style={{
          background: '#48101E',
          color: '#FFFFFF',
          borderBottom: '4px solid #861E32',
          padding: isColonia ? '24px 0 0 0' : '24px 0 26px 0',
        }}
      >
        <div style={CONTAINER_STYLE}>
          {/* Breadcrumb limpo */}
          <nav
            className="pagina-breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#E4DCE0',
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ color: '#E4DCE0', textDecoration: 'none' }} className="breadcrumb-link">
              Início
            </Link>
            <span style={{ opacity: 0.45 }}>›</span>
            <Link
              href={grupoHref}
              style={{ color: '#FFB8C5', textDecoration: 'none', fontWeight: 700 }}
              className="breadcrumb-link"
            >
              {grupoOrganograma}
            </Link>
            <span style={{ opacity: 0.45 }}>›</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{pagina.titulo}</span>
          </nav>

          {/* Chapéu em Barlow Condensed */}
          {pagina.chapeu && (
            <div
              className="pagina-hero-chapeu"
              style={{
                fontFamily: 'var(--font-condensed), sans-serif',
                color: '#FFB8C5',
                fontSize: '13.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              {pagina.chapeu}
            </div>
          )}

          {/* Título Principal em Barlow Condensed 800 Uppercase (Mesma força da Home e Notícias) */}
          <h1
            className="pagina-hero-titulo"
            style={{
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: 1.06,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.4px',
            }}
          >
            {pagina.titulo}
          </h1>

          {/* Subtítulo objetivo */}
          {pagina.subtitulo && (
            <div
              className="pagina-hero-subtitulo"
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16.5px',
                lineHeight: 1.5,
                color: '#F6E7EC',
                marginTop: '10px',
                maxWidth: '880px',
              }}
            >
              {pagina.subtitulo}
            </div>
          )}

          {/* Barra de seções da Colônia integrada direto no bloco bordô (Sem seletores quadrados de IA) */}
          {isColonia && <ColoniaNav slugAtual={slugNormalizado} integradoHero />}
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="pagina-main" style={{ flex: 1, padding: '32px 0 64px 0' }}>
        <article style={CONTAINER_STYLE}>
          {/* Foto Principal com Preservação de Orientação Original */}
          {fotoPrincipal && tipoPagina !== 'gallery' && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  border: '1px solid #E4DCE0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={fotoPrincipal.url}
                  alt={pagina.titulo}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '520px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              {fotoPrincipal.legenda && (
                <div style={{ fontSize: '12.5px', color: '#71636a', marginTop: '6px', paddingLeft: '2px' }}>
                  {fotoPrincipal.legenda}
                  {fotoPrincipal.credito && ` • ${fotoPrincipal.credito}`}
                </div>
              )}
            </div>
          )}

          {/* Corpo do Texto Sanitizado */}
          {corpoFormatado && (
            <div
              className="pagina-conteudo"
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16.5px',
                lineHeight: 1.75,
                color: '#1A1417',
              }}
              dangerouslySetInnerHTML={{ __html: corpoFormatado }}
            />
          )}

          {/* ── 1. DIRETORIA ELEITA ── */}
          {tipoPagina === 'directors' && records.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              {['Executiva', 'Colegiado', 'Conselho Fiscal'].map((grupo) => {
                const membros = records.filter(
                  (r: any) =>
                    (r.group === grupo || (grupo === 'Colegiado' && r.group === 'Colegiada')) &&
                    r.active !== false
                )
                if (membros.length === 0) return null
                return (
                  <div key={grupo} style={{ marginBottom: '36px' }}>
                    <div
                      style={{
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '3px solid #65172A',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '26px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          color: '#65172A',
                          margin: 0,
                        }}
                      >
                        {grupo === 'Executiva'
                          ? 'Executiva'
                          : grupo === 'Conselho Fiscal'
                            ? 'Conselho Fiscal'
                            : 'Colegiado'}
                      </h2>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '14px',
                      }}
                    >
                      {membros.map((m: any) => (
                        <div
                          key={m.id || m.name}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E4DCE0',
                            borderTop: '3px solid #65172A',
                            borderRadius: '4px',
                            padding: '16px',
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '50%',
                              background: '#F0E8EA',
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '2px solid #861E32',
                            }}
                          >
                            {m.image ? (
                              <img
                                src={m.image}
                                alt={m.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontFamily: 'var(--font-condensed), sans-serif',
                                  fontWeight: 800,
                                  color: '#65172A',
                                  fontSize: '20px',
                                }}
                              >
                                {m.name ? m.name[0] : 'Q'}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong
                              style={{
                                fontFamily: 'var(--font-condensed), sans-serif',
                                fontSize: '18px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: '#1A1417',
                                display: 'block',
                                lineHeight: 1.15,
                              }}
                            >
                              {m.name}
                            </strong>
                            {m.company && (
                              <div style={{ fontSize: '13px', color: '#4F4248', fontWeight: 600, marginTop: '2px' }}>
                                {m.company}
                              </div>
                            )}
                            {m.role && (
                              <div
                                style={{
                                  fontFamily: 'var(--font-condensed), sans-serif',
                                  fontSize: '13px',
                                  color: '#861E32',
                                  fontWeight: 700,
                                  marginTop: '3px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                {m.role}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── 2. CONVÊNIOS ── */}
          {tipoPagina === 'partners' && records.length > 0 && (
            <ListaConveniosPublica conveniosIniciais={records} />
          )}

          {/* ── 3. CONTATOS E SEDES ── */}
          {tipoPagina === 'contacts' && slugNormalizado !== 'colonia-reservas' && records.length > 0 && (
            <div
              style={{
                marginTop: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px',
              }}
            >
              {records
                .filter((r: any) => r.active !== false)
                .map((s: any) => (
                  <div
                    key={s.id || s.name}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4DCE0',
                      borderTop: '4px solid #65172A',
                      borderRadius: '4px',
                      padding: '20px',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-condensed), sans-serif',
                        fontSize: '22px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#1A1417',
                        margin: '0 0 8px 0',
                        lineHeight: 1.15,
                      }}
                    >
                      {s.name}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#30252A', lineHeight: 1.6, display: 'grid', gap: '8px' }}>
                      {s.address && (
                        <div>
                          <a
                            href={
                              s.url ||
                              `https://maps.google.com/?q=${encodeURIComponent(`${s.name} ${s.address}`)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#30252A', textDecoration: 'none' }}
                          >
                            {s.address}{' '}
                            <span
                              style={{
                                fontFamily: 'var(--font-condensed), sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: '#861E32',
                                textDecoration: 'underline',
                              }}
                            >
                              Abrir mapa ↗
                            </span>
                          </a>
                        </div>
                      )}
                      {s.phone && (
                        <div>
                          <a
                            href={`tel:${s.phone.split('/')[0].replace(/[^\d+]/g, '')}`}
                            style={{
                              fontFamily: 'var(--font-condensed), sans-serif',
                              fontSize: '18px',
                              color: '#65172A',
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            {s.phone}
                          </a>
                        </div>
                      )}
                      {s.hours && (
                        <div style={{ fontSize: '13px', color: '#71636A' }}>{s.hours}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── 4. LINKS ÚTEIS ── */}
          {tipoPagina === 'links' && records.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records
                .filter((r: any) => r.active !== false)
                .map((l: any) => (
                  <div
                    key={l.id || l.name}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4DCE0',
                      borderLeft: '4px solid #65172A',
                      borderRadius: '4px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '19px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#1A1417',
                          display: 'block',
                        }}
                      >
                        {l.name}
                      </strong>
                      {l.description && (
                        <small style={{ fontSize: '13px', color: '#71636a' }}>{l.description}</small>
                      )}
                    </div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#861E32',
                        color: '#FFFFFF',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-condensed), sans-serif',
                        fontSize: '15px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Acessar ↗
                    </a>
                  </div>
                ))}
            </div>
          )}

          {/* ── 5.1 PROCESSOS COLETIVOS ── */}
          {tipoPagina === 'processes' && records.length > 0 && (
            <ListaProcessosPublica processosIniciais={records} />
          )}

          {/* ── 5.2 DOCUMENTOS / CCTs E PLANTÃO JURÍDICO ── */}
          {(tipoPagina === 'documents' || tipoPagina === 'hours') && records.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {records
                .filter((r: any) => r.active !== false)
                .map((item: any) => (
                  <div
                    key={item.id || item.name}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4DCE0',
                      borderLeft: '4px solid #65172A',
                      borderRadius: '4px',
                      padding: '18px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {item.specialty && (
                          <span
                            style={{
                              fontFamily: 'var(--font-condensed), sans-serif',
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#861E32',
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                            }}
                          >
                            {item.specialty} •
                          </span>
                        )}
                        <strong
                          style={{
                            fontFamily: 'var(--font-condensed), sans-serif',
                            fontSize: '21px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: '#1A1417',
                          }}
                        >
                          {item.name}
                        </strong>
                      </div>

                      {item.day && (
                        <div style={{ fontSize: '14.5px', color: '#30252A', marginTop: '4px' }}>
                          <strong>{item.day}</strong> • {item.hours}
                        </div>
                      )}

                      {item.schedules && Array.isArray(item.schedules) && (
                        <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                          {item.schedules.map((sch: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              style={{
                                fontSize: '14.5px',
                                color: '#1A1417',
                                background: '#FAF8F9',
                                border: '1px solid #E4DCE0',
                                borderRadius: '3px',
                                padding: '8px 14px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span>
                                <strong>{sch.day}</strong>, {sch.hours}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-condensed), sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  color: '#65172A',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                {sch.city}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {item.file && (
                      <a
                        href={item.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#861E32',
                          color: '#FFFFFF',
                          padding: '9px 18px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '15px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Download ↗</span>
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* ── 6. VALORES DA COLÔNIA DE FÉRIAS ── */}
          {tipoPagina === 'prices' && records.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {records
                  .filter((r: any) => r.active !== false)
                  .map((p: any) => (
                    <div
                      key={p.id || p.type}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E4DCE0',
                        borderTop: '4px solid #65172A',
                        borderRadius: '4px',
                        padding: '20px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-condensed), sans-serif',
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#861E32',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                          }}
                        >
                          {p.unit}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-condensed), sans-serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#4F4248',
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.public}
                        </span>
                      </div>
                      <strong
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '21px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#1A1417',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        {p.type}
                      </strong>
                      <div
                        style={{
                          fontFamily: 'var(--font-condensed), sans-serif',
                          fontSize: '30px',
                          fontWeight: 800,
                          color: '#65172A',
                          marginBottom: '6px',
                          lineHeight: 1.1,
                        }}
                      >
                        R$ {p.value?.toFixed(2).replace('.', ',')}{' '}
                        <small
                          style={{
                            fontFamily: 'var(--font-barlow), sans-serif',
                            fontSize: '13px',
                            color: '#71636A',
                            fontWeight: 500,
                          }}
                        >
                          {p.charge}
                        </small>
                      </div>
                      {p.capacity && (
                        <div style={{ fontSize: '13.5px', color: '#4F4248' }}>{p.capacity}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── 6.1 COMO CHEGAR (COLÔNIA) ── */}
          {tipoPagina === 'locations' && records.length > 0 && (
            <div
              style={{
                marginTop: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '18px',
              }}
            >
              {records.map((loc: any) => (
                <div
                  key={loc.name}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E4DCE0',
                    borderTop: '4px solid #65172A',
                    borderRadius: '4px',
                    padding: '22px',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '22px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#1A1417',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {loc.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#1A1417',
                      marginBottom: '12px',
                    }}
                  >
                    {loc.address}
                  </div>
                  {loc.description && (
                    <p
                      style={{
                        fontSize: '13.5px',
                        color: '#4F4248',
                        margin: '0 0 16px 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {loc.description}
                    </p>
                  )}
                  <a
                    href={
                      loc.url ||
                      `https://maps.google.com/?q=${encodeURIComponent(`${loc.name} ${loc.address}`)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#861E32',
                      color: '#FFFFFF',
                      padding: '9px 18px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-condensed), sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Abrir mapa ↗</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* ── 6.2 FOTOS DA COLÔNIA ── */}
          {tipoPagina === 'gallery' && records.length > 0 && (
            <GaleriaColoniaPublica fotos={records} />
          )}

          {/* ── 7. FORMULÁRIOS PÚBLICOS ── */}
          {slugNormalizado === 'fique-socio' && <FormularioSindicalizacao />}
          {slugNormalizado === 'carteirinha' && <FormularioCarteirinha />}
          {slugNormalizado === 'atualizar-cadastro' && <FormularioAtualizacao />}
          {slugNormalizado === 'denuncia' && <FormularioDenuncia />}
          {slugNormalizado === 'cadastro-noticias' && <FormularioCadastroNoticias />}
          {slugNormalizado === 'fale-conosco' && <FormularioFaleConosco />}

          {/* ── 8. LISTA DE NOTÍCIAS ── */}
          {slugNormalizado === 'lista-noticias' && (
            <div style={{ marginTop: '28px' }}>
              <ListaNoticiasPublica noticiasIniciais={noticiasParaLista} />
            </div>
          )}

          {/* Fotos adicionais (sem título redundante "Fotos complementares do acervo") */}
          {fotosGaleria.length > 0 && tipoPagina !== 'gallery' && (
            <div
              style={{
                marginTop: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {fotosGaleria.map((fg, idx) => (
                <div
                  key={fg.url}
                  style={{
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    border: '1px solid #E4DCE0',
                  }}
                >
                  <img
                    src={fg.url}
                    alt={fg.legenda || `${pagina.titulo} ${idx + 2}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '320px',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                  {fg.legenda && (
                    <div style={{ padding: '8px 10px', fontSize: '12px', color: '#71636a' }}>
                      {fg.legenda}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Documentos */}
          {documentos.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '2px solid #65172A', paddingTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentos.map((doc) => (
                  <div
                    key={doc.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      border: '1px solid #E4DCE0',
                      borderLeft: '4px solid #65172A',
                      borderRadius: '4px',
                      padding: '14px 20px',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-condensed), sans-serif',
                        fontWeight: 800,
                        fontSize: '18px',
                        textTransform: 'uppercase',
                        color: '#1A1417',
                      }}
                    >
                      {doc.nome}
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#861E32',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-condensed), sans-serif',
                        fontSize: '14px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                      }}
                    >
                      Download ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>{`
            .pagina-conteudo p { margin: 0 0 16px 0; }
            .pagina-conteudo h2 {
              font-family: var(--font-condensed), sans-serif;
              font-size: 28px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              color: #65172A;
              margin: 28px 0 14px 0;
              border-bottom: 2px solid #65172A;
              padding-bottom: 6px;
              line-height: 1.15;
            }
            .pagina-conteudo h3 {
              font-family: var(--font-condensed), sans-serif;
              font-size: 21px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              color: #1A1417;
              margin: 20px 0 8px 0;
              line-height: 1.2;
            }
            .pagina-conteudo blockquote {
              border-left: 4px solid #861E32;
              margin: 20px 0;
              padding: 12px 18px;
              background: #FAF6F7;
              color: #65172A;
              border-radius: 0 4px 4px 0;
            }
            .pagina-conteudo ul, .pagina-conteudo ol { padding-left: 22px; margin-bottom: 16px; }
            .pagina-conteudo li { margin-bottom: 7px; }
            .pagina-conteudo a { color: #861E32; text-decoration: underline; font-weight: 600; }
            .pagina-conteudo img { max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 4px; }
            
            .pagina-conteudo table {
              display: block;
              width: 100%;
              max-width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14.5px;
              background: #ffffff;
            }
            .pagina-conteudo th, .pagina-conteudo td {
              border: 1px solid #E4DCE0;
              padding: 11px 14px;
              text-align: left;
              min-width: 120px;
            }
            .pagina-conteudo th {
              background: #65172A;
              font-family: var(--font-condensed), sans-serif;
              font-size: 15px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #FFFFFF;
            }

            .pagina-conteudo .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 20px 0; border-radius: 4px; overflow: hidden; background: #000; }
            .pagina-conteudo .iframe-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
            .breadcrumb-link:hover { text-decoration: underline !important; }

            @media (max-width: 768px) {
              .pagina-breadcrumb {
                display: none !important;
              }
              .pagina-hero-section {
                padding: 18px 0 0 0 !important;
              }
              .pagina-hero-titulo {
                font-size: 30px !important;
                line-height: 1.1 !important;
                margin-bottom: 6px !important;
              }
              .pagina-hero-subtitulo {
                font-size: 15px !important;
                line-height: 1.45 !important;
                margin-top: 8px !important;
                padding-bottom: 16px !important;
              }
              .pagina-main {
                padding: 20px 0 48px 0 !important;
              }
              .pagina-conteudo {
                font-size: 16px !important;
                line-height: 1.65 !important;
              }
              .pagina-conteudo h2 {
                font-size: 23px !important;
              }
              .pagina-conteudo h3 {
                font-size: 18px !important;
              }
            }
          `}</style>
        </article>
      </main>

      <FooterPublico />
    </div>
  )
}
