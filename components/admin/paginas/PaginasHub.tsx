'use client'

import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'

interface PaginasHubProps {
  paginas: PaginaInstitucional[]
}

const gruposOrdem = [
  {
    nome: 'Sindicato',
    descricao: 'Informações institucionais, história, diretoria e contatos da entidade.',
    slugs: ['historia', 'diretoria', 'fique-socio', 'fale-conosco', 'links-uteis', 'privacidade']
  },
  {
    nome: 'Serviços',
    descricao: 'Benefícios, convênios, Colônia de Férias e solicitações dos trabalhadores.',
    slugs: ['convenios', 'colonia', 'cadastro-noticias', 'carteirinha', 'atualizar-cadastro']
  },
  {
    nome: 'Jurídico',
    descricao: 'Plantões de atendimento, ações coletivas no TRT-15, CCTs e homologações.',
    slugs: ['juridico', 'processos', 'cct', 'homologacoes']
  },
  {
    nome: 'Imprensa',
    descricao: 'Publicações sindicais, notícias, edições de jornais e canal de denúncia.',
    slugs: ['lista-noticias', 'boca-no-trombone', 'outros-jornais', 'denuncia']
  }
]

export default function PaginasHub({ paginas }: PaginasHubProps) {
  const mapaPaginas = new Map<string, PaginaInstitucional>()
  paginas.forEach(p => mapaPaginas.set(p.slug, p))

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 6px' }}>
          PÁGINAS DO SITE
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#30252a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Páginas do site
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '15px' }}>
              Administre os textos, cadastros e serviços de cada seção do portal.
            </p>
          </div>

          <a
            href="/"
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
              cursor: 'pointer',
            }}
          >
            Ver site ↗
          </a>
        </div>
      </div>

      {/* Grade de 4 Colunas dos Grupos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {gruposOrdem.map((grupo) => (
          <div
            key={grupo.nome}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e4dce0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Topo do Card de Grupo */}
            <div
              style={{
                background: '#f8fafb',
                padding: '16px 20px',
                borderBottom: '1px solid #e4dce0',
              }}
            >
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#30252a',
                  margin: '0 0 4px',
                }}
              >
                {grupo.nome}
              </h2>
              <p style={{ fontSize: '12px', color: '#71636a', margin: 0, lineHeight: '1.4' }}>
                {grupo.descricao}
              </p>
            </div>

            {/* Lista de Páginas do Grupo */}
            <div style={{ padding: '8px 0' }}>
              {grupo.slugs.map((slug) => {
                const pagina = mapaPaginas.get(slug)
                const titulo = pagina?.titulo || slug
                const status = pagina?.status || 'publicado'
                const isColoniaHub = slug === 'colonia'

                return (
                  <div
                    key={slug}
                    style={{
                      padding: '13px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f0edf0',
                      gap: '10px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#30252a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '3px',
                        }}
                      >
                        {titulo}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                        {isColoniaHub && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#861e32',
                              fontWeight: 600,
                            }}
                          >
                            6 telas vinculadas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <Link
                        href={isColoniaHub ? '/admin/paginas/colonia' : `/admin/paginas/${slug}`}
                        style={{
                          background: '#861e32',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {isColoniaHub ? 'Gerenciar telas' : 'Editar'}
                      </Link>

                      {!isColoniaHub && (
                        <a
                          href={`/paginas/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver página publicada em nova aba"
                          style={{
                            border: '1px solid #ced9df',
                            background: '#ffffff',
                            color: '#71636a',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textDecoration: 'none',
                          }}
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
