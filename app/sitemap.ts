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

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Páginas institucionais e de serviços reais publicadas no banco
    const { data: paginasDb } = await supabase
      .from('conteudos')
      .select('slug, atualizado_em, publicado_em')
      .in('tipo', ['institucional', 'avulsa'])
      .eq('status', 'publicado')
      .order('slug', { ascending: true })

    if (paginasDb && paginasDb.length > 0) {
      for (const p of paginasDb) {
        staticRoutes.push({
          url: `${baseUrl}/paginas/${p.slug}`,
          lastModified: new Date(p.atualizado_em || p.publicado_em || new Date()),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }

    // 2. Notícias dinâmicas publicadas no Supabase
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
    console.error('[sitemap] Erro ao carregar rotas do sitemap:', err)
  }

  return staticRoutes
}
