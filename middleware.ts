import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas da aplicação, exceto:
     * - _next/static (arquivos estáticos compilados)
     * - _next/image (otimização de imagens)
     * - favicon.ico, imagens e ícones públicos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
