import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'

const fontBarlow = Barlow({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
})

const fontCondensed = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-condensed',
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
    <html lang="pt-BR" className={`${fontBarlow.variable} ${fontCondensed.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#f7f5f6', color: '#30252a', fontFamily: 'var(--font-barlow), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
