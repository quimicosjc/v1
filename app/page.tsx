import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import HeroManchete from '@/components/publico/HeroManchete'
import CardDestaque from '@/components/publico/CardDestaque'
import AtalhosServicos from '@/components/publico/AtalhosServicos'
import BannerRotativo, { BannerItemData } from '@/components/publico/BannerRotativo'
import BlocoJornal, { EdicaoJornalHome } from '@/components/publico/BlocoJornal'
import { CORES, CONTAINER_STYLE } from '@/lib/design'

export const dynamic = 'force-dynamic'

interface NoticiaItem {
  id: string
  titulo: string
  slug: string
  chapeu?: string | null
  resumo?: string | null
  banner_url?: string | null
  imagem_y?: number | null
  publicado_em?: string | null
  fotos_json?: string | null
}

const NOTICIAS_DEMO: NoticiaItem[] = [
  {
    id: 'demo-1',
    titulo: 'Campanha Salarial 2026: Categoria aprova pauta unificada com reajuste e aumento real',
    slug: 'campanha-salarial-2026-pauta-unificada',
    chapeu: 'Campanha Salarial',
    resumo: 'Assembleia geral reúne químicos de SJC, Taubaté e Jacareí. Pauta aprovada inclui reposição integral da inflação mais aumento real e manutenção das cláusulas sociais.',
    banner_url: '/fotos/campanhas-salariais.jpg',
    imagem_y: 50,
    publicado_em: '2026-10-06T10:00:00Z',
  },
  {
    id: 'demo-2',
    titulo: 'Trabalhadores da Kenvue e J&J debatem estabilidade e segurança nas linhas',
    slug: 'kenvue-jj-estabilidade-seguranca',
    chapeu: 'Emprego e Direitos',
    banner_url: '/fotos/paralisacao-tarkett.jpg',
    imagem_y: 50,
    publicado_em: '2026-10-05T14:30:00Z',
  },
  {
    id: 'demo-3',
    titulo: 'Plantão Jurídico garante pagamento de adicionais de insalubridade em Taubaté',
    slug: 'juridico-insalubridade-taubate',
    chapeu: 'Ação Jurídica',
    banner_url: '/fotos/categoria-2.jpg',
    imagem_y: 50,
    publicado_em: '2026-10-04T09:15:00Z',
  },
  {
    id: 'demo-4',
    titulo: 'Temporada de Férias: Inscrições abertas para as unidades do Litoral Norte',
    slug: 'temporada-ferias-inscricoes-abertas',
    chapeu: 'Lazer e Família',
    banner_url: '/fotos/categoria-3.jpg',
    imagem_y: 50,
    publicado_em: '2026-10-03T16:00:00Z',
  },
  {
    id: 'demo-5',
    titulo: 'Comissão de fábrica debate prevenção de acidentes e laudos de periculosidade',
    slug: 'prevencao-acidentes-periculosidade',
    chapeu: 'Saúde do Trabalhador',
    banner_url: '/fotos/categoria-4.jpg',
    imagem_y: 50,
    publicado_em: '2026-10-02T11:20:00Z',
  },
]

