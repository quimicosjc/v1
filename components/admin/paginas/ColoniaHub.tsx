'use client'

import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'

interface ColoniaHubProps {
  paginas: PaginaInstitucional[]
}

const coloniaTelas = [
  {
    slug: 'colonia-inicio',
    titulo: 'Início',
    tipo: 'Apresentação geral',
    desc: 'Visão geral das unidades de Caraguatatuba e São Sebastião com atalhos de navegação.'
  },
  {
    slug: 'colonia-valores',
    titulo: 'Valores e detalhes',
    tipo: 'Tabela de preços',
    desc: 'Cadastro estruturado de diárias, taxas de hóspedes e regras de acomodação.'
  },
  {
    slug: 'colonia-regulamento',
    titulo: 'Regulamento interno',
    tipo: 'Normas e documentos',
    desc: 'Regras de convivência, proibição de animais, horários e termos de uso.'
  },
  {
    slug: 'colonia-reservas',
    titulo: 'Reservas',
    tipo: 'Procedimentos e contatos',
    desc: 'Orientações para solicitação de reserva e contatos diretos com a secretaria.'
  },
  {
    slug: 'colonia-como-chegar',
    titulo: 'Como chegar',
    tipo: 'Rotas e mapas',
    desc: 'Endereços e localização no mapa das unidades de Caraguatatuba e São Sebastião.'
  },
  {
    slug: 'colonia-fotos',
    titulo: 'Fotos da Colônia',
    tipo: 'Galerias de fotos',
    desc: 'Fotos das acomodações, quartos, cozinhas e arredores das praias.'
  }
]

export default function ColoniaHub({ paginas }: ColoniaHubProps) {
  const mapaPaginas = new Map<string, PaginaInstitucional>()
  paginas.forEach(p => mapaPaginas.set(p.slug, p))

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 6px' }}>
          PÁGINAS DO SITE / SERVIÇOS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#30252a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Colônia de Férias — Gestão de Telas
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '15px' }}>
              Administre os textos, tabela de preços, regulamento e fotos das unidades no Litoral Norte.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/admin/paginas"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '5px',
                border: '1px solid #ced9df',
                background: '#ffffff',
                color: '#30252a',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Voltar às páginas
            </Link>

            <a
              href="/paginas/colonia"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '5px',
                border: '1px solid #ced9df',
                background: '#ffffff',
                color: '#30252a',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Ver no site ↗
            </a>
          </div>
        </div>
      </div>

      {/* Lista das 6 telas da Colônia */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {coloniaTelas.map((tela, idx) => {
          const pagina = mapaPaginas.get(tela.slug)
          const status = pagina?.status || 'publicado'

          return (
            <div
              key={tela.slug}
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: idx < coloniaTelas.length - 1 ? '1px solid #e4dce0' : 'none',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '16px', color: '#30252a' }}>
                    {tela.titulo}
                  </strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '3px',
                      background: status === 'publicado' ? '#e9f3ef' : '#fff2df',
                      color: status === 'publicado' ? '#23634e' : '#825914',
                    }}
                  >
                    {status === 'publicado' ? 'Publicada' : 'Rascunho'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#71636a',
                    }}
                  >
                    • {tela.tipo}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#71636a', margin: 0, lineHeight: '1.4' }}>
                  {tela.desc}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Link
                  href={`/admin/paginas/${tela.slug}`}
                  style={{
                    background: '#861e32',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Editar tela
                </Link>

                <a
                  href={`/paginas/${tela.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver no site"
                  style={{
                    border: '1px solid #ced9df',
                    background: '#ffffff',
                    color: '#71636a',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
