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
import {
  TEMPO_BANNER_PADRAO_SEG,
  sanitizarTempoBannerSegundos,
} from '@/lib/banner-config'
import {
  resolverOrdemDestaquesHome,
  type ConfigDestaquesHome,
} from '@/lib/destaques-home'

export const dynamic = 'force-dynamic'

interface NoticiaItem {
  id: string
  titulo: string
  slug: string
  chapeu?: string | null
  resumo?: string | null
  corpo?: string | null
  banner_url?: string | null
  imagem_y?: number | null
  publicado_em?: string | null
  criado_em?: string | null
  fotos_json?: string | null
  url_referencia?: string | null
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
  let posicaoServicos: 'entre' | 'acima' | 'abaixo' = 'entre'
  let bannerTempoSegundos: number = TEMPO_BANNER_PADRAO_SEG
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
      if (v.posicaoServicos === 'entre' || v.posicaoServicos === 'acima' || v.posicaoServicos === 'abaixo') {
        posicaoServicos = v.posicaoServicos
      }
      if (v.bannerTempoSegundos !== undefined) {
        bannerTempoSegundos = sanitizarTempoBannerSegundos(v.bannerTempoSegundos)
      }
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

  // 2. Busca configuração de destaques (automático por padrão, com suporte a ordenação manual)
  let configDestaques: ConfigDestaquesHome | null = null
  try {
    const { data: destaquesData } = await supabase
      .from('site_config')
      .select('valor, atualizado_em')
      .eq('chave', 'destaques')
      .maybeSingle()

    if (destaquesData?.valor && typeof destaquesData.valor === 'object') {
      const v = destaquesData.valor as any
      configDestaques = {
        slots: Array.isArray(v.slots) ? v.slots : [],
        modo: v.modo === 'manual' ? 'manual' : 'automatico',
        atualizado_em: v.atualizado_em || destaquesData.atualizado_em || null,
      }
    }
  } catch {}

  // 3. Busca notícias publicadas no Supabase em ordem cronológica (mais recente primeiro, sem trafegar corpo HTML pesado de 30 matérias)
  const { data: dbNews } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, chapeu, resumo, banner_url, imagem_y, publicado_em, criado_em, fotos_json, destaque, url_referencia')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('publicado_em', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(30)

  let rawList: NoticiaItem[] = (dbNews as any[]) || []

  // Se houver slots manuais apontando para notícias publicadas mais antigas fora do top 30, inclui-as
  if (configDestaques?.modo === 'manual' && configDestaques.slots && configDestaques.slots.length > 0) {
    const idsPresentes = new Set(rawList.map((n) => n.id))
    const idsFaltantes = configDestaques.slots.filter((id) => !idsPresentes.has(id))
    if (idsFaltantes.length > 0) {
      const { data: extras } = await supabase
        .from('conteudos')
        .select('id, titulo, slug, chapeu, resumo, banner_url, imagem_y, publicado_em, criado_em, fotos_json, destaque, url_referencia')
        .eq('tipo', 'noticia')
        .eq('status', 'publicado')
        .in('id', idsFaltantes)
      if (extras && extras.length > 0) {
        rawList = [...rawList, ...(extras as any[])]
      }
    }
  }

  // Organiza notícias: destaque automático cronológico + suporte a reordenação manual sem duplicações
  const orderedNews: NoticiaItem[] = resolverOrdemDestaquesHome(rawList, configDestaques)

  // Busca o corpo apenas da manchete #1 se ela não possuir resumo cadastrado
  if (orderedNews[0] && (!orderedNews[0].resumo || !orderedNews[0].resumo.trim())) {
    const { data: mancheteCorpo } = await supabase
      .from('conteudos')
      .select('corpo')
      .eq('id', orderedNews[0].id)
      .maybeSingle()
    if (mancheteCorpo?.corpo) {
      orderedNews[0].corpo = mancheteCorpo.corpo
    }
  }