const BANNERS_PADRAO: BannerItemData[] = [
  {
    id: 'b1',
    imagem: '/banners/banner-1.png',
    imagem_mobile: '/banners/banner-1-mobile.png',
    link: '/paginas/cct',
    titulo: 'Campanha Salarial 2026',
    ativo: true,
  },
  {
    id: 'b2',
    imagem: '/banners/banner-2.png',
    imagem_mobile: '/banners/banner-2-mobile.png',
    link: '/paginas/colonia',
    titulo: 'Colônia de Férias',
    ativo: true,
  },
  {
    id: 'b3',
    imagem: '/banners/banner-3.png',
    imagem_mobile: '/banners/banner-3-mobile.png',
    link: '/paginas/fique-socio',
    titulo: 'Fique Sócio Online',
    ativo: true,
  },
]

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Busca configurações gerais da Homepage
  let blocks = ['Notícias em destaque', 'Banners rotativos', 'Jornais']
  let hidden: string[] = []
  let shortcuts = ['fique-socio', 'denuncia', 'colonia', 'juridico']
  let model: 'A' | 'B' = 'B' // Padrão B com 1 manchete + 4 secundárias
  let banners: BannerItemData[] = BANNERS_PADRAO
  let footerTexto: string | null = null

  try {
    const { data: configData } = await supabase
      .from('site_config')
      .select('valor')
      .eq('chave', 'homepage')
      .maybeSingle()

    if (configData?.valor && typeof configData.valor === 'object') {
      const v = configData.valor as any
      if (Array.isArray(v.blocks) && v.blocks.length > 0) blocks = v.blocks
      if (Array.isArray(v.hidden)) hidden = v.hidden
      if (Array.isArray(v.shortcuts) && v.shortcuts.length > 0) shortcuts = v.shortcuts
      if (v.model === 'A' || v.model === 'B') model = v.model
      if (Array.isArray(v.banners) && v.banners.length > 0) {
        banners = v.banners.map((b: any, idx: number) => ({
          id: b.id || `b-${idx}`,
          imagem: b.imagem,
          imagem_mobile: b.imagem_mobile || b.imagemMobile || null,
          link: b.link,
          titulo: b.titulo,
          ativo: b.ativo !== false,
        }))
      }
      if (typeof v.footer === 'string') footerTexto = v.footer
    }
  } catch (err) {
    console.error('Erro ao ler configuração da homepage:', err)
  }

  // 2. Busca ordem dos slots de destaque (até 5 posições)
  let slotsIds: string[] = []
  try {
    const { data: destaquesData } = await supabase
      .from('site_config')
      .select('valor')
      .eq('chave', 'destaques')
      .maybeSingle()

    if (destaquesData?.valor?.slots && Array.isArray(destaquesData.valor.slots)) {
      slotsIds = destaquesData.valor.slots
    }
  } catch {}

  // 3. Busca notícias publicadas no Supabase
  const { data: dbNews } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, chapeu, resumo, banner_url, imagem_y, publicado_em, fotos_json, destaque')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('publicado_em', { ascending: false })
    .limit(10)

  // Organiza notícias respeitando a ordem dos slots de destaque
  const rawList: NoticiaItem[] = (dbNews as any[]) || []
  let orderedNews: NoticiaItem[] = []

  if (slotsIds.length > 0) {
    for (const sid of slotsIds) {
      const found = rawList.find((n) => n.id === sid)
      if (found && !orderedNews.some((x) => x.id === found.id)) {
        orderedNews.push(found)
      }
    }
  }

  // Adiciona as demais notícias publicadas
  for (const n of rawList) {
    if (!orderedNews.some((x) => x.id === n.id)) {
      orderedNews.push(n)
    }
  }

  // Complementa com notícias demo se houver menos de 5 para manter o visual completo
  for (const d of NOTICIAS_DEMO) {
    if (orderedNews.length >= 5) break
    if (!orderedNews.some((x) => x.slug === d.slug)) {
      orderedNews.push(d)
    }
  }

  // 4. Busca edições publicadas do jornal Boca no Trombone
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: dbEdicoes } = await supabaseAdmin
    .from('edicoes_jornal')
    .select('id, numero, mes_ano, capa_url, pdf_url, data_publicacao')
    .eq('status', 'publicado')
    .order('data_publicacao', { ascending: false })
    .order('numero', { ascending: false })
    .limit(5)

  const edicoesJornal: EdicaoJornalHome[] = (dbEdicoes as any[]) || []

  // Extrai foto e foco vertical para uma notícia
  function getFotoNoticia(item: NoticiaItem) {
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

  // Define se os atalhos são encaixados entre a manchete e as secundárias no Modelo B
  const atalhosEncaixados = model === 'B' && !hidden.includes('Atalhos de serviços')

  return (
    <div style={{ minHeight: '100vh', background: CORES.bg, color: CORES.ink, display: 'flex', flexDirection: 'column' }}>
      {/* ── 1. CABEÇALHO UNIFICADO COM FILIAÇÃO CSP E UNIDOS ── */}
      <HeaderPublico slugAtivo="/" />

      {/* ── 2. CONTEÚDO PRINCIPAL (BLOCOS ORDENADOS PELO PAINEL) ── */}
      <main style={{ flex: 1, padding: '24px 0 48px 0' }}>
        <div style={CONTAINER_STYLE}>
          <div style={{ display: 'grid', gap: '36px' }}>
            {blocks.map((nomeBloco) => {
              if (hidden.includes(nomeBloco)) return null

              // ── BLOCO: NOTÍCIAS EM DESTAQUE ──
              if (nomeBloco === 'Notícias em destaque') {
                if (model === 'B') {
                  // MODELO B: 1 Manchete Principal + (Atalhos Encaixados) + 4 Secundárias
                  const principal = orderedNews[0]
                  const secundarias = orderedNews.slice(1, 5)
                  const fotoPrincipal = principal ? getFotoNoticia(principal) : { url: null, foco: 50 }

                  return (
                    <section key={nomeBloco} aria-label="Notícias em destaque">
                      {/* Manchete Principal */}
                      {principal && (
                        <HeroManchete
                          id={principal.id}
                          titulo={principal.titulo}
                          slug={principal.slug}
                          chapeu={principal.chapeu}
                          resumo={principal.resumo}
                          fotoUrl={fotoPrincipal.url}
                          fotoFoco={fotoPrincipal.foco}
                          dataIso={principal.publicado_em}
                        />
                      )}

                      {/* Atalhos de Serviços Encaixados (Decisão D3 - Opção 2b) */}
                      {atalhosEncaixados && (
                        <div style={{ margin: '24px 0' }}>
                          <AtalhosServicos ordem={shortcuts} />
                        </div>
                      )}

                      {/* 4 Notícias Secundárias Alinhadas aos 4 Atalhos */}
                      {secundarias.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            marginTop: atalhosEncaixados ? '0' : '24px',
                          }}
                          className="grade-secundarias-4"
                        >
                          {secundarias.map((item) => {
                            const foto = getFotoNoticia(item)
                            return (
                              <CardDestaque
                                key={item.id}
                                id={item.id}
                                titulo={item.titulo}
                                slug={item.slug}
                                chapeu={item.chapeu}
                                fotoUrl={foto.url}
                                fotoFoco={foto.foco}
                                dataIso={item.publicado_em}
                                layout="coluna"
                              />
                            )
                          })}
                        </div>
                      )}

                      {/* Link Outras notícias conforme especificação */}
                      <div style={{ textAlign: 'right', marginTop: '16px' }}>
                        <Link
                          href="/noticias"
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: CORES.action,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          className="link-outras-noticias"
                        >
                          <span>Outras notícias</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </section>
                  )
                }

                // MODELO A: Grade 2×2 (4 notícias em duas linhas e duas colunas)
                const quatroDestaques = orderedNews.slice(0, 4)

                return (
                  <section key={nomeBloco} aria-label="Notícias em destaque">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '24px',
                      }}
                      className="grade-modelo-a"
                    >
                      {quatroDestaques.map((item) => {
                        const foto = getFotoNoticia(item)
                        return (
                          <CardDestaque
                            key={item.id}
                            id={item.id}
                            titulo={item.titulo}
                            slug={item.slug}
                            chapeu={item.chapeu}
                            fotoUrl={foto.url}
                            fotoFoco={foto.foco}
                            dataIso={item.publicado_em}
                            layout="grande"
                          />
                        )
                      })}
                    </div>

                    {/* Link Outras notícias */}
                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                      <Link
                        href="/noticias"
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: CORES.action,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        className="link-outras-noticias"
                      >
                        <span>Outras notícias</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </section>
                )
              }

              // ── BLOCO: ATALHOS DE SERVIÇOS (QUANDO NÃO ENCAIXADOS OU NO MODELO A) ──
              if (nomeBloco === 'Atalhos de serviços') {
                if (atalhosEncaixados) return null // Já renderizado no miolo do Modelo B

                return (
                  <section key={nomeBloco} aria-label="Atalhos de serviços">
                    <AtalhosServicos ordem={shortcuts} />
                  </section>
                )
              }

              // ── BLOCO: BANNERS ROTATIVOS (PROPORÇÃO 9:2) ──
              if (nomeBloco === 'Banners rotativos') {
                return (
                  <section key={nomeBloco} aria-label="Banners institucionais">
                    <BannerRotativo banners={banners} />
                  </section>
                )
              }

              // ── BLOCO: JORNAIS (2 COLUNAS: DESTAQUE + ANTERIORES) ──
              if (nomeBloco === 'Jornais') {
                return (
                  <BlocoJornal key={nomeBloco} edicoes={edicoesJornal} />
                )
              }

              return null
            })}
          </div>
        </div>
      </main>

      {/* ── 3. RODAPÉ INSTITUCIONAL (COLUNA ÚNICA §13.7) ── */}
      <FooterPublico textoRodape={footerTexto} />

      {/* Estilos responsivos das grades */}
      <style>{`
        .link-outras-noticias:hover {
          text-decoration: underline !important;
        }
        @media (max-width: 960px) {
          .grade-secundarias-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
          .grade-modelo-a {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 540px) {
          .grade-secundarias-4 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
