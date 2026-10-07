import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const { data: edicoesData } = await supabase
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
    .order('criado_em', { ascending: false })

  const edicoes: EdicaoItem[] = (edicoesData as any[]) || []

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', color: '#30252a', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional */}
      <header style={{ background: '#65172A', color: '#ffffff', borderBottom: '3px solid #861e32', padding: '14px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit' }}>
            <img src="/logo-sindicato.png" alt="Logo Sindicato dos Químicos SJC" style={{ height: '42px', width: 'auto', display: 'block' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: 1.2 }}>
                Sindicato dos Químicos
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, letterSpacing: '0.2px' }}>
                São José dos Campos e Região
              </div>
            </div>
          </Link>

          <Link href="/" style={{ color: '#ffffff', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
            ← Voltar para a Início
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Cabeçalho */}
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ color: '#861e32', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Publicações Oficiais
            </span>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#30252a', margin: '4px 0 10px 0' }}>
              Jornal Boca no Trombone & Informativos
            </h1>
            <p style={{ fontSize: '15px', color: '#71636a', lineHeight: 1.6, margin: 0, maxWidth: '680px' }}>
              Acesse e faça o download de todas as edições impressas e digitais do nosso jornal da categoria. Acompanhe as campanhas salariais, lutas operárias e conquistas históricas.
            </p>
          </div>

          {/* Grid de Edições */}
          {edicoes.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#71636a' }}>
              Nenhuma edição publicada no momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
              {edicoes.map((ed) => {
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
                  >
                    {/* Capa */}
                    <div style={{ height: '220px', background: '#65172A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {ed.capa_url ? (
                        <img src={ed.capa_url} alt={`Capa ${pubNome} nº ${ed.numero}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#ffffff', padding: '20px' }}>
                          <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>📰</span>
                          <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>{pubNome}</strong>
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
                        <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '4px' }}>
                          🗓️ {ed.mes_ano || 'Edição Regular'}
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

      {/* Rodapé simples */}
      <footer style={{ background: '#30252a', color: '#ffffff', textAlign: 'center', padding: '20px', fontSize: '13px', opacity: 0.85 }}>
        Sindicato dos Químicos de São José dos Campos e Região • contato@quimicosjc.org.br
      </footer>

    </div>
  )
}
