import type { NextConfig } from 'next'

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com https://platform.instagram.com https://www.youtube.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://quimicosjc.org.br https://*.quimicosjc.org.br https://*.cdninstagram.com https://*.fbcdn.net https://*.ytimg.com https://i.ytimg.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://viacep.com.br",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://*.google.com",
  "media-src 'self' blob: https://*.supabase.co https://quimicosjc.org.br https://*.quimicosjc.org.br",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  // Permite envio de arquivos maiores via Server Actions (fotos, banners, documentos e anexos)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Imagens externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'quimicosjc.org.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.quimicosjc.org.br',
        pathname: '/**',
      },
    ],
  },

  // Cabeçalhos de segurança para todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
      // Arquivos do painel nunca ficam em cache público (S10)
      {
        source: '/admin/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/admin',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },

  // Redirecionamentos 301 de todas as URLs antigas do site oficial (quimicosjc.org.br) para as novas rotas
  async redirects() {
    return [
      { source: '/quem-somos', destination: '/paginas/historia', permanent: true },
      { source: '/diretoria', destination: '/paginas/diretoria', permanent: true },
      { source: '/atendimento', destination: '/paginas/fale-conosco', permanent: true },
      { source: '/fale-conosco', destination: '/paginas/fale-conosco', permanent: true },
      { source: '/homologacao', destination: '/paginas/homologacoes', permanent: true },
      { source: '/atendimento-juridico', destination: '/paginas/juridico', permanent: true },
      { source: '/processos', destination: '/paginas/processos', permanent: true },
      { source: '/convencoes-cct', destination: '/paginas/cct', permanent: true },
      { source: '/convenios', destination: '/paginas/convenios', permanent: true },
      { source: '/colonia-de-ferias', destination: '/paginas/colonia', permanent: true },
      { source: '/colonia-de-ferias/regulamentos', destination: '/paginas/colonia-regulamento', permanent: true },
      { source: '/colonia-de-ferias/valores-detalhes', destination: '/paginas/colonia-valores', permanent: true },
      { source: '/colonia-de-ferias/reservas', destination: '/paginas/colonia-reservas', permanent: true },
      { source: '/colonia-de-ferias/como-chegar', destination: '/paginas/colonia-como-chegar', permanent: true },
      { source: '/colonia-de-ferias/fotos', destination: '/paginas/colonia-fotos', permanent: true },
      { source: '/solicitacoes-carteirinhas', destination: '/paginas/carteirinha', permanent: true },
      { source: '/atualizar-socio', destination: '/paginas/atualizar-cadastro', permanent: true },
      { source: '/ficar-socio', destination: '/paginas/fique-socio', permanent: true },
      { source: '/enviar-denuncia', destination: '/paginas/denuncia', permanent: true },
      { source: '/newsletter', destination: '/paginas/cadastro-noticias', permanent: true },
      { source: '/imprensa', destination: '/jornais', permanent: true },
      { source: '/links-uteis', destination: '/paginas/links-uteis', permanent: true },
    ]
  },
}

export default nextConfig
