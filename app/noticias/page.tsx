import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import ListaNoticiasPublica, { type NoticiaItemPublico } from '@/components/publico/ListaNoticiasPublica'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Notícias e Coberturas · Sindicato dos Químicos SJC',
  description: 'Arquivo completo de notícias, comunicados e coberturas das lutas dos trabalhadores químicos de São José dos Campos e Região.',
}

export default async function NoticiasIndexPage() {
  const supabase = await createClient()

  const { data: noticiasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('publicado_em', { ascending: false })

  const noticias: NoticiaItemPublico[] = (noticiasData as any[]) || []

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f6', color: '#30252a', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional padrão */}
      <HeaderPublico slugAtivo="noticias" />

      {/* ── FAIXA HERO INSTITUCIONAL COM BREADCRUMB ── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e4dce0',
          padding: '28px 20px 32px 20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
            <span style={{ color: '#861e32', fontWeight: 600 }}>
              Imprensa
            </span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#30252a', fontWeight: 600 }}>Notícias</span>
          </nav>

          {/* Chapéu / Pilar */}
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
            Imprensa & Comunicação
          </div>

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
            Notícias da Categoria Química
          </h1>

          <p style={{ fontSize: '16px', color: '#65575e', lineHeight: 1.6, margin: 0, maxWidth: '780px' }}>
            Acompanhe as assembleias, negociações da Convenção Coletiva, acordos salariais e ações do Sindicato em defesa dos trabalhadores de São José dos Campos, Jacareí, Caçapava e Taubaté.
          </p>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Componente interativo de busca e listagem */}
          <ListaNoticiasPublica noticiasIniciais={noticias} />
        </div>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

    </div>
  )
}
