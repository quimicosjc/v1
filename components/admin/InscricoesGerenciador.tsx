'use client'

import { useState, useTransition, useMemo } from 'react'
import type { InscricaoItem } from '@/app/admin/inscricoes/actions'
import {
  alternarStatusInscricao,
  excluirInscricao,
  exportarInscricoesCSV,
} from '@/app/admin/inscricoes/actions'

interface Props {
  inscricoesIniciais: InscricaoItem[]
  usuarioLogado: { id: string; nome: string; papel: string }
}

export default function InscricoesGerenciador({
  inscricoesIniciais,
  usuarioLogado,
}: Props) {
  const [itens, setItens] = useState<InscricaoItem[]>(inscricoesIniciais)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativas' | 'canceladas'>('todas')
  const [busca, setBusca] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 15

  // Modal de Exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<InscricaoItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  function showFeedback(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtragem
  const filtrados = useMemo(() => {
    return itens.filter((item) => {
      if (filtroStatus === 'ativas' && !item.ativo) return false
      if (filtroStatus === 'canceladas' && item.ativo) return false

      if (busca.trim()) {
        const termo = busca.toLowerCase().trim()
        const match =
          (item.nome && item.nome.toLowerCase().includes(termo)) ||
          (item.email && item.email.toLowerCase().includes(termo))
        if (!match) return false
      }

      return true
    })
  }, [itens, filtroStatus, busca])

  // Contagens
  const totalGeral = itens.length
  const totalAtivas = itens.filter((i) => i.ativo).length
  const totalCanceladas = itens.filter((i) => !i.ativo).length

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA
    return filtrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [filtrados, pagina])

  // Ação de alternar status
  function handleAlternarStatus(item: InscricaoItem) {
    const novoStatus = !item.ativo
    startTransition(async () => {
      const res = await alternarStatusInscricao(item.id, novoStatus)
      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        setItens((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ativo: novoStatus } : i))
        )
        showFeedback(
          novoStatus
            ? `Inscrição de ${item.email} reativada.`
            : `Inscrição de ${item.email} cancelada.`
        )
      }
    })
  }

  // Ação de exclusão
  async function handleConfirmarExclusao() {
    if (!itemParaExcluir) return
    setExcluindo(true)
    const res = await excluirInscricao(itemParaExcluir.id)
    setExcluindo(false)
    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setItens((prev) => prev.filter((i) => i.id !== itemParaExcluir.id))
      showFeedback(`Inscrição de ${itemParaExcluir.email} excluída.`)
      setItemParaExcluir(null)
    }
  }

  // Ação de cópia de e-mails ativos (Sugestão 4)
  function handleCopiarEmailsAtivos() {
    const ativos = itens.filter((i) => i.ativo && i.email).map((i) => i.email.trim())
    if (ativos.length === 0) {
      showFeedback('Nenhum e-mail ativo para copiar.', 'erro')
      return
    }

    const texto = ativos.join(', ')
    navigator.clipboard.writeText(texto)
    showFeedback(`${ativos.length} e-mails copiados! Pronto para colar no campo CCO.`)
  }

  // Ação de exportar CSV
  async function handleExportarCSV() {
    const csv = await exportarInscricoesCSV(filtroStatus === 'todas' ? undefined : filtroStatus)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscricoes-noticias-${filtroStatus}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showFeedback('Planilha exportada com sucesso.')
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71636a', fontWeight: 600 }}>
            Comunicação & Imprensa
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#30252a', margin: '4px 0 0 0' }}>
            Cadastro para notícias
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#71636a' }}>
            Lista de trabalhadores e interessados que solicitaram o recebimento de notícias e informes sindicais.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Botão de Cópia Rápida para CCO (Sugestão 4) */}
          <button
            type="button"
            onClick={handleCopiarEmailsAtivos}
            style={{
              background: '#861e32',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(134,30,50,0.2)',
            }}
          >
            <span>📋</span> Copiar e-mails ativos
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            style={{
              background: 'white',
              border: '1px solid #ced9df',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#30252a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⬇</span> Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: 'white', border: '1px solid #e4dce0', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#71636a', fontWeight: 600 }}>Total de inscritos</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#30252a', marginTop: '4px' }}>{totalGeral}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#23634e', fontWeight: 600 }}>Inscrições ativas</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#23634e', marginTop: '4px' }}>{totalAtivas}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e4dce0', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#71636a', fontWeight: 600 }}>Inscrições canceladas</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#71636a', marginTop: '4px' }}>{totalCanceladas}</div>
        </div>
      </div>

      {/* Abas e Barra de Busca */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e4dce0' }}>
          {[
            { key: 'todas', label: `Todas (${totalGeral})` },
            { key: 'ativas', label: `Ativas (${totalAtivas})` },
            { key: 'canceladas', label: `Canceladas (${totalCanceladas})` },
          ].map((tab) => {
            const active = filtroStatus === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFiltroStatus(tab.key as any)
                  setPagina(1)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#861e32' : '#71636a',
                  borderBottom: active ? '2px solid #861e32' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por nome ou e-mail…"
            style={{
              border: '1px solid #cbd7de',
              borderRadius: '5px',
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
              width: '280px',
              background: 'white',
            }}
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              style={{
                border: '1px solid #ced9df',
                background: 'white',
                color: '#71636a',
                borderRadius: '5px',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Inscrições */}
      <div style={{ background: 'white', border: '1px solid #e4dce0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafb', borderBottom: '1px solid #e4dce0', color: '#71636a', fontSize: '12px' }}>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>NOME</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>E-MAIL</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>DATA DE CADASTRO</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>SITUAÇÃO</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#71636a' }}>
                  Nenhum cadastro de notícias encontrado.
                </td>
              </tr>
            ) : (
              paginados.map((item) => {
                const dataFormatada = new Date(item.criado_em).toLocaleDateString('pt-BR')

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f0f4f7',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#30252a' }}>
                      {item.nome || 'Não informado'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#30252a', fontFamily: 'monospace', fontSize: '13px' }}>
                      {item.email}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#71636a', fontSize: '13px' }}>
                      {dataFormatada}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: item.ativo ? '#e9f3ef' : '#f0f4f7',
                          color: item.ativo ? '#23634e' : '#71636a',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.ativo ? 'Ativa' : 'Cancelada'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleAlternarStatus(item)}
                          disabled={isPending}
                          style={{
                            background: 'white',
                            border: '1px solid #ced9df',
                            borderRadius: '4px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: item.ativo ? '#71636a' : '#23634e',
                            cursor: 'pointer',
                          }}
                        >
                          {item.ativo ? 'Cancelar' : 'Reativar'}
                        </button>

                        {usuarioLogado.papel === 'admin_ti' && (
                          <button
                            type="button"
                            onClick={() => setItemParaExcluir(item)}
                            title="Excluir cadastro (exclusivo Administrador)"
                            style={{
                              background: 'white',
                              border: '1px solid #e8c8ce',
                              borderRadius: '4px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              color: '#861e32',
                              cursor: 'pointer',
                            }}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #e4dce0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: '#71636a',
              background: '#f8fafb',
            }}
          >
            <div>
              Mostrando {Math.min((pagina - 1) * ITENS_POR_PAGINA + 1, filtrados.length)}–
              {Math.min(pagina * ITENS_POR_PAGINA, filtrados.length)} de {filtrados.length} cadastros
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
                }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Exclusão */}
      {itemParaExcluir && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setItemParaExcluir(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#861e32', margin: '0 0 12px 0' }}>
              Excluir cadastro de notícias?
            </h3>
            <p style={{ fontSize: '14px', color: '#71636a', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Tem certeza de que deseja remover permanentemente o e-mail{' '}
              <strong style={{ color: '#30252a' }}>{itemParaExcluir.email}</strong> da lista de notícias?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
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
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                style={{
                  background: '#861e32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '9px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: excluindo ? 0.6 : 1,
                }}
              >
                {excluindo ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.tipo === 'erro' ? '#861e32' : '#183b4b',
            color: 'white',
            padding: '12px 22px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
