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
    <div style={{ minHeight: '100vh', background: '#f7f5f6', color: '#30252a', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="/" />

      {/* ── FAIXA DE ATALHOS RÁPIDOS (SERVIÇOS AO TRABALHADOR) ── */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid #e4dce0', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            
            <Link
              href="/paginas/fique-socio"
              style={{
                background: '#861e32',
                color: '#ffffff',
                padding: '14px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(134,30,50,0.2)',
              }}
            >
              <span style={{ fontSize: '24px' }}>✍️</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2 }}>Fique Sócio</strong>
                <small style={{ fontSize: '11px', opacity: 0.9 }}>Filie-se online ao sindicato</small>
              </div>
            </Link>

            <Link
              href="/paginas/denuncia"
              style={{
                background: '#30252a',
                color: '#ffffff',
                padding: '14px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>🔒</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2 }}>Canal de Denúncias</strong>
                <small style={{ fontSize: '11px', opacity: 0.85 }}>Totalmente sigiloso e anônimo</small>
              </div>
            </Link>

            <Link
              href="/paginas/colonia"
              style={{
                background: '#f8fafb',
                color: '#30252a',
                border: '1px solid #cbd7de',
                padding: '14px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>🏖️</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2 }}>Colônia de Férias</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>São Sebastião e Caraguá</small>
              </div>
            </Link>

            <Link
              href="/paginas/juridico"
              style={{
                background: '#f8fafb',
                color: '#30252a',
                border: '1px solid #cbd7de',
                padding: '14px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>⚖️</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', lineHeight: 1.2 }}>Plantão Jurídico</strong>
                <small style={{ fontSize: '11px', color: '#71636a' }}>Atendimento trabalhista gratuito</small>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (NOTÍCIAS E JORNAIS) ── */}
      <main style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '36px 20px', flex: 1, boxSizing: 'border-box' }}>
        
        {/* Título da Seção */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px', borderBottom: '2px solid #861e32', paddingBottom: '8px' }}>
          <div>
            <span style={{ color: '#861e32', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Informativos da Categoria
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#30252a', margin: '2px 0 0 0' }}>
              Notícias em Destaque
            </h2>
          </div>
          <Link href="/paginas/lista-noticias" style={{ fontSize: '13px', fontWeight: 600, color: '#861e32', textDecoration: 'none' }}>
            Ver todas as matérias →
          </Link>
        </div>

        {/* GRADE 2x2 DE NOTÍCIAS */}
        {noticias.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '36px', textAlign: 'center', color: '#71636a' }}>
            Nenhuma notícia publicada no momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', marginBottom: '40px' }}>
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
                    borderRadius: '8px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Imagem Proporção 3:2 Preservada */}
                  <div style={{ width: '100%', aspectRatio: '3 / 2', background: '#eee', overflow: 'hidden', position: 'relative' }}>
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
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#861e32', fontWeight: 800, fontSize: '18px', background: '#f5ebed' }}>
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
                          padding: '4px 8px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.chapeu}
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {item.publicado_em && (
                        <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '6px' }}>
                          📅 {formatarData(item.publicado_em)}
                        </div>
                      )}
                      <h3 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.35, color: '#30252a', margin: '0 0 8px 0' }}>
                        {item.titulo}
                      </h3>
                      {item.resumo && (
                        <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#71636a', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.resumo}
                        </p>
                      )}
                    </div>

                    <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#861e32' }}>
                      Ler matéria completa →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── SEÇÃO INFERIOR: JORNAL IMPRESSO & CONVÊNIOS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          
          {/* Card Boca no Trombone */}
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '110px', background: '#65172A', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', flexShrink: 0, overflow: 'hidden' }}>
              {ultimaEdicao?.capa_url ? (
                <img src={ultimaEdicao.capa_url} alt="Capa Jornal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '📰'
              )}
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32', textTransform: 'uppercase' }}>
                Jornal Oficial
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '2px 0 4px 0', color: '#30252a' }}>
                Boca no Trombone
              </h3>
              <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 10px 0' }}>
                {ultimaEdicao ? `Edição nº ${ultimaEdicao.numero} (${ultimaEdicao.mes_ano})` : 'Acompanhe a voz dos trabalhadores químicos.'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {ultimaEdicao?.pdf_url && (
                  <a
                    href={ultimaEdicao.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#861e32', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Baixar PDF ↗
                  </a>
                )}
                <Link href="/jornais" style={{ border: '1px solid #cbd7de', background: '#f8fafb', color: '#30252a', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                  Todas as Edições
                </Link>
              </div>
            </div>
          </div>

          {/* Card Convênios e Benefícios */}
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '110px', background: '#f0e8ea', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#861e32', fontSize: '36px', flexShrink: 0 }}>
              🤝
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32', textTransform: 'uppercase' }}>
                Vantagens do Sócio
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '2px 0 4px 0', color: '#30252a' }}>
                Guia de Convênios
              </h3>
              <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 10px 0' }}>
                Mais de 30 parceiros em saúde, faculdades, academias e lazer com descontos exclusivos.
              </p>
              <Link href="/paginas/convenios" style={{ background: '#861e32', color: '#fff', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                Consultar Convênios →
              </Link>
            </div>
          </div>

        </div>

      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

    </div>
  )
}
