'use client'

import { useState, useTransition, useMemo } from 'react'
import type { SolicitacaoItem } from '@/app/admin/solicitacoes/actions'
import {
  atualizarSituacaoSolicitacao,
  salvarNotaInterna,
  reenviarAvisoEmail,
  excluirSolicitacao,
  exportarSolicitacoesCSV,
} from '@/app/admin/solicitacoes/actions'

interface Props {
  solicitacoesIniciais: SolicitacaoItem[]
  usuarioLogado: { id: string; nome: string; papel: string }
}

const TIPO_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  sindicalizacao:         { label: 'Sindicalização',       cor: '#23634e', bg: '#e9f3ef' },
  carteirinha:            { label: 'Carteirinha',          cor: '#365786', bg: '#eaf1fc' },
  'atualizacao-cadastral':{ label: 'Atualização Cadastral',cor: '#754b20', bg: '#fdf4eb' },
  denuncia:               { label: '🔒 Denúncia Sigilosa', cor: '#861e32', bg: '#fbebee' },
  juridico:               { label: 'Plantão Jurídico',     cor: '#4c3575', bg: '#f2eef9' },
  contato:                { label: 'Fale Conosco',         cor: '#556066', bg: '#eef2f5' },
}

export default function SolicitacoesGerenciador({
  solicitacoesIniciais,
  usuarioLogado,
}: Props) {
  const [itens, setItens] = useState<SolicitacaoItem[]>(solicitacoesIniciais)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todas')
  const [filtroSituacao, setFiltroSituacao] = useState<'todas' | 'pendentes' | 'em_atendimento' | 'concluidas'>('todas')
  const [busca, setBusca] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 15

  // Detalhe Modal
  const [detalheItem, setDetalheItem] = useState<SolicitacaoItem | null>(null)
  const [notaTexto, setNotaTexto] = useState<string>('')
  const [salvandoNota, setSalvandoNota] = useState(false)
  const [reenviandoAviso, setReenviandoAviso] = useState(false)

  // Modal de Exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<SolicitacaoItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  function showFeedback(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtragem
  const filtrados = useMemo(() => {
    return itens.filter((item) => {
      // Tipo
      if (filtroTipo !== 'todas') {
        if (filtroTipo === 'outras') {
          if (item.formulario_slug === 'sindicalizacao' || item.formulario_slug === 'carteirinha' || item.formulario_slug === 'atualizacao-cadastral' || item.formulario_slug === 'denuncia') {
            return false
          }
        } else if (item.formulario_slug !== filtroTipo) {
          return false
        }
      }

      // Situação
      if (filtroSituacao === 'pendentes') {
        if (item.situacao !== 'recebida' && item.situacao !== 'nova') return false
      } else if (filtroSituacao === 'em_atendimento') {
        if (item.situacao !== 'em_atendimento') return false
      } else if (filtroSituacao === 'concluidas') {
        if (item.situacao !== 'concluida' && item.situacao !== 'tratada') return false
      }

      // Busca
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim()
        const match =
          item.protocolo.toLowerCase().includes(termo) ||
          (item.nome && item.nome.toLowerCase().includes(termo)) ||
          (item.email && item.email.toLowerCase().includes(termo)) ||
          (item.empresa && item.empresa.toLowerCase().includes(termo)) ||
          (item.cidade && item.cidade.toLowerCase().includes(termo))
        if (!match) return false
      }

      return true
    })
  }, [itens, filtroTipo, filtroSituacao, busca])

  // Contagens
  const totalGeral = itens.length
  const totalPendentes = itens.filter((i) => i.situacao === 'recebida' || i.situacao === 'nova').length
  const totalEmAtendimento = itens.filter((i) => i.situacao === 'em_atendimento').length
  const totalConcluidas = itens.filter((i) => i.situacao === 'concluida' || i.situacao === 'tratada').length

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA
    return filtrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [filtrados, pagina])

  function abrirDetalhe(item: SolicitacaoItem) {
    setDetalheItem(item)
    setNotaTexto(item.nota_interna || '')
  }

  function handleMudarSituacao(novaSituacao: 'recebida' | 'em_atendimento' | 'concluida' | 'nova' | 'tratada') {
    if (!detalheItem) return
    const anterior = detalheItem

    // 1. Atualização Otimista Instantânea (0ms de atraso percebido)
    const atualizado: SolicitacaoItem = {
      ...detalheItem,
      situacao: novaSituacao,
      processado: novaSituacao === 'concluida' || novaSituacao === 'tratada',
      nota_interna: notaTexto,
    }
    setDetalheItem(atualizado)
    setItens((prev) => prev.map((i) => (i.id === detalheItem.id ? atualizado : i)))

    // 2. Sincronização em background com o servidor
    startTransition(async () => {
      const res = await atualizarSituacaoSolicitacao(
        detalheItem.id,
        novaSituacao,
        notaTexto,
        { ...detalheItem.campos, situacao: novaSituacao, nota_interna: notaTexto }
      )
      if ('error' in res) {
        // Reverte em caso de falha de conexão
        setDetalheItem(anterior)
        setItens((prev) => prev.map((i) => (i.id === detalheItem.id ? anterior : i)))
        showFeedback(res.error, 'erro')
      } else {
        showFeedback(`Situação atualizada para "${novaSituacao.replace('_', ' ')}".`)
      }
    })
  }

  async function handleSalvarNota() {
    if (!detalheItem) return
    setSalvandoNota(true)
    const anterior = detalheItem
    const atualizado = { ...detalheItem, nota_interna: notaTexto }

    // Atualização otimista imediata
    setDetalheItem(atualizado)
    setItens((prev) => prev.map((i) => (i.id === detalheItem.id ? atualizado : i)))

    const res = await salvarNotaInterna(
      detalheItem.id,
      notaTexto,
      { ...detalheItem.campos, nota_interna: notaTexto }
    )
    setSalvandoNota(false)
    if ('error' in res) {
      setDetalheItem(anterior)
      setItens((prev) => prev.map((i) => (i.id === detalheItem.id ? anterior : i)))
      showFeedback(res.error, 'erro')
    } else {
      showFeedback('Anotação interna salva com sucesso.')
    }
  }

  async function handleReenviarAviso() {
    if (!detalheItem) return
    setReenviandoAviso(true)
    const res = await reenviarAvisoEmail(detalheItem.id)
    setReenviandoAviso(false)
    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      const atualizado = { ...detalheItem, aviso_email: 'enviado' as const }
      setDetalheItem(atualizado)
      setItens((prev) => prev.map((i) => (i.id === detalheItem.id ? atualizado : i)))
      showFeedback('Aviso reencaminhado com sucesso para a equipe.')
    }
  }

  async function handleConfirmarExclusao() {
    if (!itemParaExcluir) return
    setExcluindo(true)
    const res = await excluirSolicitacao(itemParaExcluir.id)
    setExcluindo(false)
    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setItens((prev) => prev.filter((i) => i.id !== itemParaExcluir.id))
      if (detalheItem?.id === itemParaExcluir.id) setDetalheItem(null)
      setItemParaExcluir(null)
      showFeedback(`Solicitação ${itemParaExcluir.protocolo} excluída.`)
    }
  }

  async function handleExportar() {
    const csv = await exportarSolicitacoesCSV(filtroTipo === 'todas' ? undefined : filtroTipo)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solicitacoes-${filtroTipo}-${new Date().toISOString().split('T')[0]}.csv`
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
            Central de Atendimento
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#30252a', margin: '4px 0 0 0' }}>
            Solicitações
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#71636a' }}>
            Recebimento e acompanhamento de sindicalizações, carteirinhas, atualizações cadastrais e denúncias.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportar}
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
            <span>⬇</span> Exportar planilha
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
          <div style={{ fontSize: '12px', color: '#71636a', fontWeight: 600 }}>Total de solicitações</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#30252a', marginTop: '4px' }}>{totalGeral}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #fed7aa', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#825914', fontWeight: 600 }}>Aguardando atendimento</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#825914', marginTop: '4px' }}>{totalPendentes}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#365786', fontWeight: 600 }}>Em atendimento</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#365786', marginTop: '4px' }}>{totalEmAtendimento}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#23634e', fontWeight: 600 }}>Concluídas / Tratadas</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#23634e', marginTop: '4px' }}>{totalConcluidas}</div>
        </div>
      </div>

      {/* Abas por Tipo de Formulário */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e4dce0',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {[
          { key: 'todas', label: 'Todas as solicitações' },
          { key: 'sindicalizacao', label: 'Sindicalizações' },
          { key: 'carteirinha', label: 'Carteirinhas' },
          { key: 'atualizacao-cadastral', label: 'Atualizações' },
          { key: 'denuncia', label: '🔒 Denúncias Sigilosas' },
          { key: 'outras', label: 'Plantão / Contato' },
        ].map((tab) => {
          const active = filtroTipo === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFiltroTipo(tab.key)
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
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filtros de Situação e Barra de Busca */}
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
        <div style={{ display: 'flex', gap: '6px', background: '#eef2f5', padding: '3px', borderRadius: '6px' }}>
          {[
            { key: 'todas', label: 'Todas situações' },
            { key: 'pendentes', label: 'Pendentes' },
            { key: 'em_atendimento', label: 'Em atendimento' },
            { key: 'concluidas', label: 'Concluídas' },
          ].map((sub) => {
            const active = filtroSituacao === sub.key
            return (
              <button
                key={sub.key}
                type="button"
                onClick={() => {
                  setFiltroSituacao(sub.key as any)
                  setPagina(1)
                }}
                style={{
                  border: 'none',
                  background: active ? 'white' : 'transparent',
                  color: active ? '#30252a' : '#71636a',
                  fontWeight: active ? 600 : 400,
                  fontSize: '13px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {sub.label}
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
            placeholder="Buscar por protocolo, nome, empresa…"
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

      {/* Tabela de Solicitações */}
      <div style={{ background: 'white', border: '1px solid #e4dce0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafb', borderBottom: '1px solid #e4dce0', color: '#71636a', fontSize: '12px' }}>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>PROTOCOLO</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>TIPO</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>SOLICITANTE / EMPRESA</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>DATA / HORA</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>SITUAÇÃO</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#71636a' }}>
                  Nenhuma solicitação encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginados.map((item) => {
                const tipoConf = TIPO_CONFIG[item.formulario_slug] || {
                  label: item.formulario_nome,
                  cor: '#556066',
                  bg: '#eef2f5',
                }

                // Badge de situação
                let badgeBg = '#fff2df'
                let badgeCor = '#825914'
                let badgeLabel = 'Nova'

                if (item.situacao === 'recebida') {
                  badgeBg = '#fff2df'
                  badgeCor = '#825914'
                  badgeLabel = 'Recebida'
                } else if (item.situacao === 'em_atendimento') {
                  badgeBg = '#eaf1fc'
                  badgeCor = '#365786'
                  badgeLabel = 'Em atendimento'
                } else if (item.situacao === 'concluida') {
                  badgeBg = '#e9f3ef'
                  badgeCor = '#23634e'
                  badgeLabel = 'Concluída'
                } else if (item.situacao === 'tratada') {
                  badgeBg = '#e9f3ef'
                  badgeCor = '#23634e'
                  badgeLabel = 'Tratada'
                }

                const dataFormatada = new Date(item.criado_em).toLocaleDateString('pt-BR')
                const horaFormatada = new Date(item.criado_em).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })

                const isDenuncia = item.formulario_slug === 'denuncia'

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f0f4f7',
                      background: isDenuncia ? '#fffcfc' : 'white',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Protocolo */}
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#30252a' }}>
                      {item.protocolo}
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: tipoConf.bg,
                          color: tipoConf.cor,
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {tipoConf.label}
                      </span>
                    </td>

                    {/* Solicitante / Empresa */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#30252a' }}>
                        {isDenuncia ? (
                          <span style={{ color: '#861e32', fontStyle: item.nome ? 'normal' : 'italic' }}>
                            {item.nome || 'Identificação Sigilosa / Anônima'}
                          </span>
                        ) : (
                          item.nome || 'Não informado'
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>
                        {item.empresa && <span>{item.empresa}</span>}
                        {item.cidade && <span> • {item.cidade}</span>}
                        {!item.empresa && !item.cidade && (item.email || item.telefone || '—')}
                      </div>
                    </td>

                    {/* Data / Hora */}
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: '#71636a' }}>
                      <div>{dataFormatada}</div>
                      <div style={{ fontSize: '11px', color: '#9bb2bf' }}>{horaFormatada}</div>
                    </td>

                    {/* Situação */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: badgeBg,
                          color: badgeCor,
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {badgeLabel}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => abrirDetalhe(item)}
                        style={{
                          background: '#861e32',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ver detalhes
                      </button>
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
              {Math.min(pagina * ITENS_POR_PAGINA, filtrados.length)} de {filtrados.length} solicitações
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

      {/* Modal / Drawer de Detalhes da Solicitação */}
      {detalheItem && (
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
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setDetalheItem(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e4dce0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#71636a', fontWeight: 600 }}>
                  {detalheItem.formulario_nome}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#30252a', fontFamily: 'monospace' }}>
                  {detalheItem.protocolo}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetalheItem(null)}
                style={{
                  border: 'none',
                  background: '#f0f4f7',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#71636a',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Alerta de Sigilo para Denúncias (Sugestão 2) */}
              {detalheItem.formulario_slug === 'denuncia' && (
                <div
                  style={{
                    background: '#fbebee',
                    border: '1px solid #e8c8ce',
                    borderRadius: '6px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🔒</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#861e32', fontSize: '14px' }}>
                      Denúncia Sigilosa / Confidencial
                    </div>
                    <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>
                      Este conteúdo é restrito para proteção do trabalhador e não é exportado em planilhas gerais.
                    </div>
                  </div>
                </div>
              )}

              {/* Informações de Envio */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  background: '#f8fafb',
                  border: '1px solid #e4dce0',
                  borderRadius: '6px',
                  padding: '14px',
                  marginBottom: '24px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#71636a' }}>Data de recebimento:</span>
                  <div style={{ fontWeight: 600, color: '#30252a' }}>
                    {new Date(detalheItem.criado_em).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(detalheItem.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#71636a' }}>Situação atual:</span>
                  <div style={{ fontWeight: 700, color: '#861e32', textTransform: 'capitalize' }}>
                    {detalheItem.situacao.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#71636a' }}>Aviso por e-mail:</span>
                  <div style={{ fontWeight: 600, color: detalheItem.aviso_email === 'enviado' ? '#23634e' : '#825914' }}>
                    {detalheItem.aviso_email === 'enviado' ? '✓ Enviado à equipe' : 'Pendente / Não enviado'}
                  </div>
                </div>
              </div>

              {/* Campos Enviados */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '12px' }}>
                  Dados do formulário preenchido
                </h3>
                <div
                  style={{
                    border: '1px solid #e4dce0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  {Object.entries(detalheItem.campos).map(([chave, valor], idx) => {
                    // Oculta metadados internos da exibição da tabela de dados
                    if (['protocolo', 'situacao', 'nota_interna', 'aviso_email', 'anexos', 'campos'].includes(chave)) return null

                    let valorTexto = String(valor ?? '—')
                    if (typeof valor === 'boolean') valorTexto = valor ? 'Sim' : 'Não'
                    if (Array.isArray(valor)) valorTexto = valor.join(', ')

                    return (
                      <div
                        key={chave}
                        style={{
                          display: 'flex',
                          borderBottom: idx === Object.entries(detalheItem.campos).length - 1 ? 'none' : '1px solid #f0f4f7',
                          padding: '10px 14px',
                          fontSize: '13px',
                          background: idx % 2 === 0 ? 'white' : '#fcfdfe',
                        }}
                      >
                        <div style={{ width: '220px', fontWeight: 600, color: '#71636a', flexShrink: 0 }}>
                          {chave.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div style={{ color: '#30252a', wordBreak: 'break-word', flex: 1 }}>
                          {valorTexto}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Anexos (se houver) */}
              {detalheItem.anexos && detalheItem.anexos.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '10px' }}>
                    Anexos enviados ({detalheItem.anexos.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detalheItem.anexos.map((anexo, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafb',
                          border: '1px solid #e4dce0',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📎</span>
                          <span style={{ fontWeight: 600, color: '#30252a' }}>{anexo.nome}</span>
                        </div>
                        <a
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (detalheItem.formulario_slug === 'denuncia') {
                              const conf = window.confirm(
                                'Atenção: este arquivo pode conter evidências sigilosas da denúncia. Deseja abrir?'
                              )
                              if (!conf) e.preventDefault()
                            }
                          }}
                          style={{
                            background: 'white',
                            border: '1px solid #ced9df',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            color: '#861e32',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          Abrir arquivo ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloco de Atendimento e Ações */}
              <div
                style={{
                  background: '#fcfdfe',
                  border: '1px solid #e4dce0',
                  borderRadius: '6px',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', margin: '0 0 14px 0' }}>
                  Ações de Atendimento
                </h3>

                {/* Alternância de Situação */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#71636a', display: 'block', marginBottom: '8px' }}>
                    Alterar situação do pedido:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {detalheItem.formulario_slug === 'sindicalizacao' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMudarSituacao('recebida')}
                          disabled={detalheItem.situacao === 'recebida' || isPending}
                          style={{
                            border: '1px solid #ced9df',
                            background: detalheItem.situacao === 'recebida' ? '#fff2df' : 'white',
                            color: detalheItem.situacao === 'recebida' ? '#825914' : '#30252a',
                            fontWeight: detalheItem.situacao === 'recebida' ? 700 : 500,
                            borderRadius: '5px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          1. Recebida
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMudarSituacao('em_atendimento')}
                          disabled={detalheItem.situacao === 'em_atendimento' || isPending}
                          style={{
                            border: '1px solid #ced9df',
                            background: detalheItem.situacao === 'em_atendimento' ? '#eaf1fc' : 'white',
                            color: detalheItem.situacao === 'em_atendimento' ? '#365786' : '#30252a',
                            fontWeight: detalheItem.situacao === 'em_atendimento' ? 700 : 500,
                            borderRadius: '5px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          2. Iniciar atendimento
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMudarSituacao('concluida')}
                          disabled={detalheItem.situacao === 'concluida' || isPending}
                          style={{
                            border: '1px solid #ced9df',
                            background: detalheItem.situacao === 'concluida' ? '#e9f3ef' : 'white',
                            color: detalheItem.situacao === 'concluida' ? '#23634e' : '#30252a',
                            fontWeight: detalheItem.situacao === 'concluida' ? 700 : 500,
                            borderRadius: '5px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          3. Marcar como Concluída
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMudarSituacao('nova')}
                          disabled={detalheItem.situacao === 'nova' || isPending}
                          style={{
                            border: '1px solid #ced9df',
                            background: detalheItem.situacao === 'nova' ? '#fff2df' : 'white',
                            color: detalheItem.situacao === 'nova' ? '#825914' : '#30252a',
                            fontWeight: detalheItem.situacao === 'nova' ? 700 : 500,
                            borderRadius: '5px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Nova / Pendente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMudarSituacao('tratada')}
                          disabled={detalheItem.situacao === 'tratada' || isPending}
                          style={{
                            border: '1px solid #ced9df',
                            background: detalheItem.situacao === 'tratada' ? '#e9f3ef' : 'white',
                            color: detalheItem.situacao === 'tratada' ? '#23634e' : '#30252a',
                            fontWeight: detalheItem.situacao === 'tratada' ? 700 : 500,
                            borderRadius: '5px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Marcar como Tratada
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Anotação Interna */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#71636a', display: 'block', marginBottom: '6px' }}>
                    Anotação interna da secretaria (visível apenas para a equipe):
                  </label>
                  <textarea
                    rows={3}
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                    placeholder="Ex: Documento conferido junto à empresa em 01/10; aguardando confirmação do associado..."
                    style={{
                      width: '100%',
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleSalvarNota}
                      disabled={salvandoNota}
                      style={{
                        background: '#30252a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {salvandoNota ? 'Salvando…' : 'Salvar anotação'}
                    </button>
                  </div>
                </div>

                {/* Aviso por e-mail & Exclusão */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '14px',
                    borderTop: '1px solid #e4dce0',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleReenviarAviso}
                    disabled={reenviandoAviso}
                    style={{
                      background: 'white',
                      border: '1px solid #ced9df',
                      color: '#30252a',
                      borderRadius: '5px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {reenviandoAviso ? 'Reenviando…' : 'Reenviar aviso por e-mail'}
                  </button>

                  {usuarioLogado.papel === 'admin_ti' && (
                    <button
                      type="button"
                      onClick={() => setItemParaExcluir(detalheItem)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #e8c8ce',
                        color: '#861e32',
                        borderRadius: '5px',
                        padding: '7px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Excluir solicitação
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
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
              Excluir solicitação?
            </h3>
            <p style={{ fontSize: '14px', color: '#71636a', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Tem certeza de que deseja excluir permanentemente a solicitação{' '}
              <strong style={{ color: '#30252a' }}>{itemParaExcluir.protocolo}</strong>? Esta ação é irreversível.
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