  // Complementa com notícias demo somente se o banco tiver menos de 5 publicadas
  for (const d of NOTICIAS_DEMO) {
    if (orderedNews.length >= 5) break
    if (!orderedNews.some((x) => x.slug === d.slug || x.id === d.id)) {
      orderedNews.push(d)
    }
  }

  // 4. Busca edições publicadas do jornal Boca no Trombone e lista de publicações ativas
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: dbEdicoes } = await supabaseAdmin
    .from('edicoes_jornal')
    .select(`
      id,
      numero,
      mes_ano,
      capa_url,
      pdf_url,
      data_publicacao,
      publicacoes_jornal (
        id,
        nome
      )
    `)
    .eq('status', 'publicado')
    .order('data_publicacao', { ascending: false })
    .order('numero', { ascending: false })

  const todasEdicoes = (dbEdicoes as any[]) || []
  // O bloco de display da Home exibe estritamente as edições do Boca no Trombone (números regulares de 100 a 999)
  const edicoesBoca = todasEdicoes
    .filter((ed) => {
      const nomePub = ed.publicacoes_jornal?.nome?.toLowerCase() || ''
      const num = parseInt(String(ed.numero).replace(/\D/g, '')) || 0
      return (nomePub.includes('boca no trombone') || !nomePub) && num >= 100 && num < 1000
    })
  // Ordena estritamente por número decrescente numérico
  edicoesBoca.sort((a, b) => {
    const numA = parseInt(String(a.numero).replace(/\D/g, '')) || 0
    const numB = parseInt(String(b.numero).replace(/\D/g, '')) || 0
    return numB - numA
  })
  const edicoesJornal: EdicaoJornalHome[] = edicoesBoca.slice(0, 5)

  // Busca outras publicações ativas (ex: Jornal da Família) para o dropdown
  const { data: dbPublicacoes } = await supabaseAdmin
    .from('publicacoes_jornal')
    .select('id, nome')
    .order('criado_em', { ascending: true })

  const outrosJornais = ((dbPublicacoes as any[]) || []).filter(
    (p: any) => !p.nome?.toLowerCase().includes('boca no trombone')
  )

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

  // Extrai resumo garantindo até 300 caracteres, ou captura os primeiros 300 do corpo sem formatação + ' (...)'
  function obterResumoManchete(item: NoticiaItem): string | null {
    if (item.resumo && item.resumo.trim().length > 0) {
      return item.resumo.trim()
    }
    if (!item.corpo) return null
    // Remove tags HTML, &nbsp; e quebras
    const textoLimpo = item.corpo
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!textoLimpo) return null
    if (textoLimpo.length <= 300) return textoLimpo
    return textoLimpo.substring(0, 300).trim() + ' (...)'
  }

  // Exibição dos atalhos de serviços (se não estiver desativado no painel)
  const mostrarServicos = !hidden.includes('Atalhos de serviços')

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
                  // MODELO B: 1 Manchete Principal + Atalhos de Serviços + 4 Secundárias
                  const principal = orderedNews[0]
                  const secundarias = orderedNews.slice(1, 5)
                  const fotoPrincipal = principal ? getFotoNoticia(principal) : { url: null, foco: 50 }

                  return (
                    <section key={nomeBloco} aria-label="Notícias em destaque">
                      {/* Atalhos Acima da Manchete */}
                      {mostrarServicos && posicaoServicos === 'acima' && (
                        <div style={{ marginBottom: '24px' }}>
                          <AtalhosServicos ordem={shortcuts} />
                        </div>
                      )}

                      {/* Manchete Principal com resumo garantido de 300 caracteres ou captura inteligente */}
                      {principal && (
                        <HeroManchete
                          id={principal.id}
                          titulo={principal.titulo}
                          slug={principal.slug}
                          chapeu={principal.chapeu}
                          resumo={obterResumoManchete(principal)}
                          fotoUrl={fotoPrincipal.url}
                          fotoFoco={fotoPrincipal.foco}
                          dataIso={principal.publicado_em}
                          urlReferencia={principal.url_referencia}
                        />
                      )}

                      {/* Atalhos Entre Manchete e Secundárias (Padrão) */}
                      {mostrarServicos && (posicaoServicos === 'entre' || !posicaoServicos) && (
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
                            marginTop: (mostrarServicos && posicaoServicos === 'entre') ? '0' : '24px',
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
                                urlReferencia={item.url_referencia}
                              />
                            )
                          })}
                        </div>
                      )}

                      {/* Atalhos Abaixo das Secundárias */}
                      {mostrarServicos && posicaoServicos === 'abaixo' && (
                        <div style={{ marginTop: '24px' }}>
                          <AtalhosServicos ordem={shortcuts} />
                        </div>
                      )}

                      {/* Botão OUTRAS NOTÍCIAS de alta visibilidade e acessibilidade */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <Link
                          href="/noticias"
                          className="btn-outras-noticias"
                        >
                          <span>OUTRAS NOTÍCIAS</span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                      </div>
                    </section>
                  )
                }

                // MODELO A: Grade 2×2 (4 notícias em duas linhas e duas colunas)
                const quatroDestaques = orderedNews.slice(0, 4)

                return (
                  <section key={nomeBloco} aria-label="Notícias em destaque">
                    {/* Atalhos Acima da Grade 2×2 */}
                    {mostrarServicos && (posicaoServicos === 'acima' || posicaoServicos === 'entre' || !posicaoServicos) && (
                      <div style={{ marginBottom: '24px' }}>
                        <AtalhosServicos ordem={shortcuts} />
                      </div>
                    )}

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
                            urlReferencia={item.url_referencia}
                          />
                        )
                      })}
                    </div>

                    {/* Atalhos Abaixo da Grade 2×2 */}
                    {mostrarServicos && posicaoServicos === 'abaixo' && (
                      <div style={{ marginTop: '24px' }}>
                        <AtalhosServicos ordem={shortcuts} />
                      </div>
                    )}

                    {/* Botão OUTRAS NOTÍCIAS de alta visibilidade e acessibilidade */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                      <Link
                        href="/noticias"
                        className="btn-outras-noticias"
                      >
                        <span>OUTRAS NOTÍCIAS</span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </section>
                )
              }

              // ── BLOCO: ATALHOS DE SERVIÇOS ──
              if (nomeBloco === 'Atalhos de serviços') {
                return null // Integrado no bloco de notícias respeitando a posicaoServicos
              }

              // ── BLOCO: BANNERS ROTATIVOS (PROPORÇÃO 9:2) ──
              if (nomeBloco === 'Banners rotativos') {
                return (
                  <section key={nomeBloco} aria-label="Banners institucionais">
                    <BannerRotativo banners={banners} duracaoSegundos={bannerTempoSegundos} />
                  </section>
                )
              }

              // ── BLOCO: JORNAIS (2 COLUNAS: DESTAQUE + ANTERIORES) ──
              if (nomeBloco === 'Jornais') {
                return (
                  <BlocoJornal key={nomeBloco} edicoes={edicoesJornal} outrosJornais={outrosJornais} />
                )
              }

              return null
            })}
          </div>
        </div>
      </main>

      {/* ── 3. RODAPÉ INSTITUCIONAL (COLUNA ÚNICA §13.7) ── */}
      <FooterPublico textoRodape={footerTexto} />

      {/* Estilos responsivos das grades e botão OUTRAS NOTÍCIAS */}
      <style>{`
        .btn-outras-noticias {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          padding: 13px 34px;
          background: ${CORES.action};
          color: #FFFFFF;
          font-family: var(--font-condensed), sans-serif;
          font-size: 16.5px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 6px;
          border: 2px solid ${CORES.action};
          box-shadow: 0 3px 12px rgba(134, 30, 50, 0.22);
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }
        .btn-outras-noticias:hover {
          background: ${CORES.actionHover};
          border-color: ${CORES.actionHover};
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(101, 23, 42, 0.28);
          text-decoration: none !important;
        }
        .btn-outras-noticias:focus-visible {
          outline: 3px solid ${CORES.action};
          outline-offset: 3px;
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
          .btn-outras-noticias {
            width: 100%;
            min-height: 50px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}
