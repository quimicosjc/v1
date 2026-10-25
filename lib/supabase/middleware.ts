import { createServerClient } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Atualiza e valida a sessão do usuário no Supabase para proteção de rotas.
 * Garante que rotas administrativas (/admin/...) exijam login válido.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Rotas públicas não precisam consultar o Supabase Auth no Middleware.
  // Isso garante carregamento instantâneo e evita erro 504 se o banco oscilar.
  if (!pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  // Se não houver nenhum cookie de sessão do Supabase (sb-*), evita chamada de rede desnecessária
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  if (!hasSupabaseCookie) {
    if (!pathname.startsWith('/admin/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      supabaseResponse = NextResponse.next({
        request,
      })
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      )
    },
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  )

  // Obtém o usuário atual com timeout de segurança (3,5s) para nunca travar o Middleware
  let user = null
  try {
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 3500)
    )
    const result = await Promise.race([authPromise, timeoutPromise])
    user = result?.data?.user ?? null
  } catch {
    user = null
  }

  // Proteção: se tentar acessar qualquer rota /admin (exceto login) sem estar logado
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Se já estiver logado e tentar acessar a página de login, redireciona para o painel
  if (pathname === '/admin/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

