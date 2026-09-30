'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Noticia } from '@/app/admin/noticias/actions'

type Tab = 'todos' | 'rascunho' | 'publicado' | 'programado'

interface NoticiaListaProps {
  noticias: Noticia[]
}

function formatarData(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function BadgeStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    publicado: { label: 'Publicado',   bg: '#e9f3ef', color: '#23634e' },
    rascunho:  { label: 'Rascunho',    bg: '#fff2df', color: '#825914' },
    programado: { label: 'Programado', bg: '#eaf1fc', color: '#365786' },
    lixeira:   { label: 'Lixeira',     bg: '#fce4ea', color: '#861e32' },
  }
  const s = map[status] ?? { label: status, bg: '#f0f0f0', color: '#555' }

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: '4px',
        padding: '3px 9px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}

export default function NoticiaLista({ noticias }: NoticiaListaProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('todos')
  const [busca, setBusca] = useState('')

  const contagens = useMemo(() => ({
    todos:      noticias.length,
    rascunho:   noticias.filter((n) => n.status === 'rascunho').length,
    programado: noticias.filter((n) => n.status === 'programado').length,
    publicado:  noticias.filter((n) => n.status === 'publicado').length,
  }), [noticias])

  const filtradas = useMemo(() => {
    return noticias.filter((n) => {
      const matchTab = tab === 'todos' || n.status === tab
      const matchBusca = busca === '' || n.titulo.toLowerCase().includes(busca.toLowerCase())
      return matchTab && matchBusca
    })
  }, [noticias, tab, busca])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos',      label: 'Todas' },
    { key: 'rascunho',   label: 'Rascunhos' },
    { key: 'programado', label: 'Programadas' },
    { key: 'publicado',  label: 'Publicadas' },
  ]

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
            NOTÍCIAS
          </p>
          <h1 style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.6px', margin: '0', color: '#30252a' }}>
            Gerenciar notícias
          </h1>
        </div>
        <a
          href="/admin/noticias/nova"
          style={{
            background: '#861e32',
            color: 'white',
            borderRadius: '5px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ＋ Criar notícia
        </a>
      </div>

      {/* Card principal */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e4dce0',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Tabs + busca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #e4dce0',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '0' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #861e32' : '2px solid transparent',
                  color: tab === t.key ? '#861e32' : '#71636a',
                  fontWeight: tab === t.key ? 600 : 400,
                  fontSize: '14px',
                  padding: '16px 12px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {t.label}
                <span
                  style={{
                    background: tab === t.key ? '#fce4ea' : '#f0eeef',
                    color: tab === t.key ? '#861e32' : '#71636a',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {contagens[t.key]}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por título…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              border: '1px solid #cbd7de',
              borderRadius: '5px',
              padding: '8px 12px',
              fontSize: '14px',
              width: '220px',
              fontFamily: 'inherit',
              color: '#30252a',
              outline: 'none',
            }}
          />
        </div>

        {/* Tabela */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['NOTÍCIA', 'SITUAÇÃO', 'DATA', 'AÇÃO'].map((col) => (
                <th
                  key={col}
                  style={{
                    background: '#f8fafb',
                    color: '#71636a',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.7px',
                    padding: '13px 24px',
                    textAlign: 'left',
                    borderBottom: '1px solid #e8eef1',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#71636a',
                    fontSize: '14px',
                  }}
                >
                  Nenhuma notícia encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((noticia) => (
                <tr key={noticia.id} style={{ background: 'white' }}>
                  <td
                    style={{
                      padding: '19px 24px',
                      borderBottom: '1px solid #e8eef1',
                      maxWidth: '420px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#30252a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {noticia.titulo || '(sem título)'}
                    </div>
                    {noticia.resumo && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#71636a',
                          marginTop: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {noticia.resumo}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '19px 24px', borderBottom: '1px solid #e8eef1' }}>
                    <BadgeStatus status={noticia.status} />
                  </td>
                  <td
                    style={{
                      padding: '19px 24px',
                      borderBottom: '1px solid #e8eef1',
                      fontSize: '13px',
                      color: '#71636a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatarData(noticia.publicado_em ?? noticia.criado_em)}
                  </td>
                  <td style={{ padding: '19px 24px', borderBottom: '1px solid #e8eef1' }}>
                    <button
                      onClick={() => router.push(`/admin/noticias/${noticia.id}`)}
                      style={{
                        border: '1px solid #ced9df',
                        background: 'white',
                        color: '#30252a',
                        borderRadius: '5px',
                        padding: '7px 14px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
