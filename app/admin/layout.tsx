import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/icone-painel-adm.svg?v=5', type: 'image/svg+xml' },
      { url: '/icone-painel-adm.png?v=5', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/icone-painel-adm.png?v=5',
    apple: '/icone-painel-adm.png?v=5',
  },
}

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
