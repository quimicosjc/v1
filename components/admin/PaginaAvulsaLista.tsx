'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { PaginaAvulsa } from '@/app/admin/avulsas/actions'
import { moverParaLixeira } from '@/app/admin/avulsas/actions'

type Tab = 'todos' | 'rascunho' | 'publicado' | 'programado'

const ITENS_POR_PAGINA = 20

interface PaginaAvulsaListaProps {
  paginas: PaginaAvulsa[]
}

function formatarDataHora(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BadgeStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    publicado: { label: 'Publicada',   bg: '#e9f3ef', color: '#23634e' },
    rascunho:  { label: 'Rascunho',    bg: '#fff2df', color: '#825914' },
    programado: { label: 'Programada', bg: '#eaf1fc', color: '#365786' },
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
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#30252a' }}>
          Mover para a lixeira?
        </h2>
        <p style={{ margin: '0 0 24px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
          Deseja mover a página{' '}
          <strong style={{ color: '#30252a' }}>
            &quot;{titulo}&quot;
          </strong>{' '}
          para a lixeira? Ela ficará inacessível publicamente até ser restaurada.
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

export default function PaginaAvulsaLista({ paginas: paginasProp }: PaginaAvulsaListaProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('todos')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [lista, setLista] = useState<PaginaAvulsa[]>(paginasProp)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; titulo: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Contagens
  const contagens = useMemo(() => {
    return {
      todos: lista.length,
      rascunho: lista.filter((p) => p.status === 'rascunho').length,
      publicado: lista.filter((p) => p.status === 'publicado').length,
      programado: lista.filter((p) => p.status === 'programado').length,
    }
  }, [lista])

  // Filtragem e ordenação por última alteração (atualizado_em DESC)
  const filtradas = useMemo(() => {
    return lista
      .filter((p) => {
        if (tab !== 'todos' && p.status !== tab) return false
        if (busca.trim()) {
          const termo = busca.toLowerCase()
          const matchTitulo = p.titulo.toLowerCase().includes(termo)
          const matchSlug = p.slug.toLowerCase().includes(termo)
          const matchSub = (p.subtitulo ?? '').toLowerCase().includes(termo)
          if (!matchTitulo && !matchSlug && !matchSub) return false
        }
        return true
      })
      .sort((a, b) => {
        const dataA = new Date(a.atualizado_em || a.criado_em).getTime()
        const dataB = new Date(b.atualizado_em || b.criado_em).getTime()
        return dataB - dataA
      })
  }, [lista, tab, busca])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const fim = Math.min(inicio + ITENS_POR_PAGINA, filtradas.length)
  const paginaAtual = filtradas.slice(inicio, fim)

  function mudarTab(novaTab: Tab) {
    setTab(novaTab)
    setPagina(1)
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return
    const { id, titulo } = confirmDelete
    setConfirmDelete(null)

    const res = await moverParaLixeira(id)
    if ('error' in res) {
      showToast(res.error)
    } else {
      setLista((prev) => prev.filter((p) => p.id !== id))
      showToast(`Página "${titulo}" movida para a lixeira.`)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos',      label: 'Todas' },
    { key: 'rascunho',   label: 'Rascunhos' },
    { key: 'programado', label: 'Programadas' },
    { key: 'publicado',  label: 'Publicadas' },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#183b4b',
            color: 'white',
            padding: '13px 23px',
            borderRadius: '6px',
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 2000,
          }}
        >
          {toast}
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <ConfirmDeleteDialog
          titulo={confirmDelete.titulo}
          onConfirmar={handleConfirmDelete}
          onCancelar={() => setConfirmDelete(null)}
        />
      )}

      {/* Topo: Título + Botão Criar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#861e32',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            PÁGINAS AVULSAS
          </div>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: '28px',
              fontWeight: 700,
              color: '#30252a',
            }}
          >
            Páginas avulsas
          </h1>
          <p style={{ margin: 0, color: '#71636a', fontSize: '15px' }}>
            Conteúdos com endereço próprio sem entrada automática no menu ou nas listas de notícias.
          </p>
        </div>

        <a
          href="/admin/avulsas/nova"
          style={{
            background: '#861e32',
            color: 'white',
            borderRadius: '5px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(134,30,50,0.2)',
          }}
        >
          ＋ Criar página avulsa
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
        {/* Abas e Filtros */}
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
          </div>

          {/* Campo de Busca */}
          <div style={{ padding: '10px 0' }}>
            <input
              type="text"
              placeholder="Buscar título ou endereço…"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPagina(1)
              }}
              style={{
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: '#30252a',
                outline: 'none',
                width: '240px',
              }}
            />
          </div>
        </div>

        {/* Info de ordenação e contagem */}
        <div
          style={{
            padding: '8px 24px',
            borderBottom: '1px solid #f0eeef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#71636a',
            background: '#fafbfc',
          }}
        >
          <span>Ordenado por: última alteração (mais recentes primeiro)</span>
          {filtradas.length > 0 && (
            <span>
              {inicio + 1}–{fim} de {filtradas.length} página{filtradas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tabela Responsiva */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr>
                {['PÁGINA AVULSA', 'ENDEREÇO (SLUG)', 'SITUAÇÃO', 'ÚLTIMA ALTERAÇÃO', 'AÇÕES'].map((col) => (
                  <th
                    key={col}
                    style={{
                      background: '#f8fafb',
                      color: '#71636a',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.7px',
                      padding: '13px 24px',
                      textAlign: col === 'AÇÕES' ? 'right' : 'left',
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
                    Nenhuma página avulsa encontrada.
                  </td>
                </tr>
              ) : (
                paginaAtual.map((p) => (
                  <tr key={p.id} style={{ background: 'white' }}>
                    <td
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #e8eef1',
                        maxWidth: '340px',
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
                        {p.titulo || '(sem título)'}
                      </div>
                      {p.subtitulo && (
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
                          {p.subtitulo}
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #e8eef1',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#65172a',
                      }}
                    >
                      /paginas/{p.slug}
                    </td>

                    <td style={{ padding: '18px 24px', borderBottom: '1px solid #e8eef1' }}>
                      <BadgeStatus status={p.status} />
                    </td>

                    <td
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #e8eef1',
                        fontSize: '13px',
                        color: '#71636a',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatarDataHora(p.atualizado_em || p.criado_em)}
                    </td>

                    <td
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #e8eef1',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {p.status === 'publicado' && (
                          <a
                            href={`/paginas/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              border: '1px solid #ced9df',
                              background: 'white',
                              color: '#30252a',
                              borderRadius: '4px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Ver no site ↗
                          </a>
                        )}
                        <a
                          href={`/admin/avulsas/${p.id}`}
                          style={{
                            border: '1px solid #861e32',
                            background: 'white',
                            color: '#861e32',
                            borderRadius: '4px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          Editar
                        </a>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ id: p.id, titulo: p.titulo || 'Página sem título' })}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#71636a',
                            padding: '5px 8px',
                            fontSize: '12px',
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
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e4dce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#71636a',
              background: '#f8fafb',
            }}
          >
            <div>
              Mostrando {inicio + 1}–{fim} de {filtradas.length} página{filtradas.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{
                  border: '1px solid #ced9df',
                  background: 'white',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  cursor: pagina === 1 ? 'default' : 'pointer',
                  opacity: pagina === 1 ? 0.4 : 1,
                  fontFamily: 'inherit',
                }}
              >
                Anterior
              </button>
              <span style={{ padding: '4px 8px', fontWeight: 600, color: '#30252a' }}>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                style={{
                  border: '1px solid #ced9df',
                  background: 'white',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  cursor: pagina === totalPaginas ? 'default' : 'pointer',
                  opacity: pagina === totalPaginas ? 0.4 : 1,
                  fontFamily: 'inherit',
                }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
