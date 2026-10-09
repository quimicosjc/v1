import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import ListaNoticiasPublica, { type NoticiaItemPublico } from '@/components/publico/ListaNoticiasPublica'
import { CONTAINER_STYLE } from '@/lib/design'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Notícias da Categoria · Sindicato dos Químicos SJC',
  description: 'Arquivo completo de notícias, comunicados e coberturas das lutas dos trabalhadores químicos de São José dos Campos e Região.',
}

export default async function NoticiasIndexPage() {
  const supabase = await createClient()

  const { data: noticiasData } = await supabase
    .from('conteudos')
    .select('id, titulo, slug, resumo, chapeu, banner_url, imagem_y, publicado_em, fotos_json, url_referencia')
    .eq('tipo', 'noticia')
    .eq('status', 'publicado')
    .order('publicado_em', { ascending: false })

  const noticias: NoticiaItemPublico[] = (noticiasData as any[]) || []

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1417', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="noticias" />

      {/* ── FAIXA COM BREADCRUMB ALINHADO AO CONTAINER (M9) ── */}
      <section
        className="noticias-breadcrumb-faixa"
        style={{
          background: '#faf8f9',
          borderBottom: '1px solid #ebdbe0',
          padding: '14px 0',
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
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ color: '#71636a', textDecoration: 'none' }} className="breadcrumb-link">
              Início
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: '#861e32', fontWeight: 600 }}>Notícias</span>
          </nav>
        </div>
      </section>

      {/* Conteúdo principal alinhado ao CONTAINER_STYLE */}
      <main style={{ flex: 1, padding: '36px 0 60px 0' }}>
        <div style={CONTAINER_STYLE}>
          {/* Componente interativo de busca e listagem */}
          <ListaNoticiasPublica noticiasIniciais={noticias} />
        </div>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

      <style>{`
        @media (max-width: 768px) {
          .noticias-breadcrumb-faixa {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
