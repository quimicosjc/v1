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
    <div style={{ minHeight: '100vh', background: '#f7f5f6', color: '#30252a', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo institucional padrão */}
      <HeaderPublico slugAtivo="noticias" />

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '36px 16px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Cabeçalho da Seção */}
          <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ color: '#861e32', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Imprensa & Comunicação
            </span>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#30252a', margin: '4px 0 10px 0' }}>
              Notícias da Categoria Química
            </h1>
            <p style={{ fontSize: '15px', color: '#71636a', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
              Acompanhe as assembleias, negociações da Convenção Coletiva, acordos salariais e ações do Sindicato em defesa dos trabalhadores de São José dos Campos, Jacareí, Caçapava e Taubaté.
            </p>
          </div>

          {/* Componente interativo de busca e listagem */}
          <ListaNoticiasPublica noticiasIniciais={noticias} />

        </div>
      </main>

      {/* Rodapé institucional oficial */}
      <FooterPublico />

    </div>
  )
}
