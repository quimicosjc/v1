import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

// ─── Metadados padrão do site ────────────────────────────────────────────────
// Cada página pode sobrescrever esses valores individualmente
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://quimicosjc.org.br'
  ),
  title: {
    default: 'Sindicato dos Químicos de SJC e Região',
    template: '%s | Sindicato dos Químicos de SJC',
  },
  description:
    'Sindicato dos Trabalhadores nas Indústrias Químicas, Farmacêuticas, Plásticos e Similares de São José dos Campos e Região.',
  openGraph: {
    siteName: 'Sindicato dos Químicos de SJC',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={fontSans.className}>
      <body style={{ margin: 0, padding: 0, background: '#f7f5f6', color: '#30252a', fontFamily: 'inherit' }}>
        {children}
      </body>
    </html>
  )
}
