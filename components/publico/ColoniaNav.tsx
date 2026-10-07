import React from 'react'
import Link from 'next/link'

interface ColoniaNavProps {
  slugAtual: string
}

export default function ColoniaNav({ slugAtual }: ColoniaNavProps) {
  const abas = [
    { slug: 'colonia', rotulo: '🏖️ Início da Colônia', href: '/paginas/colonia' },
    { slug: 'colonia-valores', rotulo: '💰 Tarifas e Valores', href: '/paginas/colonia-valores' },
    { slug: 'colonia-regulamento', rotulo: '📜 Regulamento Interno', href: '/paginas/colonia-regulamento' },
    { slug: 'colonia-reservas', rotulo: '📅 Reservas & Sorteios', href: '/paginas/colonia-reservas' },
    { slug: 'colonia-como-chegar', rotulo: '🚗 Como Chegar', href: '/paginas/colonia-como-chegar' },
    { slug: 'colonia-fotos', rotulo: '📸 Fotos das Instalações', href: '/paginas/colonia-fotos' },
  ]

  // Só exibe se for uma das páginas da colônia
  const isColonia = slugAtual.startsWith('colonia')
  if (!isColonia) return null

  return (
    <div
      style={{
        background: '#f8fafb',
        border: '1px solid #cbd7de',
        borderRadius: '8px',
        padding: '12px 14px',
        margin: '20px 0 28px 0',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#71636a',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '8px',
        }}
      >
        Navegação da Colônia de Férias (Caraguatatuba & São Sebastião):
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {abas.map((aba) => {
          const ativa = slugAtual === aba.slug
          return (
            <Link
              key={aba.slug}
              href={aba.href}
              style={{
                background: ativa ? '#861e32' : '#ffffff',
                color: ativa ? '#ffffff' : '#30252a',
                border: ativa ? '1px solid #861e32' : '1px solid #cbd7de',
                borderRadius: '5px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: ativa ? 700 : 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: ativa ? '0 2px 4px rgba(134,30,50,0.2)' : 'none',
              }}
            >
              {aba.rotulo}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
