'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Noticia } from '@/app/admin/noticias/actions'
import { moverParaLixeira } from '@/app/admin/noticias/actions'

type Tab = 'todos' | 'rascunho' | 'publicado' | 'programado'

const ITENS_POR_PAGINA = 20

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

// ── Dialog de confirmação de exclusão ──────────────────────────────────────────

interface ConfirmDialogProps {
  titulo: string
  onConfirmar: () => void
  onCancelar: () => void
}

function ConfirmDeleteDialog({ titulo, onConfirmar, onCancelar }: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30,20,25,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#30252a' }}>
          Mover para a lixeira?
        </h2>
        <p style={{ margin: '0 0 24px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
          Mover{' '}
          <strong style={{ color: '#30252a' }}>
            &quot;{titulo}&quot;
          </strong>{' '}
          para a lixeira?
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancelar}
            style={{
              border: '1px solid #ced9df',
              background: 'white',
              color: '#30252a',
              borderRadius: '5px',
              padding: '9px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            style={{
              background: '#861e32',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Mover para lixeira
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NoticiaLista({ noticias: noticiasProp }: NoticiaListaProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('todos')
  const [busca, setBusca] = useState('')
  const [soDestaques, setSoDestaques] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [lista, setLista] = useState<Noticia[]>(noticiasProp)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; titulo: string } | null>(null)

  const contagens = useMemo(() => ({
    todos:      lista.length,
    rascunho:   lista.filter((n) => n.status === 'rascunho').length,
    programado: lista.filter((n) => n.status === 'programado').length,
    publicado:  lista.filter((n) => n.status === 'publicado').length,
  }), [lista])

  const ordemInfo: Record<Tab, string> = {
    publicado:  'data de publicação (mais recente primeiro)',
    programado: 'data de publicação (próxima primeiro)',
    rascunho:   'última atualização',
    todos:      'data de criação',
  }

  const filtradas = useMemo(() => {
    let resultado = lista.filter((n) => {
      const matchTab = tab === 'todos' || n.status === tab
      const matchBusca = busca === '' || n.titulo.toLowerCase().includes(busca.toLowerCase())
      const matchDestaque = !soDestaques || n.destaque
      return matchTab && matchBusca && matchDestaque
    })

    // Ordenação por aba
    resultado = [...resultado].sort((a, b) => {
      if (tab === 'publicado') {
        return new Date(b.publicado_em ?? b.criado_em).getTime() - new Date(a.publicado_em ?? a.criado_em).getTime()
      } else if (tab === 'programado') {
        return new Date(a.publicado_em ?? a.criado_em).getTime() - new Date(b.publicado_em ?? b.criado_em).getTime()
      } else if (tab === 'rascunho') {
        return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
      } else {
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      }
    })

    return resultado
  }, [lista, tab, busca, soDestaques])

  const totalPaginas = Math.ceil(filtradas.length / ITENS_POR_PAGINA)
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const fim = Math.min(inicio + ITENS_POR_PAGINA, filtradas.length)
  const paginaAtual = filtradas.slice(inicio, fim)

  function mudarTab(novaTab: Tab) {
    setTab(novaTab)
    setPagina(1)
  }

  function mudarBusca(valor: string) {
    setBusca(valor)
    setPagina(1)
  }

  function mudarSoDestaques(valor: boolean) {
    setSoDestaques(valor)
    setPagina(1)
  }

  async function handleApagar(id: string, titulo: string) {
    setConfirmDelete({ id, titulo })
  }

  async function confirmarApagar() {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    const result = await moverParaLixeira(id)
    if ('ok' in result) {
      setLista((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos',      label: 'Todas' },
    { key: 'rascunho',   label: 'Rascunhos' },
    { key: 'programado', label: 'Programadas' },
    { key: 'publicado',  label: 'Publicadas' },
  ]

  // Gerar páginas para paginação
  function gerarPaginas(): Array<number | '...'> {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    }
    const paginas: Array<number | '...'> = [1]
    if (pagina > 3) paginas.push('...')
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) {
      paginas.push(i)
    }
    if (pagina < totalPaginas - 2) paginas.push('...')
    paginas.push(totalPaginas)
    return paginas
  }

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
        {/* Tabs + filtros + busca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #e4dce0',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0', alignItems: 'center', flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => mudarTab(t.key)}
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

            {/* Checkbox somente destaques */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#71636a',
                cursor: 'pointer',
                marginLeft: '8px',
                padding: '16px 0 14px',
              }}
            >
              <input
                type="checkbox"
                checked={soDestaques}
                onChange={(e) => mudarSoDestaques(e.target.checked)}
                style={{ accentColor: '#861e32', cursor: 'pointer' }}
              />
              Somente destaques
            </label>
          </div>

          <input
            type="text"
            placeholder="Buscar por título…"
            value={busca}
            onChange={(e) => mudarBusca(e.target.value)}
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

        {/* Info de ordenação + contagem */}
        <div
          style={{
            padding: '8px 24px',
            borderBottom: '1px solid #f0eeef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: '#71636a' }}>
            Ordenado por: {ordemInfo[tab]}
          </span>
          {filtradas.length > 0 && (
            <span style={{ fontSize: '12px', color: '#71636a' }}>
              {inicio + 1}–{fim} de {filtradas.length} notícia{filtradas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tabela */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['NOTÍCIA', 'DESTAQUE', 'SITUAÇÃO', 'DATA', 'AÇÃO'].map((col) => (
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
            {paginaAtual.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
              paginaAtual.map((noticia) => (
                <tr key={noticia.id} style={{ background: 'white' }}>
                  <td
                    style={{
                      padding: '19px 24px',
                      borderBottom: '1px solid #e8eef1',
                      maxWidth: '380px',
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
                    {noticia.destaque ? (
                      <span
                        style={{
                          background: '#fff2df',
                          color: '#825914',
                          borderRadius: '4px',
                          padding: '3px 9px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ★ Destaque
                      </span>
                    ) : null}
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      <button
                        onClick={() => handleApagar(noticia.id, noticia.titulo)}
                        style={{
                          border: '1px solid #e8c8ce',
                          background: 'white',
                          color: '#861e32',
                          borderRadius: '5px',
                          padding: '7px 14px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Lixeira
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e4dce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setPagina(1)}
              disabled={pagina === 1}
              style={{
                border: '1px solid #ced9df',
                background: 'white',
                color: pagina === 1 ? '#c0b8bc' : '#30252a',
                borderRadius: '5px',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: pagina === 1 ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Início
            </button>

            {gerarPaginas().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '6px 4px', color: '#71636a', fontSize: '13px' }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPagina(p as number)}
                  style={{
                    border: '1px solid ' + (pagina === p ? '#861e32' : '#ced9df'),
                    background: pagina === p ? '#861e32' : 'white',
                    color: pagina === p ? 'white' : '#30252a',
                    borderRadius: '5px',
                    padding: '6px 11px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: pagina === p ? 600 : 400,
                    minWidth: '34px',
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPagina(totalPaginas)}
              disabled={pagina === totalPaginas}
              style={{
                border: '1px solid #ced9df',
                background: 'white',
                color: pagina === totalPaginas ? '#c0b8bc' : '#30252a',
                borderRadius: '5px',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: pagina === totalPaginas ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Fim
            </button>
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      {confirmDelete && (
        <ConfirmDeleteDialog
          titulo={confirmDelete.titulo || '(sem título)'}
          onConfirmar={confirmarApagar}
          onCancelar={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
