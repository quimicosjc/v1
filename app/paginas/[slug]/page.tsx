import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FormularioSindicalizacao from '@/components/publico/FormularioSindicalizacao'
import FormularioCarteirinha from '@/components/publico/FormularioCarteirinha'
import FormularioAtualizacao from '@/components/publico/FormularioAtualizacao'
import FormularioDenuncia from '@/components/publico/FormularioDenuncia'
import FormularioCadastroNoticias from '@/components/publico/FormularioCadastroNoticias'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import ColoniaNav from '@/components/publico/ColoniaNav'
import ListaNoticiasPublica, { type NoticiaItemPublico } from '@/components/publico/ListaNoticiasPublica'

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

export default async function PaginaInstitucionalPublica({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pagina } = await supabase
    .from('conteudos')
    .select('*')
    .eq('slug', slug)
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

  // Se fotos estiver vazio mas houver banner_url, usa como primeira foto
  if (fotos.length === 0 && pagina.banner_url) {
    fotos = [{ url: pagina.banner_url, foco: pagina.imagem_y ?? 50 }]
  }

  const fotoPrincipal = fotos.length > 0 ? fotos[0] : null
  const fotosGaleria = fotos.length > 1 ? fotos.slice(1) : []

  // Parse de documentos
  let documentos: DocumentoItem[] = []
  if (pagina.documentos_json) {
    try {
      documentos = JSON.parse(pagina.documentos_json) as DocumentoItem[]
    } catch {
      documentos = []
    }
  }

  // Parse de tags / dados estruturados adicionais
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

  // Recupera tags de iframe reais caso tenham sido salvas como texto escapado
  const corpoFormatado = (pagina.corpo || '')
    .replace(/&lt;iframe([\s\S]*?)&gt;&lt;\/iframe&gt;/gi, '<iframe$1></iframe>')
    .replace(/&lt;iframe([\s\S]*?)\/&gt;/gi, '<iframe$1></iframe>')

  const records = dadosEstruturados?.records || []
  const tipoPagina = dadosEstruturados?.tipoPagina || ''

  // Se for a página de lista de notícias, busca todas as notícias publicadas para exibir o índice
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

  // Mapeamento de pilar do Organograma para o Breadcrumb
  let grupoOrganograma = 'Sindicato'
  let grupoHref = '/paginas/historia'
  if (slug.startsWith('colonia') || slug === 'convenios' || slug === 'carteirinha' || slug === 'atualizar-cadastro') {
    grupoOrganograma = 'Serviços'
    grupoHref = '/paginas/colonia'
  } else if (slug === 'cct' || slug === 'juridico' || slug === 'processos' || slug === 'homologacao' || slug === 'denuncia') {
    grupoOrganograma = 'Jurídico'
    grupoHref = '/paginas/cct'
  } else if (slug === 'lista-noticias' || slug === 'cadastro-noticias' || slug === 'noticias' || slug === 'jornais') {
    grupoOrganograma = 'Imprensa'
    grupoHref = '/noticias'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', display: 'flex', flexDirection: 'column', color: '#30252a' }}>
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo={slug} />

      {/* ── FAIXA HERO INSTITUCIONAL COM BREADCRUMB ── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e4dce0',
          padding: '28px 20px 32px 20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Breadcrumb navegável */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#71636a',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ color: '#71636a', textDecoration: 'none' }} className="breadcrumb-link">
              Início
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={grupoHref} style={{ color: '#861e32', textDecoration: 'none', fontWeight: 600 }} className="breadcrumb-link">
              {grupoOrganograma}
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#30252a', fontWeight: 600 }}>{pagina.titulo}</span>
          </nav>

          {/* Chapéu / Assunto */}
          {pagina.chapeu && (
            <div
              style={{
                color: '#861e32',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              {pagina.chapeu}
            </div>
          )}

          {/* Título Principal */}
          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#30252a',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px',
            }}
          >
            {pagina.titulo}
          </h1>

          {/* Subtítulo / Lead */}
          {pagina.subtitulo && (
            <div
              style={{
                fontSize: '17px',
                lineHeight: 1.6,
                color: '#65575e',
                borderLeft: '3px solid #861e32',
                paddingLeft: '14px',
                marginTop: '14px',
              }}
            >
              {pagina.subtitulo}
            </div>
          )}
        </div>
      </section>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <article
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4dce0',
            boxShadow: '0 4px 16px rgba(48,37,42,0.04)',
            padding: '38px 44px',
          }}
        >
          {/* Navegação por Abas das Subpáginas da Colônia de Férias */}
          <ColoniaNav slugAtual={slug} />

          {/* Foto Principal com Preservação de Orientação Original (Regra de Ouro) */}
          {fotoPrincipal && (
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  width: '100%',
                  maxHeight: '520px',
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
                <div style={{ fontSize: '12.5px', color: '#71636a', marginTop: '8px', fontStyle: 'italic', paddingLeft: '4px' }}>
                  {fotoPrincipal.legenda}
                  {fotoPrincipal.credito && ` • Foto: ${fotoPrincipal.credito}`}
                </div>
              )}
            </div>
          )}

          {/* Corpo do Texto Sanitizado */}
          {corpoFormatado && (
            <div
              className="pagina-conteudo"
              style={{
                fontSize: '16.5px',
                lineHeight: 1.8,
                color: '#30252a',
                marginTop: '16px',
              }}
              dangerouslySetInnerHTML={{ __html: corpoFormatado }}
            />
          )}

          {/* ── SEÇÃO DE DADOS ESTRUTURADOS INSTITUCIONAIS ── */}

          {/* 1. DIRETORIA ELEITA */}
          {tipoPagina === 'directors' && records.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              {['Executiva', 'Colegiado', 'Conselho Fiscal'].map((grupo) => {
                const membros = records.filter((r: any) => (r.group === grupo || (grupo === 'Colegiado' && r.group === 'Colegiada')) && r.active !== false)
                if (membros.length === 0) return null
                return (
                  <div key={grupo} style={{ marginBottom: '36px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '18px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #861e32',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
                        {grupo === 'Executiva' ? 'Diretoria Executiva' : grupo === 'Conselho Fiscal' ? 'Conselho Fiscal' : 'Diretoria Colegiada / Base'}
                      </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                      {membros.map((m: any) => (
                        <div
                          key={m.id || m.name}
                          style={{
                            background: '#fcfbfa',
                            border: '1px solid #e4dce0',
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              background: '#f0e8ea',
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '2px solid #861e32',
                            }}
                          >
                            {m.image ? (
                              <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#861e32', fontSize: '18px' }}>
                                {m.name ? m.name[0] : 'Q'}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '14px', color: '#30252a', display: 'block', lineHeight: 1.25 }}>
                              {m.name}
                            </strong>
                            <div style={{ fontSize: '12px', color: '#71636a', marginTop: '3px' }}>
                              Empresa: <strong>{m.company || 'Químicos'}</strong>
                            </div>
                            {m.role && (
                              <div style={{ fontSize: '11px', color: '#861e32', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>
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

          {/* 2. CONVÊNIOS E BENEFÍCIOS */}
          {tipoPagina === 'partners' && records.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                {records.filter((r: any) => r.active !== false).map((c: any) => (
                  <div
                    key={c.id || c.name}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e4dce0',
                      borderRadius: '8px',
                      padding: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#861e32',
                            background: '#f8f2f4',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {c.kind}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#71636a' }}>{c.city}</span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 6px 0' }}>
                        {c.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#52434a', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                        {c.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #f0e8ea', paddingTop: '10px', fontSize: '12px', color: '#71636a', display: 'grid', gap: '4px' }}>
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>{c.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. CONTATOS E SEDES */}
          {tipoPagina === 'contacts' && records.length > 0 && (
            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {records.filter((r: any) => r.active !== false).map((s: any) => (
                <div
                  key={s.id || s.name}
                  style={{
                    background: '#fcfbfa',
                    border: '1px solid #e4dce0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
                    {s.name}
                  </h3>
                  {s.description && (
                    <p style={{ fontSize: '13px', color: '#861e32', margin: '0 0 12px 0', fontWeight: 600 }}>
                      {s.description}
                    </p>
                  )}
                  <div style={{ fontSize: '13px', color: '#4a3f45', lineHeight: 1.7, display: 'grid', gap: '6px' }}>
                    {s.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '3px', flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span><strong>Endereço:</strong> {s.address}</span>
                      </div>
                    )}
                    {s.hours && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '3px', flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span><strong>Horário:</strong> {s.hours}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span><strong>Telefone:</strong> {s.phone}</span>
                      </div>
                    )}
                    {s.whatsapp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                        <span><strong>WhatsApp:</strong> {s.whatsapp}</span>
                      </div>
                    )}
                    {s.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span><strong>E-mail:</strong> {s.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. LINKS ÚTEIS */}
          {tipoPagina === 'links' && records.length > 0 && (
            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {records.filter((r: any) => r.active !== false).map((l: any) => (
                <div
                  key={l.id || l.name}
                  style={{
                    background: '#fcfbfa',
                    border: '1px solid #e4dce0',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '15px', color: '#30252a', display: 'block' }}>{l.name}</strong>
                    {l.description && <small style={{ fontSize: '12.5px', color: '#71636a' }}>{l.description}</small>}
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#861e32',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
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

          {/* 5. CCTs E PROCESSOS COLETIVOS */}
          {(tipoPagina === 'documents' || tipoPagina === 'processes' || tipoPagina === 'hours') && records.length > 0 && (
            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {records.filter((r: any) => r.active !== false).map((item: any) => (
                <div
                  key={item.id || item.name}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4dce0',
                    borderRadius: '8px',
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <strong style={{ fontSize: '15.5px', color: '#30252a', display: 'block' }}>{item.name}</strong>
                    {item.company && (
                      <div style={{ fontSize: '13px', color: '#52434a', marginTop: '2px' }}>
                        Empresa / Categoria: <strong>{item.company}</strong>
                      </div>
                    )}
                    {item.number && (
                      <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>
                        Vara / Processo TRT: {item.number}
                      </div>
                    )}
                    {item.day && (
                      <div style={{ fontSize: '13px', color: '#52434a', marginTop: '2px' }}>
                        Plantão: {item.day} • {item.hours}
                      </div>
                    )}
                    {item.validity && (
                      <div style={{ fontSize: '12px', color: '#861e32', fontWeight: 600, marginTop: '2px' }}>
                        Vigência: {item.validity}
                      </div>
                    )}
                  </div>
                  {item.file && (
                    <a
                      href={item.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#861e32',
                        color: '#ffffff',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>Abrir Documento ↗</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 6. TABELA DE PREÇOS DA COLÔNIA DE FÉRIAS */}
          {tipoPagina === 'prices' && records.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {records.filter((r: any) => r.active !== false).map((p: any) => (
                  <div
                    key={p.id || p.type}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e4dce0',
                      borderRadius: '8px',
                      padding: '20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      borderTop: '4px solid #861e32',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase' }}>
                        {p.unit}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#71636a' }}>{p.public}</span>
                    </div>
                    <strong style={{ fontSize: '16px', color: '#30252a', display: 'block', marginBottom: '6px' }}>
                      {p.type}
                    </strong>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#861e32', marginBottom: '8px' }}>
                      R$ {p.value?.toFixed(2).replace('.', ',')}{' '}
                      <small style={{ fontSize: '12px', color: '#71636a', fontWeight: 500 }}>
                        / {p.charge}
                      </small>
                    </div>
                    {p.capacity && (
                      <div style={{ fontSize: '12.5px', color: '#52434a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                        <span>Capacidade: {p.capacity}</span>
                      </div>
                    )}
                    {p.notes && (
                      <p style={{ fontSize: '12px', color: '#71636a', marginTop: '8px', lineHeight: 1.4, borderTop: '1px solid #f0e8ea', paddingTop: '8px' }}>
                        {p.notes}
                      </p>
                    )}
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

          {/* 8. ÍNDICE DINÂMICO DE NOTÍCIAS */}
          {slug === 'lista-noticias' && (
            <div style={{ marginTop: '36px' }}>
              <ListaNoticiasPublica noticiasIniciais={noticiasParaLista} />
            </div>
          )}

          {/* Galeria de Fotos Adicionais (se houver) */}
          {fotosGaleria.length > 0 && (
            <div style={{ marginTop: '40px', borderTop: '1px solid #e4dce0', paddingTop: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#30252a', marginBottom: '16px' }}>
                Fotos complementares do acervo
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '14px',
                }}
              >
                {fotosGaleria.map((fg, idx) => (
                  <div
                    key={fg.url}
                    style={{
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: '#f8fafb',
                      border: '1px solid #e4dce0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <img
                      src={fg.url}
                      alt={`Foto complementar ${idx + 2}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '320px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                    {fg.legenda && (
                      <div style={{ padding: '8px 10px', fontSize: '12px', color: '#71636a', fontStyle: 'italic' }}>
                        {fg.legenda}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos Anexos */}
          {documentos.length > 0 && (
            <div style={{ marginTop: '40px', borderTop: '1px solid #e4dce0', paddingTop: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#30252a', marginBottom: '16px' }}>
                Documentos e Anexos Oficiais
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentos.map((doc) => (
                  <div
                    key={doc.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#fcfbfa',
                      border: '1px solid #cbd7de',
                      borderRadius: '8px',
                      padding: '14px 20px',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: '#f8f2f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#30252a' }}>
                          {doc.nome}
                        </div>
                        <small style={{ color: '#71636a', textTransform: 'uppercase', fontSize: '11px' }}>
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
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {doc.tipo === 'pdf' ? 'Visualizar PDF ↗' : 'Baixar Arquivo ⤓'}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estilos para elementos internos renderizados do RichEditor */}
          <style>{`
            .pagina-conteudo p { margin: 0 0 18px 0; }
            .pagina-conteudo h2 { font-size: 24px; font-weight: 800; color: #30252a; margin: 32px 0 14px 0; border-bottom: 1px solid #f0e8ea; padding-bottom: 6px; }
            .pagina-conteudo h3 { font-size: 19px; font-weight: 700; color: #30252a; margin: 24px 0 10px 0; }
            .pagina-conteudo blockquote { border-left: 4px solid #861e32; margin: 24px 0; padding: 12px 18px; background: #faf6f7; color: #65172a; font-style: italic; border-radius: 0 6px 6px 0; }
            .pagina-conteudo ul, .pagina-conteudo ol { padding-left: 24px; margin-bottom: 18px; }
            .pagina-conteudo li { margin-bottom: 8px; }
            .pagina-conteudo a { color: #861e32; text-decoration: underline; font-weight: 600; }
            .pagina-conteudo img { max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .pagina-conteudo table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14.5px; }
            .pagina-conteudo th, .pagina-conteudo td { border: 1px solid #cbd7de; padding: 12px 16px; text-align: left; }
            .pagina-conteudo th { background: #f8fafb; font-weight: 700; color: #30252a; }
            .pagina-conteudo .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 24px 0; border-radius: 8px; overflow: hidden; background: #000; }
            .pagina-conteudo .iframe-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
            .breadcrumb-link:hover { text-decoration: underline !important; color: #861e32 !important; }
          `}</style>
        </article>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />
    </div>
  )
}
