import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Imagens externas permitidas (adicionar domínios conforme necessário)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Cabeçalhos de segurança para todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Arquivos do painel nunca ficam em cache público
      {
        source: '/painel/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },

  // Redireciona rotas antigas do site atual (expandir durante migração)
  async redirects() {
    return [
      // Exemplo — mapear URLs do site atual para as novas quando soubermos
      // { source: '/old-path', destination: '/new-path', permanent: true },
    ]
  },
}

export default nextConfig
