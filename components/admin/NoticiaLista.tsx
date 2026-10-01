'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Noticia } from '@/app/admin/noticias/actions'
import {
  moverParaLixeira,
  atualizarNoticia,
  obterOrdemDestaques,
  salvarOrdemDestaques,
} from '@/app/admin/noticias/actions'

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

  // Gerenciamento dos 4 slots de Destaque da Homepage
  const [destaquesSlots, setDestaquesSlots] = useState<string[]>(() => {
    return noticiasProp.filter((n) => n.destaque).map((n) => n.id).slice(0, 4)
  })
  const [showDestaquesModal, setShowDestaquesModal] = useState(false)
  const [slotAdicionarId, setSlotAdicionarId] = useState('')
  const [salvandoDestaques, setSalvandoDestaques] = useState(false)
  const [toastFeedback, setToastFeedback] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastFeedback(msg)
    setTimeout(() => setToastFeedback(null), 3500)
  }

  // Carrega a ordem salva no Supabase ao montar
  useEffect(() => {
    obterOrdemDestaques().then((slots) => {
      if (slots && slots.length > 0) {
        setDestaquesSlots(slots)
      }
    })
  }, [])

  function handleMoverDestaque(idx: number, direcao: -1 | 1) {
    const novoIdx = idx + direcao
    if (novoIdx < 0 || novoIdx >= destaquesSlots.length) return
    const novo = [...destaquesSlots]
    const temp = novo[idx]
    novo[idx] = novo[novoIdx]
    novo[novoIdx] = temp
    setDestaquesSlots(novo)
  }

  function handleRemoverDestaqueSlot(id: string) {
    setDestaquesSlots((prev) => prev.filter((item) => item !== id))
  }

  function handleAdicionarDestaqueSlot() {
    if (!slotAdicionarId) return
    if (destaquesSlots.length >= 4) {
      showToast('O limite máximo é de 4 notícias em destaque.')
      return
    }
    if (!destaquesSlots.includes(slotAdicionarId)) {
      setDestaquesSlots((prev) => [...prev, slotAdicionarId])
      setSlotAdicionarId('')
    }
  }

  async function handleSalvarOrdemDestaques() {
    setSalvandoDestaques(true)
    const res = await salvarOrdemDestaques(destaquesSlots)
    setSalvandoDestaques(false)
    if ('error' in res) {
      showToast(res.error)
    } else {
      setLista((prev) =>
        prev.map((n) => ({
          ...n,
          destaque: destaquesSlots.includes(n.id),
        }))
      )
      showToast('Ordem dos destaques da Homepage salva com sucesso!')
      setShowDestaquesModal(false)
    }
  }

  async function handleToggleDestaqueRapido(noticiaId: string) {
    const jaEhDestaque = destaquesSlots.includes(noticiaId)
    if (jaEhDestaque) {
      const novosSlots = destaquesSlots.filter((id) => id !== noticiaId)
      setDestaquesSlots(novosSlots)
      setLista((prev) => prev.map((n) => (n.id === noticiaId ? { ...n, destaque: false } : n)))
      await salvarOrdemDestaques(novosSlots)
      showToast('Notícia retirada dos destaques.')
    } else {
      if (destaquesSlots.length >= 4) {
        setShowDestaquesModal(true)
        showToast('Limite de 4 destaques atingido. Organize as posições no modal.')
        return
      }
      const novosSlots = [...destaquesSlots, noticiaId]
      setDestaquesSlots(novosSlots)
      setLista((prev) => prev.map((n) => (n.id === noticiaId ? { ...n, destaque: true } : n)))
      await salvarOrdemDestaques(novosSlots)
      showToast(`Notícia adicionada como ${novosSlots.length}º destaque!`)
    }
  }

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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDestaquesModal(true)}
            style={{
              border: '1px solid #f6deb3',
              background: '#fff2df',
              color: '#825914',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
            }}
          >
            ★ Organizar destaques
          </button>
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
                    {(() => {
                      const pos = destaquesSlots.indexOf(noticia.id)
                      const isDestaque = pos >= 0
                      return (
                        <button
                          onClick={() => handleToggleDestaqueRapido(noticia.id)}
                          title={
                            isDestaque
                              ? `Posição ${pos + 1} nos destaques da Homepage. Clique para remover.`
                              : 'Clique para destacar na Homepage (máximo 4)'
                          }
                          style={{
                            background: isDestaque ? '#fff2df' : 'transparent',
                            color: isDestaque ? '#825914' : '#c0b8bc',
                            border: isDestaque ? '1px solid #f6deb3' : '1px solid #e4dce0',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: isDestaque ? 700 : 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            fontFamily: 'inherit',
                          }}
                        >
                          <span>{isDestaque ? '★' : '☆'}</span>{' '}
                          {isDestaque ? `${pos + 1}º Destaque` : 'Destacar'}
                        </button>
                      )
                    })()}
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
                      {noticia.status === 'publicado' && noticia.slug && (
                        <a
                          href={`/noticias/${noticia.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visualizar no site (nova aba)"
                          style={{
                            border: '1px solid #ced9df',
                            background: '#f8fafb',
                            color: '#861e32',
                            borderRadius: '5px',
                            padding: '7px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'inherit',
                          }}
                        >
                          Ver ↗
                        </a>
                      )}
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

      {/* ── Modal: Organizar Destaques da Homepage ──────────────────────── */}
      {showDestaquesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowDestaquesModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
                  ★ Organizar destaques da Homepage
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
                  Defina as até 4 notícias em destaque e sua ordem exata de exibição. A 1ª matéria abre o bloco na capa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDestaquesModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#71636a' }}
              >
                ✕
              </button>
            </div>

            {/* Slots 1 a 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
              {[0, 1, 2, 3].map((slotIdx) => {
                const idNaVaga = destaquesSlots[slotIdx]
                const noticia = idNaVaga ? lista.find((n) => n.id === idNaVaga) : null

                return (
                  <div
                    key={slotIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: noticia ? '#fcfbfa' : '#f9fafb',
                      border: noticia ? '1px solid #e4dce0' : '1px dashed #ced9df',
                      borderRadius: '6px',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: noticia ? '#861e32' : '#e4dce0',
                        color: noticia ? 'white' : '#71636a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {slotIdx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {noticia ? (
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#30252a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {noticia.titulo}
                          </div>
                          <div style={{ fontSize: '11px', color: '#71636a', marginTop: '2px' }}>
                            {slotIdx === 0 ? '🏆 Destaque Principal' : `Destaque secundário (${slotIdx + 1}ª posição)`}
                            {noticia.status !== 'publicado' && ' • (Não publicada)'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9bb2bf', fontStyle: 'italic' }}>
                          Posição {slotIdx + 1} disponível
                        </span>
                      )}
                    </div>

                    {noticia && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleMoverDestaque(slotIdx, -1)}
                          disabled={slotIdx === 0}
                          title="Subir posição"
                          style={{
                            border: '1px solid #ced9df',
                            background: 'white',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: slotIdx === 0 ? 'default' : 'pointer',
                            opacity: slotIdx === 0 ? 0.4 : 1,
                            fontSize: '12px',
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoverDestaque(slotIdx, 1)}
                          disabled={slotIdx === destaquesSlots.length - 1}
                          title="Descer posição"
                          style={{
                            border: '1px solid #ced9df',
                            background: 'white',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: slotIdx === destaquesSlots.length - 1 ? 'default' : 'pointer',
                            opacity: slotIdx === destaquesSlots.length - 1 ? 0.4 : 1,
                            fontSize: '12px',
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverDestaqueSlot(noticia.id)}
                          title="Retirar dos destaques"
                          style={{
                            border: '1px solid #e8c8ce',
                            background: 'white',
                            color: '#861e32',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Adicionar notícia na vaga */}
            {destaquesSlots.length < 4 && (
              <div
                style={{
                  background: '#f8fafb',
                  border: '1px solid #e4dce0',
                  borderRadius: '6px',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#30252a', display: 'block', marginBottom: '8px' }}>
                  Preencher vaga de destaque:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={slotAdicionarId}
                    onChange={(e) => setSlotAdicionarId(e.target.value)}
                    style={{
                      flex: 1,
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Selecione uma notícia publicada…</option>
                    {lista
                      .filter((n) => !destaquesSlots.includes(n.id) && n.status === 'publicado')
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.titulo}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAdicionarDestaqueSlot}
                    disabled={!slotAdicionarId}
                    style={{
                      background: slotAdicionarId ? '#861e32' : '#e4dce0',
                      color: slotAdicionarId ? 'white' : '#71636a',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: slotAdicionarId ? 'pointer' : 'default',
                    }}
                  >
                    ＋ Inserir
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e4dce0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowDestaquesModal(false)}
                style={{
                  border: '1px solid #ced9df',
                  background: 'white',
                  color: '#30252a',
                  borderRadius: '5px',
                  padding: '9px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarOrdemDestaques}
                disabled={salvandoDestaques}
                style={{
                  background: '#861e32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '9px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: salvandoDestaques ? 0.6 : 1,
                }}
              >
                {salvandoDestaques ? 'Salvando…' : 'Salvar destaques'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#183b4b',
            color: 'white',
            padding: '12px 22px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          {toastFeedback}
        </div>
      )}
    </div>
  )
}
