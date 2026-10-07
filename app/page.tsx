import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'

export const dynamic = 'force-dynamic'

interface NoticiaDestaque {
  id: string
  titulo: string
  slug: string
  resumo?: string | null
  chapeu?: string | null
  banner_url?: string | null
  imagem_y?: number | null
  publicado_em?: string | null
  fotos_json?: string | null
}

interface EdicaoRecente {
  id: string
  numero: string | number
  mes_ano: string
  capa_url?: string | null
  pdf_url?: string | null
  publicacoes_jornal?: { nome: string } | null
}

function formatarData(dataIso?: string | null): string {
  if (!dataIso) return ''
  try {
    const d = new Date(dataIso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Busca até 4 notícias em destaque publicadas
  const { data: noticiasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('destaque', { ascending: false })
    .order('publicado_em', { ascending: false })
    .limit(4)

  const noticias: NoticiaDestaque[] = (noticiasData as any[]) || []

  // 2. Busca a edição mais recente publicada do jornal
  const { data: edicaoData } = await supabase
    .from('edicoes_jornal')
    .select('id, numero, mes_ano, capa_url, pdf_url, publicacoes_jornal (nome)')
    .eq('status', 'publicado')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ultimaEdicao: EdicaoRecente | null = (edicaoData as any) || null

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', color: '#30252a', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="/" />

      {/* ── FAIXA DE ATALHOS RÁPIDOS (SERVIÇOS AO TRABALHADOR) ── */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid #e4dce0', padding: '18px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            
            {/* 1. Filie-se */}
            <Link
              href="/paginas/fique-socio"
              style={{
                background: '#861e32',
                color: '#ffffff',
                padding: '16px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 4px 12px rgba(134,30,50,0.22)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="service-card"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', lineHeight: 1.2 }}>Fique Sócio</strong>
                <small style={{ fontSize: '12px', opacity: 0.9 }}>Filie-se online ao sindicato</small>
              </div>
            </Link>

            {/* 2. Canal de Denúncias */}
            <Link
              href="/paginas/denuncia"
              style={{
                background: '#30252a',
                color: '#ffffff',
                padding: '16px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 4px 12px rgba(48,37,42,0.18)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="service-card"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', lineHeight: 1.2 }}>Canal de Denúncias</strong>
                <small style={{ fontSize: '12px', opacity: 0.85 }}>Sigiloso e anônimo</small>
              </div>
            </Link>

            {/* 3. Colônia de Férias */}
            <Link
              href="/paginas/colonia"
              style={{
                background: '#ffffff',
                color: '#30252a',
                border: '1px solid #cbd7de',
                padding: '16px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              className="service-card-light"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: '#f8f2f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', lineHeight: 1.2 }}>Colônia de Férias</strong>
                <small style={{ fontSize: '12px', color: '#71636a' }}>Caraguá e São Sebastião</small>
              </div>
            </Link>

            {/* 4. Plantão Jurídico */}
            <Link
              href="/paginas/juridico"
              style={{
                background: '#ffffff',
                color: '#30252a',
                border: '1px solid #cbd7de',
                padding: '16px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              className="service-card-light"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: '#f8f2f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', lineHeight: 1.2 }}>Plantão Jurídico</strong>
                <small style={{ fontSize: '12px', color: '#71636a' }}>Defesa e assessoria trabalhista</small>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (NOTÍCIAS E JORNAIS) ── */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 20px', flex: 1, boxSizing: 'border-box' }}>
        
        {/* Título da Seção */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '26px', borderBottom: '2px solid #861e32', paddingBottom: '10px' }}>
          <div>
            <span style={{ color: '#861e32', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Imprensa & Comunicação
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
              Notícias da Categoria
            </h2>
          </div>
          <Link href="/noticias" style={{ fontSize: '13.5px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }} className="ver-todas-link">
            Ver arquivo completo de notícias →
          </Link>
        </div>

        {/* GRADE DE NOTÍCIAS */}
        {noticias.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '10px', padding: '48px', textAlign: 'center', color: '#71636a' }}>
            Nenhuma notícia publicada no momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '44px' }}>
            {noticias.map((item) => {
              let fotoUrl = item.banner_url
              let focoY = item.imagem_y ?? 50
              if (item.fotos_json) {
                try {
                  const arr = JSON.parse(item.fotos_json)
                  if (arr[0]?.url) {
                    fotoUrl = arr[0].url
                    focoY = arr[0].foco ?? focoY
                  }
                } catch {}
              }

              return (
                <Link
                  key={item.id}
                  href={`/noticias/${item.slug}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4dce0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                  className="news-card"
                >
                  {/* Imagem Proporção 3:2 Preservada */}
                  <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#f5f0f2', overflow: 'hidden', position: 'relative' }}>
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={item.titulo}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${focoY}%`,
                          display: 'block',
                          transition: 'transform 0.25s ease',
                        }}
                        className="news-card-img"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#861e32', fontWeight: 800, fontSize: '18px', background: '#f8f2f4' }}>
                        Sindicato dos Químicos
                      </div>
                    )}
                    {item.chapeu && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#861e32',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }}
                      >
                        {item.chapeu}
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {item.publicado_em && (
                        <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <span>{formatarData(item.publicado_em)}</span>
                        </div>
                      )}
                      <h3 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.35, color: '#30252a', margin: '0 0 8px 0' }}>
                        {item.titulo}
                      </h3>
                      {item.resumo && (
                        <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#65575e', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.resumo}
                        </p>
                      )}
                    </div>

                    <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: 700, color: '#861e32', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Ler matéria completa</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── SEÇÃO INFERIOR: JORNAL IMPRESSO & CONVÊNIOS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Card Boca no Trombone */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4dce0',
              borderRadius: '10px',
              padding: '24px 26px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '116px',
                background: '#65172A',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
              }}
            >
              {ultimaEdicao?.capa_url ? (
                <img src={ultimaEdicao.capa_url} alt="Capa Jornal Boca no Trombone" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              )}
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Jornal Oficial
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 4px 0', color: '#30252a' }}>
                Boca no Trombone
              </h3>
              <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {ultimaEdicao ? `Edição nº ${ultimaEdicao.numero} (${ultimaEdicao.mes_ano})` : 'Acompanhe a voz e as lutas dos trabalhadores químicos.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {ultimaEdicao?.pdf_url && (
                  <a
                    href={ultimaEdicao.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#861e32',
                      color: '#fff',
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Baixar PDF ↗
                  </a>
                )}
                <Link
                  href="/jornais"
                  style={{
                    border: '1px solid #cbd7de',
                    background: '#f8fafb',
                    color: '#30252a',
                    padding: '7px 14px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Todas as Edições
                </Link>
              </div>
            </div>
          </div>

          {/* Card Convênios e Benefícios */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4dce0',
              borderRadius: '10px',
              padding: '24px 26px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '116px',
                background: '#f8f2f4',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #e4dce0',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Vantagens do Associado
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 4px 0', color: '#30252a' }}>
                Guia de Convênios
              </h3>
              <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                Mais de 30 parceiros em saúde, faculdades, academias e lazer com descontos exclusivos para sócios e dependentes.
              </p>
              <Link
                href="/paginas/convenios"
                style={{
                  background: '#861e32',
                  color: '#fff',
                  padding: '7px 16px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Consultar Convênios →
              </Link>
            </div>
          </div>

        </div>

      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

      <style>{`
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.18) !important;
        }
        .service-card-light:hover {
          transform: translateY(-2px);
          border-color: #861e32 !important;
        }
        .news-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(48,37,42,0.08) !important;
          border-color: #cbd7de !important;
        }
        .news-card:hover .news-card-img {
          transform: scale(1.03);
        }
        .ver-todas-link:hover {
          text-decoration: underline !important;
        }
      `}</style>

    </div>
  )
}
