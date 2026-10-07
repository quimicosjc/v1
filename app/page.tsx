import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import { formatarDataExtenso } from '@/lib/data-formatada'

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

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Busca configurações da homepage (Modelo A ou Modelo B)
  let modeloNoticias: 'A' | 'B' = 'A'
  try {
    const { data: configData } = await supabase
      .from('site_config')
      .select('valor')
      .eq('chave', 'homepage')
      .maybeSingle()

    if (configData?.valor?.model === 'B') {
      modeloNoticias = 'B'
    }
  } catch {}

  // 2. Busca até 4 notícias em destaque publicadas (Documento Mestre § 13.4 e § 13.5)
  const { data: noticiasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('destaque', { ascending: false })
    .order('publicado_em', { ascending: false })
    .limit(4)

  const noticias: NoticiaDestaque[] = (noticiasData as any[]) || []

  // 3. Busca a edição mais recente publicada do jornal
  const { data: edicaoData } = await supabase
    .from('edicoes_jornal')
    .select('id, numero, mes_ano, capa_url, pdf_url, publicacoes_jornal (nome)')
    .eq('status', 'publicado')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ultimaEdicao: EdicaoRecente | null = (edicaoData as any) || null

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1417', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="/" />

      {/* ── RÉGUA HORIZONTAL DE ATALHOS DE SERVIÇO (DESIGN LIMPO, SEM CARTÕES PESADOS) ── */}
      <section style={{ background: '#faf8f9', borderBottom: '1px solid #ebdbe0', padding: '10px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '8px',
            }}
          >
            {/* 1. Fique Sócio */}
            <Link
              href="/paginas/fique-socio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2, color: '#861e32' }}>Fique Sócio</strong>
                <small style={{ fontSize: '11.5px', color: '#71636a' }}>Filie-se online</small>
              </div>
            </Link>

            {/* 2. Canal de Denúncias */}
            <Link
              href="/paginas/denuncia"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: '#f5f0f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30252a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2, color: '#30252a' }}>Canal de Denúncias</strong>
                <small style={{ fontSize: '11.5px', color: '#71636a' }}>Sigiloso e anônimo</small>
              </div>
            </Link>

            {/* 3. Colônia de Férias */}
            <Link
              href="/paginas/colonia"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2, color: '#1a1417' }}>Colônia de Férias</strong>
                <small style={{ fontSize: '11.5px', color: '#71636a' }}>Caraguá e S. Sebastião</small>
              </div>
            </Link>

            {/* 4. Plantão Jurídico */}
            <Link
              href="/paginas/juridico"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2, color: '#1a1417' }}>Plantão Jurídico</strong>
                <small style={{ fontSize: '11.5px', color: '#71636a' }}>Defesa trabalhista</small>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (DIAGRAMAÇÃO EDITORIAL FLUIDA - ZERO CARTÕES ENGESSADOS) ── */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '36px 20px 56px 20px', flex: 1, boxSizing: 'border-box' }}>
        
        {/* BLOCO DE NOTÍCIAS EM DESTAQUE (DIAGRAMAÇÃO DE JORNAL, SEM MOLDURAS DE CAIXA) */}
        {noticias.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#71636a', marginBottom: '40px' }}>
            Nenhuma notícia publicada no momento.
          </div>
        ) : modeloNoticias === 'B' ? (
          /* ── MODELO B: 1 MANCHETE PRINCIPAL MAIOR + 3 MENORES ABAIXO ── */
          <div style={{ marginBottom: '48px' }}>
            {/* Notícia 1 em destaque principal amplo */}
            {(() => {
              const principal = noticias[0]
              let fotoUrl = principal.banner_url
              let focoY = principal.imagem_y ?? 50
              if (principal.fotos_json) {
                try {
                  const arr = JSON.parse(principal.fotos_json)
                  if (arr[0]?.url) {
                    fotoUrl = arr[0].url
                    focoY = arr[0].foco ?? focoY
                  }
                } catch {}
              }

              return (
                <Link
                  href={`/noticias/${principal.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '28px',
                    paddingBottom: '32px',
                    borderBottom: '1px solid #ebdbe0',
                    marginBottom: '32px',
                  }}
                  className="editorial-article-main"
                >
                  <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#f5f0f2', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={principal.titulo}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${focoY}%`,
                          display: 'block',
                          transition: 'transform 0.25s ease',
                        }}
                        className="editorial-img"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4', padding: '20px' }}>
                        <img
                          src="/logo-sindicato.png"
                          alt="Sindicato dos Químicos"
                          style={{ maxHeight: '80px', maxWidth: '80%', objectFit: 'contain', opacity: 0.85 }}
                        />
                      </div>
                    )}
                    {principal.chapeu && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#861e32',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {principal.chapeu}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {principal.publicado_em && (
                      <div style={{ fontSize: '13px', color: '#71636a', marginBottom: '8px' }}>
                        {formatarDataExtenso(principal.publicado_em)}
                      </div>
                    )}
                    <h2
                      style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        lineHeight: 1.25,
                        color: '#1a1417',
                        margin: '0 0 12px 0',
                        letterSpacing: '-0.3px',
                        transition: 'color 0.15s ease',
                      }}
                      className="editorial-title"
                    >
                      {principal.titulo}
                    </h2>
                    {principal.resumo && (
                      <p style={{ fontSize: '15.5px', lineHeight: 1.6, color: '#554950', margin: '0 0 14px 0' }}>
                        {principal.resumo}
                      </p>
                    )}
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#861e32' }}>
                      Ler matéria completa →
                    </div>
                  </div>
                </Link>
              )
            })()}

            {/* Notícias 2, 3 e 4 em colunas fluidas */}
            {noticias.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
                {noticias.slice(1).map((item) => {
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
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      className="editorial-article-sub"
                    >
                      <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#f5f0f2', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginBottom: '14px' }}>
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={item.titulo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${focoY}%`, display: 'block', transition: 'transform 0.25s ease' }}
                            className="editorial-img"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4' }}>
                            <img src="/logo-sindicato.png" alt="Sindicato dos Químicos" style={{ maxHeight: '60px', maxWidth: '75%', objectFit: 'contain', opacity: 0.85 }} />
                          </div>
                        )}
                        {item.chapeu && (
                          <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#861e32', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            {item.chapeu}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {item.publicado_em && (
                          <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '6px' }}>
                            {formatarDataExtenso(item.publicado_em)}
                          </div>
                        )}
                        <h3
                          style={{
                            fontSize: '17px',
                            fontWeight: 800,
                            lineHeight: 1.35,
                            color: '#1a1417',
                            margin: '0 0 8px 0',
                            transition: 'color 0.15s ease',
                          }}
                          className="editorial-title"
                        >
                          {item.titulo}
                        </h3>
                        {item.resumo && (
                          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#554950', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.resumo}
                          </p>
                        )}
                        <div style={{ marginTop: 'auto', fontSize: '12.5px', fontWeight: 700, color: '#861e32' }}>
                          Ler matéria →
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Link oficial Outras Notícias (Documento Mestre § 13.5) */}
            <div style={{ marginTop: '28px', textAlign: 'right' }}>
              <Link href="/noticias" style={{ fontSize: '14px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }} className="ver-todas-link">
                Outras notícias →
              </Link>
            </div>
          </div>
        ) : (
          /* ── MODELO A (PADRÃO / LEGADO): 4 MATÉRIAS EM GRADE FLUIDA EDITORIAL ── */
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
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
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    className="editorial-article-sub"
                  >
                    {/* Imagem Proporção 3:2 Preservada */}
                    <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#f5f0f2', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginBottom: '14px' }}>
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
                          className="editorial-img"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4', padding: '20px' }}>
                          <img
                            src="/logo-sindicato.png"
                            alt="Sindicato dos Químicos"
                            style={{ maxHeight: '72px', maxWidth: '80%', objectFit: 'contain', opacity: 0.85 }}
                          />
                        </div>
                      )}
                      {item.chapeu && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: '#861e32',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {item.chapeu}
                        </span>
                      )}
                    </div>

                    {/* Conteúdo Textual da Matéria */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {item.publicado_em && (
                        <div style={{ fontSize: '12.5px', color: '#71636a', marginBottom: '6px' }}>
                          {formatarDataExtenso(item.publicado_em)}
                        </div>
                      )}
                      <h3
                        style={{
                          fontSize: '17.5px',
                          fontWeight: 800,
                          lineHeight: 1.35,
                          color: '#1a1417',
                          margin: '0 0 8px 0',
                          letterSpacing: '-0.2px',
                          transition: 'color 0.15s ease',
                        }}
                        className="editorial-title"
                      >
                        {item.titulo}
                      </h3>
                      {item.resumo && (
                        <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#554950', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.resumo}
                        </p>
                      )}
                      <div style={{ marginTop: 'auto', fontSize: '12.5px', fontWeight: 700, color: '#861e32' }}>
                        Ler matéria →
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Link oficial Outras Notícias (Documento Mestre § 13.5) */}
            <div style={{ marginTop: '28px', textAlign: 'right' }}>
              <Link href="/noticias" style={{ fontSize: '14px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }} className="ver-todas-link">
                Outras notícias →
              </Link>
            </div>
          </div>
        )}

        {/* ── SEÇÃO INFERIOR: JORNAL IMPRESSO & CONVÊNIOS (ESTRUTURA EDITORIAL ABERTA) ── */}
        <section
          style={{
            borderTop: '2px solid #ebdbe0',
            paddingTop: '36px',
            marginBottom: '40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
          }}
        >
          {/* Coluna Boca no Trombone */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '92px',
                height: '128px',
                background: '#65172A',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
              <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '2px 0 6px 0', color: '#1a1417' }}>
                Boca no Trombone
              </h3>
              <p style={{ fontSize: '13.5px', color: '#554950', margin: '0 0 14px 0', lineHeight: 1.5 }}>
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
                      borderRadius: '4px',
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
                    background: '#ffffff',
                    color: '#30252a',
                    padding: '7px 14px',
                    borderRadius: '4px',
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

          {/* Coluna Convênios e Benefícios */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '92px',
                height: '128px',
                background: '#faf4f6',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #ebdbe0',
              }}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Vantagens do Associado
              </span>
              <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '2px 0 6px 0', color: '#1a1417' }}>
                Guia de Convênios
              </h3>
              <p style={{ fontSize: '13.5px', color: '#554950', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Mais de 30 parceiros em saúde, faculdades, academias e lazer com descontos exclusivos para sócios e dependentes.
              </p>
              <Link
                href="/paginas/convenios"
                style={{
                  background: '#861e32',
                  color: '#fff',
                  padding: '7px 16px',
                  borderRadius: '4px',
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
        </section>

        {/* ── FAIXA INSTITUCIONAL / AFILIAÇÕES (CSP-CONLUTAS E UNIDOS PRA LUTAR) ── */}
        <section
          style={{
            borderTop: '1px solid #ebdbe0',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#861e32', marginBottom: '2px' }}>
              Central & Corrente Sindical
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1417' }}>
              Filiado à CSP-Conlutas • Em luta com Unidos pra Lutar
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* CSP-Conlutas */}
            <a
              href="https://www.cspconlutas.org.br"
              target="_blank"
              rel="noopener noreferrer"
              title="CSP-Conlutas — Central Sindical e Popular"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e4dce0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
              className="partner-link"
            >
              <img
                src="/logo-csp-conlutas.png"
                alt="Logo CSP-Conlutas"
                style={{ height: '30px', width: 'auto', display: 'block' }}
              />
            </a>

            {/* Unidos pra Lutar */}
            <a
              href="https://www.instagram.com/unidospralutar/"
              target="_blank"
              rel="noopener noreferrer"
              title="Unidos pra Lutar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e4dce0',
                background: '#ffffff',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease',
              }}
              className="partner-link"
            >
              <img
                src="/logo-unidos-pra-lutar.jpg"
                alt="Logo Unidos pra Lutar"
                style={{ height: '30px', width: 'auto', borderRadius: '3px', display: 'block', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1a1417' }}>
                Unidos pra Lutar
              </span>
            </a>
          </div>
        </section>

      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

      <style>{`
        .quick-service-item:hover {
          background: #f4ecf0 !important;
        }
        .editorial-article-main:hover .editorial-img,
        .editorial-article-sub:hover .editorial-img {
          transform: scale(1.025);
        }
        .editorial-article-main:hover .editorial-title,
        .editorial-article-sub:hover .editorial-title {
          color: #861e32 !important;
        }
        .partner-link:hover {
          border-color: #861e32 !important;
        }
        .ver-todas-link:hover {
          text-decoration: underline !important;
        }
      `}</style>

    </div>
  )
}
