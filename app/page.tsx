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

interface BannerHomepage {
  imagem_url: string
  link_url?: string
  alt?: string
}

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Busca configurações de banners se houver (Documento Mestre § 13.3)
  let bannerHomepage: BannerHomepage | null = null
  try {
    const { data: bannerData } = await supabase
      .from('site_config')
      .select('valor')
      .eq('chave', 'banner_homepage')
      .maybeSingle()

    if (bannerData?.valor?.imagem_url) {
      bannerHomepage = bannerData.valor
    }
  } catch {}

  // 2. Busca até 7 notícias publicadas (1 principal + até 3 secundárias + últimas notícias)
  const { data: noticiasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('destaque', { ascending: false })
    .order('publicado_em', { ascending: false })
    .limit(7)

  const noticias: NoticiaDestaque[] = (noticiasData as any[]) || []
  const noticiaPrincipal = noticias[0] || null
  const noticiasSecundarias = noticias.slice(1, 4)
  const noticiasExtras = noticias.slice(4, 7)

  // 3. Busca a edição mais recente publicada do jornal Boca no Trombone
  const { data: edicaoData } = await supabase
    .from('edicoes_jornal')
    .select('id, numero, mes_ano, capa_url, pdf_url, publicacoes_jornal (nome)')
    .eq('status', 'publicado')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ultimaEdicao: EdicaoRecente | null = (edicaoData as any) || null

  // Função auxiliar para extrair a melhor URL de imagem e foco vertical
  const getFoto = (item: NoticiaDestaque) => {
    let url = item.banner_url || null
    let foco = item.imagem_y ?? 50
    if (item.fotos_json) {
      try {
        const arr = JSON.parse(item.fotos_json)
        if (arr[0]?.url) {
          url = arr[0].url
          foco = arr[0].foco ?? foco
        }
      } catch {}
    }
    return { url, foco }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1417', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOPO INSTITUCIONAL UNIFICADO ── */}
      <HeaderPublico slugAtivo="/" />

      {/* ── RÉGUA HORIZONTAL DE ATALHOS DE SERVIÇOS (COMPACTA, DIRETA, FÁCIL DE LOCALIZAR) ── */}
      <section style={{ background: '#faf8f9', borderBottom: '1px solid #ebdbe0', padding: '10px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '8px',
            }}
            className="quick-service-grid"
          >
            {/* 1. Fique Sócio */}
            <Link
              href="/paginas/fique-socio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '5px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', lineHeight: 1.2, color: '#861e32' }}>Fique Sócio</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>Filie-se online</small>
              </div>
            </Link>

            {/* 2. Canal de Denúncias */}
            <Link
              href="/paginas/denuncia"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '5px',
                  background: '#f5f0f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', lineHeight: 1.2, color: '#1a1417' }}>Canal de Denúncias</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>Sigilo absoluto</small>
              </div>
            </Link>

            {/* 3. Colônia de Férias */}
            <Link
              href="/paginas/colonia"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '5px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <strong style={{ fontSize: '13.5px', display: 'block', lineHeight: 1.2, color: '#1a1417' }}>Colônia de Férias</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>Caraguá e S. Sebastião</small>
              </div>
            </Link>

            {/* 4. Plantão Jurídico */}
            <Link
              href="/paginas/juridico"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1a1417',
                transition: 'background 0.15s ease',
              }}
              className="quick-service-item"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '5px',
                  background: '#fbe9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', lineHeight: 1.2, color: '#1a1417' }}>Plantão Jurídico</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>Defesa trabalhista</small>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BANNER INSTITUCIONAL (SE CONFIGURADO: SOMENTE IMAGEM CLICÁVEL, SEM TEXTO SOBREPOSTO) ── */}
      {bannerHomepage && bannerHomepage.imagem_url && (
        <section style={{ maxWidth: '1200px', width: '100%', margin: '20px auto 0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', aspectRatio: '4 / 1', overflow: 'hidden', borderRadius: '6px', border: '1px solid #ebdbe0' }}>
            {bannerHomepage.link_url ? (
              <a href={bannerHomepage.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                <img
                  src={bannerHomepage.imagem_url}
                  alt={bannerHomepage.alt || 'Banner institucional'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </a>
            ) : (
              <img
                src={bannerHomepage.imagem_url}
                alt={bannerHomepage.alt || 'Banner institucional'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        </section>
      )}

      {/* ── CONTEÚDO PRINCIPAL (1200PX, ZERO CARTÕES ENGESSADOS, HIERARQUIA EDITORIAL CLARA) ── */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 20px 56px 20px', flex: 1, boxSizing: 'border-box' }}>
        
        {/* BLOCO EDITORIAL HERO: 1 NOTÍCIA PRINCIPAL COM MAIOR DESTAQUE + CHAMADAS SECUNDÁRIAS */}
        {!noticiaPrincipal ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#71636a', marginBottom: '40px' }}>
            Nenhuma notícia publicada no momento.
          </div>
        ) : (
          <section style={{ marginBottom: '44px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: noticiasSecundarias.length > 0 ? '1.35fr 0.95fr' : '1fr',
                gap: '36px',
                alignItems: 'start',
              }}
              className="hero-editorial-grid"
            >
              
              {/* ── COLUNA ESQUERDA: NOTÍCIA PRINCIPAL (MAIOR DESTAQUE) ── */}
              <div>
                {(() => {
                  const { url: fotoUrl, foco } = getFoto(noticiaPrincipal)
                  return (
                    <Link
                      href={`/noticias/${noticiaPrincipal.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      className="editorial-main-link"
                    >
                      {/* Foto Proporção 3:2 com Ponto de Foco Preservado */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3 / 2',
                          background: '#f5f0f2',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative',
                          marginBottom: '16px',
                          border: '1px solid #ebdbe0',
                        }}
                      >
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={noticiaPrincipal.titulo}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: `50% ${foco}%`,
                              display: 'block',
                              transition: 'transform 0.25s ease',
                            }}
                            className="editorial-img"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4' }}>
                            <img src="/logo-sindicato.png" alt="Sindicato dos Químicos" style={{ maxHeight: '85px', maxWidth: '80%', objectFit: 'contain', opacity: 0.85 }} />
                          </div>
                        )}
                        {noticiaPrincipal.chapeu && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: '#861e32',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '3px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                            }}
                          >
                            {noticiaPrincipal.chapeu}
                          </span>
                        )}
                      </div>

                      {/* Metadados e Título Principal de Grande Impacto */}
                      {noticiaPrincipal.publicado_em && (
                        <div style={{ fontSize: '13px', color: '#71636a', marginBottom: '8px', fontWeight: 500 }}>
                          {formatarDataExtenso(noticiaPrincipal.publicado_em)}
                        </div>
                      )}
                      
                      <h1
                        style={{
                          fontSize: '30px',
                          fontWeight: 800,
                          lineHeight: 1.25,
                          color: '#1a1417',
                          margin: '0 0 12px 0',
                          letterSpacing: '-0.4px',
                          transition: 'color 0.15s ease',
                        }}
                        className="editorial-main-title"
                      >
                        {noticiaPrincipal.titulo}
                      </h1>

                      {noticiaPrincipal.resumo && (
                        <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#554950', margin: '0 0 16px 0' }}>
                          {noticiaPrincipal.resumo}
                        </p>
                      )}

                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#861e32' }}>
                        Ler matéria completa →
                      </div>
                    </Link>
                  )
                })()}
              </div>

              {/* ── COLUNA DIREITA: CHAMADAS SECUNDÁRIAS (EM LINHA EDITORIAL VERTICAL) ── */}
              {noticiasSecundarias.length > 0 && (
                <div
                  style={{
                    borderLeft: '1px solid #ebdbe0',
                    paddingLeft: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '22px',
                  }}
                  className="hero-secondary-col"
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#861e32', borderBottom: '2px solid #861e32', paddingBottom: '4px', alignSelf: 'flex-start' }}>
                    Em Destaque
                  </div>

                  {noticiasSecundarias.map((item, idx) => {
                    const { url: fotoUrl, foco } = getFoto(item)
                    return (
                      <article
                        key={item.id}
                        style={{
                          paddingBottom: idx < noticiasSecundarias.length - 1 ? '20px' : '0',
                          borderBottom: idx < noticiasSecundarias.length - 1 ? '1px solid #f0e8eb' : 'none',
                        }}
                      >
                        <Link
                          href={`/noticias/${item.slug}`}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'grid',
                            gridTemplateColumns: '110px 1fr',
                            gap: '16px',
                            alignItems: 'start',
                          }}
                          className="secondary-call-link"
                        >
                          {/* Miniatura 3:2 Compacta */}
                          <div
                            style={{
                              width: '110px',
                              aspectRatio: '3 / 2',
                              background: '#f5f0f2',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid #ebdbe0',
                              flexShrink: 0,
                            }}
                          >
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={item.titulo}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${foco}%`, display: 'block' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4' }}>
                                <img src="/logo-sindicato.png" alt="Sindicato dos Químicos" style={{ maxHeight: '42px', maxWidth: '80%', objectFit: 'contain', opacity: 0.85 }} />
                              </div>
                            )}
                          </div>

                          {/* Conteúdo da Chamada Secundária */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              {item.chapeu && (
                                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                  {item.chapeu}
                                </span>
                              )}
                              {item.publicado_em && (
                                <span style={{ fontSize: '11.5px', color: '#71636a' }}>
                                  • {formatarDataExtenso(item.publicado_em)}
                                </span>
                              )}
                            </div>

                            <h3
                              style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                lineHeight: 1.35,
                                color: '#1a1417',
                                margin: '0 0 6px 0',
                                transition: 'color 0.15s ease',
                              }}
                              className="secondary-call-title"
                            >
                              {item.titulo}
                            </h3>

                            {item.resumo && (
                              <p style={{ fontSize: '12.5px', lineHeight: 1.45, color: '#554950', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.resumo}
                              </p>
                            )}
                          </div>
                        </Link>
                      </article>
                    )
                  })}
                </div>
              )}

            </div>
          </section>
        )}

        {/* ── SEÇÃO: ÚLTIMAS NOTÍCIAS & BLOCOS TEMÁTICOS DA CATEGORIA ── */}
        <section style={{ borderTop: '2px solid #ebdbe0', paddingTop: '36px', marginBottom: '44px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
            className="section-header-flex"
          >
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '4px' }}>
                Lutas & Mobilizações
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#1a1417', letterSpacing: '-0.3px' }}>
                Notícias da Categoria
              </h2>
            </div>
            <Link
              href="/noticias"
              style={{ fontSize: '13.5px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }}
              className="ver-todas-link"
            >
              Ver todo o arquivo de notícias →
            </Link>
          </div>

          {/* Se houver notícias além das 4 do hero, exibe em grade fluida de 3 colunas */}
          {noticiasExtras.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', marginBottom: '32px' }}>
              {noticiasExtras.map((item) => {
                const { url: fotoUrl, foco } = getFoto(item)
                return (
                  <Link
                    key={item.id}
                    href={`/noticias/${item.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                    className="extra-article-link"
                  >
                    <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#f5f0f2', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginBottom: '12px', border: '1px solid #ebdbe0' }}>
                      {fotoUrl ? (
                        <img src={fotoUrl} alt={item.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${foco}%`, display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f2f4' }}>
                          <img src="/logo-sindicato.png" alt="Sindicato dos Químicos" style={{ maxHeight: '55px', maxWidth: '75%', objectFit: 'contain', opacity: 0.85 }} />
                        </div>
                      )}
                      {item.chapeu && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#861e32', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', textTransform: 'uppercase' }}>
                          {item.chapeu}
                        </span>
                      )}
                    </div>

                    {item.publicado_em && (
                      <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '6px' }}>
                        {formatarDataExtenso(item.publicado_em)}
                      </div>
                    )}
                    <h3 style={{ fontSize: '16.5px', fontWeight: 800, lineHeight: 1.35, color: '#1a1417', margin: '0 0 8px 0' }} className="extra-article-title">
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
                  </Link>
                )
              })}
            </div>
          ) : null}

          {/* Blocos Temáticos de Ação Sindical (Design Limpo, Fundo Suave, Sem Aspecto de Cartão Pesado) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '18px',
            }}
            className="themes-grid"
          >
            {/* Bloco 1: Acordos & Convenções Coletivas */}
            <div
              style={{
                background: '#faf8f9',
                border: '1px solid #ebdbe0',
                borderRadius: '6px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Campanha Salarial
                </span>
                <h4 style={{ fontSize: '16.5px', fontWeight: 800, margin: '4px 0 8px 0', color: '#1a1417' }}>
                  Convenções Coletivas (CCT)
                </h4>
                <p style={{ fontSize: '13px', color: '#554950', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Consulte os pisos salariais, reajustes, PLR e cláusulas sociais homologadas para o setor químico e farmacêutico.
                </p>
              </div>
              <Link href="/paginas/cct" style={{ fontSize: '12.5px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }}>
                Consultar Convenções →
              </Link>
            </div>

            {/* Bloco 2: Saúde do Trabalhador & Segurança */}
            <div
              style={{
                background: '#faf8f9',
                border: '1px solid #ebdbe0',
                borderRadius: '6px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Saúde & Prevenção
                </span>
                <h4 style={{ fontSize: '16.5px', fontWeight: 800, margin: '4px 0 8px 0', color: '#1a1417' }}>
                  Saúde do Trabalhador & CIPAs
                </h4>
                <p style={{ fontSize: '13px', color: '#554950', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Orientações sobre insalubridade, periculosidade, emissão de CAT e acompanhamento de CIPAs nas fábricas da região.
                </p>
              </div>
              <Link href="/paginas/juridico" style={{ fontSize: '12.5px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }}>
                Orientações de Saúde →
              </Link>
            </div>

            {/* Bloco 3: História & Diretoria */}
            <div
              style={{
                background: '#faf8f9',
                border: '1px solid #ebdbe0',
                borderRadius: '6px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Nossa Luta
                </span>
                <h4 style={{ fontSize: '16.5px', fontWeight: 800, margin: '4px 0 8px 0', color: '#1a1417' }}>
                  Mais de 60 Anos de História
                </h4>
                <p style={{ fontSize: '13px', color: '#554950', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Conheça a trajetória do sindicato desde 1963 e a composição da diretoria colegiada eleita pela categoria.
                </p>
              </div>
              <Link href="/paginas/historia" style={{ fontSize: '12.5px', fontWeight: 700, color: '#861e32', textDecoration: 'none' }}>
                Conhecer a História →
              </Link>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO INFERIOR: JORNAL IMPRESSO & CONVÊNIOS (ESTRUTURA EDITORIAL ABERTA) ── */}
        <section
          style={{
            borderTop: '2px solid #ebdbe0',
            paddingTop: '36px',
            marginBottom: '44px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
          }}
          className="paper-convenios-grid"
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

      {/* ── RODAPÉ INSTITUCIONAL OFICIAL ── */}
      <FooterPublico />

      {/* ── ESTILOS DINÂMICOS & RESPONSIVOS ── */}
      <style>{`
        .quick-service-item:hover {
          background: #f4ecf0 !important;
        }
        .editorial-main-link:hover .editorial-img {
          transform: scale(1.02);
        }
        .editorial-main-link:hover .editorial-main-title {
          color: #861e32 !important;
        }
        .secondary-call-link:hover .secondary-call-title {
          color: #861e32 !important;
        }
        .extra-article-link:hover .extra-article-title {
          color: #861e32 !important;
        }
        .partner-link:hover {
          border-color: #861e32 !important;
        }
        .ver-todas-link:hover {
          text-decoration: underline !important;
        }
        @media (max-width: 860px) {
          .hero-editorial-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .hero-secondary-col {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid #ebdbe0 !important;
            padding-top: 24px !important;
          }
          .editorial-main-title {
            font-size: 24px !important;
          }
          .themes-grid {
            grid-template-columns: 1fr !important;
          }
          .paper-convenios-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .quick-service-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          .quick-service-item {
            padding: 8px 10px !important;
            gap: 8px !important;
          }
          .section-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .secondary-call-link {
            grid-template-columns: 90px 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

    </div>
  )
}
