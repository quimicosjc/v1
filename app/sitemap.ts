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
    let todasNoticias: { slug: string; atualizado_em: string | null; publicado_em: string | null }[] = []
    let page = 0
    const pageSize = 500
    let hasMore = true

    while (hasMore) {
      const from = page * pageSize
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('conteudos')
        .select('slug, atualizado_em, publicado_em')
        .eq('tipo', 'noticia')
        .eq('status', 'publicado')
        .order('publicado_em', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('[sitemap] Erro na consulta paginada:', error)
        break
      }

      if (data && data.length > 0) {
        todasNoticias = todasNoticias.concat(data)
        if (data.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    if (todasNoticias.length > 0) {
      for (const n of todasNoticias) {
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
