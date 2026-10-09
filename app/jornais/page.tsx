import { Metadata } from 'next'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import HeaderPublico from '@/components/publico/HeaderPublico'
import FooterPublico from '@/components/publico/FooterPublico'
import AcervoJornaisPublico, { EdicaoItem, PublicacaoItem } from '@/components/publico/AcervoJornaisPublico'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boca no Trombone · Sindicato dos Químicos SJC',
  description: 'Acervo digital do jornal Boca no Trombone e outros informativos do Sindicato dos Químicos de São José dos Campos e Região.',
}

export default async function JornaisPublicosPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Busca publicações cadastradas
  const { data: pubData } = await supabaseAdmin
    .from('publicacoes_jornal')
    .select('id, nome, descricao')
    .order('criado_em', { ascending: true })

  const publicacoes: PublicacaoItem[] = (pubData as PublicacaoItem[]) || []

  // 2. Busca todas as edições publicadas
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
      publicacao_id,
      publicacoes_jornal (
        id,
        nome
      )
    `)
    .eq('status', 'publicado')
    .order('data_publicacao', { ascending: false })
    .order('numero', { ascending: false })

  const edicoesRaw: EdicaoItem[] = (edicoesData as any[]) || []

  // Ordenação natural: Boca no Trombone primeiro, por número decrescente
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

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1417', display: 'flex', flexDirection: 'column' }}>
      {/* Topo institucional unificado */}
      <HeaderPublico slugAtivo="jornais" />

      {/* Acervo Interativo com Dropdown de publicações, destaque e lista paginada mobile */}
      <AcervoJornaisPublico edicoes={edicoes} publicacoes={publicacoes} />

      {/* Rodapé institucional oficial */}
      <FooterPublico />
    </div>
  )
}
