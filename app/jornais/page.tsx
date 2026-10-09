import Link from 'next/link'
import { Metadata } from 'next'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import { CONTAINER_STYLE } from '@/lib/design'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Jornais e Informativos · Sindicato dos Químicos SJC',
  description: 'Acervo digital do jornal Boca no Trombone e outros informativos do Sindicato dos Químicos de São José dos Campos e Região.',
}

interface EdicaoItem {
  id: string
  numero: string | number
  mes_ano: string
  capa_url?: string | null
  pdf_url?: string | null
  data_publicacao?: string | null
  criado_em: string
  publicacoes_jornal?: { nome: string } | null
}

export default async function JornaisPublicosPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: edicoesData } = await supabaseAdmin
    .from('edicoes_jornal')
    .select(`
      id,
      numero,
      mes_ano,
      capa_url,
      pdf_url,
      data_publicacao,
      criado_em,
      publicacoes_jornal (
        nome
      )
    `)
    .eq('status', 'publicado')
    .order('data_publicacao', { ascending: false })
    .order('numero', { ascending: false })

  const edicoesRaw: EdicaoItem[] = (edicoesData as any[]) || []
  const edicoes = [...edicoesRaw].sort((a, b) => {
    const nomeA = a.publicacoes_jornal?.nome?.toLowerCase() || ''
    const nomeB = b.publicacoes_jornal?.nome?.toLowerCase() || ''
    const isBocaA = nomeA.includes('boca no trombone') || !nomeA
    const isBocaB = nomeB.includes('boca no trombone') || !nomeB
    if (isBocaA && !isBocaB) return -1
    if (!isBocaA && isBocaB) return 1
    const numA = parseInt(String(a.numero).replace(/\D/g, '')) || 0
    const numB = parseInt(String(b.numero).replace(/\D/g, '')) || 0
    return numB - numA
  })
  const edicaoDestaque = edicoes[0] || null
  const edicoesAnteriores = edicoes.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1417', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="jornais" />

      {/* ── FAIXA HERO INSTITUCIONAL COM BREADCRUMB ── */}
      <section
        style={{
          background: '#faf8f9',
          borderBottom: '1px solid #ebdbe0',
          padding: '24px 0 28px 0',
        }}
      >
        <div style={CONTAINER_STYLE}>
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
            <span style={{ color: '#861e32', fontWeight: 600 }}>Jornais & Informativos</span>
          </nav>

          {/* Título Principal */}
          <h1
            style={{
              fontFamily: 'var(--font-condensed), sans-serif',
              fontSize: '38px',
              fontWeight: 800,
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: '#30252a',
              margin: '0 0 12px 0',
              letterSpacing: '0.4px',
            }}
          >
            Jornal Boca no Trombone & Informativos
          </h1>

          <p style={{ fontSize: '16px', color: '#65575e', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
            Acesse e faça o download de todas as edições impressas e digitais do nosso jornal da categoria. Acompanhe as campanhas salariais, lutas operárias e conquistas históricas.
          </p>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 0 60px 0' }}>
        <div style={CONTAINER_STYLE}>
          
          {/* ── DESTAQUE DA EDIÇÃO MAIS RECENTE ── */}
          {edicaoDestaque && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #ebdbe0',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 18px rgba(48,37,42,0.06)',
                marginBottom: '44px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              }}
            >
              {/* Capa com destaque e contraste */}
              <div
                style={{
                  background: '#24141A',
                  padding: '32px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    maxWidth: '260px',
                    width: '100%',
                    aspectRatio: '1 / 1.42',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  {edicaoDestaque.capa_url && (
                    <img
                      src={edicaoDestaque.capa_url}
                      alt={`Capa ${edicaoDestaque.numero}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                </div>
              </div>

              {/* Informações da última edição */}
              <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e9f3ef',
                    color: '#23634e',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                    alignSelf: 'flex-start',
                  }}
                >
                  <span>●</span>
                  <span>Última Edição Disponível</span>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-condensed), sans-serif',
                    fontSize: '32px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#30252a',
                    margin: '0 0 10px 0',
                    lineHeight: 1.15,
                  }}
                >
                  {edicaoDestaque.publicacoes_jornal?.nome || 'Boca no Trombone'} — Edição nº {edicaoDestaque.numero}
                </h2>

                <div style={{ fontSize: '14px', color: '#71636a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Publicação: <strong>{edicaoDestaque.mes_ano || 'Edição Oficial'}</strong></span>
                </div>

                <p style={{ fontSize: '15px', color: '#554950', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                  Confira na íntegra a edição mais recente do informativo oficial do Sindicato dos Químicos de São José dos Campos e Região. Destaque para as lutas nas fábricas, negociações salariais e denúncias da categoria.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {edicaoDestaque.pdf_url && (
                    <a
                      href={edicaoDestaque.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        background: '#861e32',
                        color: '#ffffff',
                        padding: '12px 22px',
                        borderRadius: '5px',
                        fontSize: '14px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="12" y2="18" />
                        <line x1="15" y1="15" x2="12" y2="18" />
                      </svg>
                      <span>Baixar PDF Completo</span>
                    </a>
                  )}

                  {edicaoDestaque.pdf_url && (
                    <a
                      href={edicaoDestaque.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd7de',
                        color: '#30252a',
                        padding: '12px 18px',
                        borderRadius: '5px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Visualizar no navegador ↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CABEÇALHO DO ACERVO DE EDIÇÕES ANTERIORES ── */}
          {edicoesAnteriores.length > 0 && (
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '4px',
                  height: '22px',
                  background: '#861e32',
                  display: 'inline-block',
                  borderRadius: '2px',
                }}
              />
              <h2
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '24px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#30252a',
                  margin: 0,
                  letterSpacing: '0.4px',
                }}
              >
                Edições Anteriores & Acervo Histórico
              </h2>
            </div>
          )}

          {/* Grid de Edições Anteriores */}
          {edicoes.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#71636a' }}>
              Nenhuma edição publicada no momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '22px' }}>
              {edicoesAnteriores.map((ed) => {
                const pubNome = ed.publicacoes_jornal?.nome || 'Boca no Trombone'
                return (
                  <div
                    key={ed.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e4dce0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    className="news-card-hover"
                  >
                    {/* Capa preservada em proporção vertical física 1:1.42 */}
                    <div style={{ aspectRatio: '1 / 1.42', background: '#24141A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {ed.capa_url ? (
                        <img src={ed.capa_url} alt={`Capa ${pubNome} nº ${ed.numero}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#ffffff', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                            <path d="M18 14h-8" />
                            <path d="M15 18h-5" />
                            <path d="M10 6h8v4h-8V6Z" />
                          </svg>
                          <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{pubNome}</strong>
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#861e32',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Edição nº {ed.numero}
                      </span>
                    </div>

                    {/* Dados e Botão */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71636a', marginBottom: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{ed.mes_ano || 'Edição Regular'}</span>
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30252a', margin: '0 0 8px 0' }}>
                          {pubNome} — Edição nº {ed.numero}
                        </h3>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        {ed.pdf_url ? (
                          <a
                            href={ed.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#861e32',
                              color: '#ffffff',
                              padding: '10px 18px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="12" y1="18" x2="12" y2="12" />
                              <line x1="9" y1="15" x2="12" y2="18" />
                              <line x1="15" y1="15" x2="12" y2="18" />
                            </svg>
                            Abrir Jornal em PDF ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#71636a', textAlign: 'center' }}>
                            PDF não disponível
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

    </div>
  )
}
