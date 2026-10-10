import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v1-three-hazel.vercel.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jornais`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Páginas institucionais fixas
  const paginasFixas = [
    'quem-somos',
    'diretoria',
    'historia',
    'estatuto',
    'fique-socio',
    'carteirinha',
    'atualizacao-cadastral',
    'denuncia',
    'colonia-de-ferias',
    'convenios',
    'clube-de-campo',
    'juridico',
    'convencoes-coletivas',
    'saude-do-trabalhador',
    'contato',
    'privacidade',
  ]

  for (const slug of paginasFixas) {
    staticRoutes.push({
      url: `${baseUrl}/paginas/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // Notícias dinâmicas publicadas no Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: noticias } = await supabase
      .from('conteudos')
      .select('slug, atualizado_em, publicado_em')
      .eq('tipo', 'noticia')
      .eq('status', 'publicado')
      .order('publicado_em', { ascending: false })
      .limit(100)

    if (noticias && noticias.length > 0) {
      for (const n of noticias) {
        staticRoutes.push({
          url: `${baseUrl}/noticias/${n.slug}`,
          lastModified: new Date(n.atualizado_em || n.publicado_em || new Date()),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch (err) {
    console.error('[sitemap] Erro ao carregar notícias:', err)
  }

  return staticRoutes
}
