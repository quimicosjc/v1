'use client'

import { useState, useTransition, useMemo } from 'react'
import type { PublicacaoJornal, EdicaoJornal, EdicaoFormData } from '@/app/admin/jornais/actions'
import {
  criarEdicao,
  atualizarEdicao,
  excluirEdicao,
  criarPublicacao,
  uploadArquivoJornal,
} from '@/app/admin/jornais/actions'

interface Props {
  publicacoesIniciais: PublicacaoJornal[]
  edicoesIniciais: EdicaoJornal[]
  usuarioLogado: { id: string; nome: string; papel: string }
}

export default function JornaisGerenciador({
  publicacoesIniciais,
  edicoesIniciais,
  usuarioLogado,
}: Props) {
  const [publicacoes, setPublicacoes] = useState<PublicacaoJornal[]>(publicacoesIniciais)
  const [edicoes, setEdicoes] = useState<EdicaoJornal[]>(edicoesIniciais)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  // Filtros
  const [filtroPub, setFiltroPub] = useState<string>('todas')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'publicado' | 'rascunho'>('todas')
  const [busca, setBusca] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 12

  // Modais
  const [showEdicaoModal, setShowEdicaoModal] = useState(false)
  const [edicaoEditando, setEdicaoEditando] = useState<EdicaoJornal | null>(null)
  const [showPubModal, setShowPubModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [edicaoParaExcluir, setEdicaoParaExcluir] = useState<EdicaoJornal | null>(null)

  // Estado do formulário de edição
  const [formPubId, setFormPubId] = useState(publicacoes[0]?.id || '')
  const [formNumero, setFormNumero] = useState<string>('')
  const [formComplemento, setFormComplemento] = useState('')
  const [formTitulo, setFormTitulo] = useState('')
  const [formSubtitulo, setFormSubtitulo] = useState('')
  const [formDataEdicao, setFormDataEdicao] = useState('')
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formPdfNome, setFormPdfNome] = useState('')
  const [formCapaUrl, setFormCapaUrl] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)

  // Estado do formulário de nova publicação
  const [novoPubNome, setNovoPubNome] = useState('')
  const [novoPubCor, setNovoPubCor] = useState('#65172A')

  function showFeedback(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtragem e Paginação
  const edicoesFiltradas = useMemo(() => {
    return edicoes.filter((e) => {
      const matchPub = filtroPub === 'todas' || e.publicacao_id === filtroPub
      const matchStatus = filtroStatus === 'todas' || e.status === filtroStatus
      const matchBusca =
        busca === '' ||
        e.numero.toString().includes(busca) ||
        (e.titulo && e.titulo.toLowerCase().includes(busca.toLowerCase())) ||
        (e.complemento && e.complemento.toLowerCase().includes(busca.toLowerCase()))
      return matchPub && matchStatus && matchBusca
    })
  }, [edicoes, filtroPub, filtroStatus, busca])

  const totalPaginas = Math.ceil(edicoesFiltradas.length / ITENS_POR_PAGINA)
  const edicoesPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA
    return edicoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [edicoesFiltradas, pagina])

  function abrirNovaEdicao() {
    setEdicaoEditando(null)
    setFormPubId(publicacoes[0]?.id || '')
    setFormNumero('')
    setFormComplemento('')
    setFormTitulo('')
    setFormSubtitulo('')
    setFormDataEdicao(new Date().toISOString().slice(0, 10))
    setFormPdfUrl('')
    setFormPdfNome('')
    setFormCapaUrl('')
    setShowEdicaoModal(true)
  }

  function abrirEditarEdicao(item: EdicaoJornal) {
    setEdicaoEditando(item)
    setFormPubId(item.publicacao_id)
    setFormNumero(String(item.numero))
    setFormComplemento(item.complemento || '')
    setFormTitulo(item.titulo || '')
    setFormSubtitulo(item.subtitulo || '')
    setFormDataEdicao(item.data_edicao || '')
    setFormPdfUrl(item.pdf_url || '')
    setFormPdfNome(item.pdf_url ? 'Arquivo PDF anexado' : '')
    setFormCapaUrl(item.capa_url || '')
    setShowEdicaoModal(true)
  }

  async function handleUploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      showFeedback('Selecione um arquivo PDF válido.', 'erro')
      return
    }

    setUploadingPdf(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    const res = await uploadArquivoJornal(formData, 'pdf')
    setUploadingPdf(false)

    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setFormPdfUrl(res.url)
      setFormPdfNome(res.nome)
      showFeedback('PDF carregado com sucesso!')
    }
  }

  async function handleUploadCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCapa(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    const res = await uploadArquivoJornal(formData, 'capa')
    setUploadingCapa(false)

    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setFormCapaUrl(res.url)
      showFeedback('Capa personalizada carregada!')
    }
  }

  function handleSalvarEdicao(statusDestino: 'rascunho' | 'publicado') {
    const num = parseInt(formNumero, 10)
    if (isNaN(num) || num <= 0) {
      showFeedback('Informe o número da edição.', 'erro')
      return
    }

    if (statusDestino === 'publicado') {
      if (!formDataEdicao) {
        showFeedback('A data da edição é obrigatória para publicar.', 'erro')
        return
      }
      if (!formPdfUrl) {
        showFeedback('O arquivo PDF da edição é obrigatório para publicar.', 'erro')
        return
      }
    }

    const payload: EdicaoFormData = {
      publicacao_id: formPubId,
      numero: num,
      complemento: formComplemento.trim() || null,
      data_edicao: formDataEdicao || null,
      titulo: formTitulo.trim() || `Edição ${num}`,
      subtitulo: formSubtitulo.trim() || null,
      pdf_url: formPdfUrl || null,
      capa_url: formCapaUrl || null,
      status: statusDestino,
    }

    startTransition(async () => {
      if (edicaoEditando) {
        const res = await atualizarEdicao(edicaoEditando.id, payload)
        if ('error' in res) {
          showFeedback(res.error, 'erro')
        } else {
          setEdicoes((prev) =>
            prev.map((e) =>
              e.id === edicaoEditando.id
                ? {
                    ...e,
                    ...payload,
                    publicacao_nome:
                      publicacoes.find((p) => p.id === formPubId)?.nome || e.publicacao_nome,
                    publicacao_cor:
                      publicacoes.find((p) => p.id === formPubId)?.cor_hex || e.publicacao_cor,
                  }
                : e
            )
          )
          showFeedback(
            statusDestino === 'publicado'
              ? 'Edição publicada com sucesso!'
              : 'Rascunho da edição salvo!'
          )
          setShowEdicaoModal(false)
        }
      } else {
        const res = await criarEdicao(payload)
        if ('error' in res) {
          showFeedback(res.error, 'erro')
        } else {
          const nova: EdicaoJornal = {
            id: res.id || String(Date.now()),
            publicacao_id: formPubId,
            publicacao_nome:
              publicacoes.find((p) => p.id === formPubId)?.nome || 'Boca no Trombone',
            publicacao_cor:
              publicacoes.find((p) => p.id === formPubId)?.cor_hex || '#65172A',
            numero: num,
            complemento: formComplemento.trim() || null,
            data_edicao: formDataEdicao || null,
            titulo: formTitulo.trim() || `Edição ${num}`,
            subtitulo: formSubtitulo.trim() || null,
            pdf_url: formPdfUrl || null,
            capa_url: formCapaUrl || null,
            status: statusDestino,
            criado_em: new Date().toISOString(),
          }
          setEdicoes((prev) => [nova, ...prev].sort((a, b) => Number(b.numero) - Number(a.numero)))
          showFeedback(
            statusDestino === 'publicado'
              ? 'Edição publicada com sucesso!'
              : 'Rascunho criado com sucesso!'
          )
          setShowEdicaoModal(false)
        }
      }
    })
  }

  function handleCadastrarPublicacao(e: React.FormEvent) {
    e.preventDefault()
    if (!novoPubNome.trim()) return

    startTransition(async () => {
      const res = await criarPublicacao({
        nome: novoPubNome.trim(),
        cor_hex: novoPubCor,
      })

      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        const nova: PublicacaoJornal = {
          id: res.id || String(Date.now()),
          nome: novoPubNome.trim(),
          cor_hex: novoPubCor,
          ativo: true,
          ordem: publicacoes.length + 1,
          criado_em: new Date().toISOString(),
        }
        setPublicacoes((prev) => [...prev, nova])
        setFormPubId(nova.id)
        setShowPubModal(false)
        setNovoPubNome('')
        showFeedback(`Publicação "${nova.nome}" cadastrada com sucesso!`)
      }
    })
  }

  function handleConfirmarExclusao() {
    if (!edicaoParaExcluir) return
    startTransition(async () => {
      const res = await excluirEdicao(edicaoParaExcluir.id)
      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        setEdicoes((prev) => prev.filter((e) => e.id !== edicaoParaExcluir.id))
        showFeedback(`Edição nº ${edicaoParaExcluir.numero} excluída com sucesso.`)
        setShowDeleteModal(false)
        setEdicaoParaExcluir(null)
      }
    })
  }

  // Estilos Padronizados v9
  const btnPrimario: React.CSSProperties = {
    background: '#861e32',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const btnNeutro: React.CSSProperties = {
    border: '1px solid #ced9df',
    background: 'white',
    color: '#30252a',
    borderRadius: '5px',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#30252a',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#30252a',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── Topo do módulo ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#861e32',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Jornais e Publicações
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
            Jornais
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#71636a' }}>
            Cadastre publicações e organize suas edições impressas em formato PDF.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setShowPubModal(true)} style={btnNeutro}>
            ＋ Cadastrar jornal
          </button>
          <button type="button" onClick={abrirNovaEdicao} style={btnPrimario}>
            ＋ Adicionar edição
          </button>
        </div>
      </div>

      {/* ── Barra de Filtros e Busca ─────────────────────────────────────── */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e4dce0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Seletor de Publicação */}
          <div style={{ minWidth: '200px' }}>
            <select
              value={filtroPub}
              onChange={(e) => {
                setFiltroPub(e.target.value)
                setPagina(1)
              }}
              style={inputStyle}
            >
              <option value="todas">Todas as publicações</option>
              {publicacoes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Abas de Situação */}
          <div style={{ display: 'flex', background: '#f2ecee', borderRadius: '6px', padding: '3px' }}>
            {(
              [
                { id: 'todas', label: 'Todas' },
                { id: 'publicado', label: 'Publicadas' },
                { id: 'rascunho', label: 'Rascunhos' },
              ] as const
            ).map((aba) => {
              const active = filtroStatus === aba.id
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => {
                    setFiltroStatus(aba.id)
                    setPagina(1)
                  }}
                  style={{
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#861e32' : '#71636a',
                    background: active ? 'white' : 'transparent',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {aba.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Campo de Busca */}
        <div style={{ width: '280px' }}>
          <input
            type="text"
            placeholder="Buscar por número ou título…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Grade de Edições ────────────────────────────────────────────── */}
      {edicoesPaginadas.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {edicoesPaginadas.map((edicao) => {
            const corTag = edicao.publicacao_cor || '#65172A'
            return (
              <div
                key={edicao.id}
                style={{
                  background: 'white',
                  border: '1px solid #e4dce0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Capa com Proporção de Jornal/A4 (1:1.41) */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1.35',
                    background: '#2b1b22',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {edicao.capa_url ? (
                    <img
                      src={edicao.capa_url}
                      alt={`Capa da edição ${edicao.numero}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    /* Capa Gráfica Padrão quando sem imagem */
                    <div
                      style={{
                        padding: '24px 20px',
                        textAlign: 'center',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        boxSizing: 'border-box',
                        background: `linear-gradient(145deg, ${corTag}, #20070e)`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          opacity: 0.85,
                        }}
                      >
                        {edicao.publicacao_nome}
                      </div>

                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, opacity: 0.9 }}>
                          EDIÇÃO
                        </div>
                        <div style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1 }}>
                          {edicao.numero}
                        </div>
                        {edicao.complemento && (
                          <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.85 }}>
                            {edicao.complemento}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', opacity: 0.75 }}>
                        {edicao.data_edicao
                          ? new Date(edicao.data_edicao + 'T12:00:00Z').toLocaleDateString('pt-BR')
                          : 'Sem data'}
                      </div>
                    </div>
                  )}

                  {/* Badge de Situação Flutuante */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: edicao.status === 'publicado' ? '#e9f3ef' : '#fff2df',
                      color: edicao.status === 'publicado' ? '#23634e' : '#825914',
                      border: edicao.status === 'publicado' ? '1px solid #d1e7dd' : '1px solid #f6deb3',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {edicao.status === 'publicado' ? 'Publicada' : 'Rascunho'}
                  </span>
                </div>

                {/* Conteúdo do Card */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        background: corTag,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {edicao.publicacao_nome}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#30252a' }}>
                      Nº {edicao.numero}
                      {edicao.complemento && ` (${edicao.complemento})`}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#30252a',
                      margin: '0 0 6px 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {edicao.titulo || `Edição ${edicao.numero}`}
                  </h3>

                  {edicao.subtitulo && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#71636a',
                        margin: '0 0 10px 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {edicao.subtitulo}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0eaed' }}>
                    <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '12px' }}>
                      📅{' '}
                      {edicao.data_edicao
                        ? new Date(edicao.data_edicao + 'T12:00:00Z').toLocaleDateString('pt-BR')
                        : 'Data não informada'}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {edicao.pdf_url ? (
                        <a
                          href={edicao.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            ...btnNeutro,
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: '#861e32',
                            flex: 1,
                            justifyContent: 'center',
                          }}
                        >
                          Abrir PDF ↗
                        </a>
                      ) : (
                        <span
                          style={{
                            ...btnNeutro,
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: '#998d93',
                            flex: 1,
                            justifyContent: 'center',
                            cursor: 'not-allowed',
                          }}
                        >
                          Sem PDF
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => abrirEditarEdicao(edicao)}
                        style={{ ...btnNeutro, padding: '6px 10px', fontSize: '12px' }}
                      >
                        Editar
                      </button>

                      {usuarioLogado.papel === 'admin_ti' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEdicaoParaExcluir(edicao)
                            setShowDeleteModal(true)
                          }}
                          title="Excluir edição"
                          style={{
                            ...btnNeutro,
                            padding: '6px 8px',
                            fontSize: '12px',
                            color: '#861e32',
                            borderColor: '#e8c8ce',
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e4dce0',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#71636a',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30252a', margin: '0 0 6px 0' }}>
            Nenhuma edição encontrada
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            {busca || filtroPub !== 'todas' || filtroStatus !== 'todas'
              ? 'Tente ajustar os filtros ou a busca digitada.'
              : 'Comece adicionando a primeira edição de jornal do acervo.'}
          </p>
          <button type="button" onClick={abrirNovaEdicao} style={btnPrimario}>
            ＋ Adicionar edição
          </button>
        </div>
      )}

      {/* ── Paginação ───────────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setPagina(1)}
            disabled={pagina === 1}
            style={{ ...btnNeutro, padding: '6px 12px', fontSize: '12px', opacity: pagina === 1 ? 0.5 : 1 }}
          >
            « Início
          </button>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{ ...btnNeutro, padding: '6px 12px', fontSize: '12px', opacity: pagina === 1 ? 0.5 : 1 }}
          >
            Anterior
          </button>

          <span style={{ fontSize: '13px', color: '#71636a', padding: '0 8px' }}>
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              ...btnNeutro,
              padding: '6px 12px',
              fontSize: '12px',
              opacity: pagina === totalPaginas ? 0.5 : 1,
            }}
          >
            Próxima
          </button>
          <button
            type="button"
            onClick={() => setPagina(totalPaginas)}
            disabled={pagina === totalPaginas}
            style={{
              ...btnNeutro,
              padding: '6px 12px',
              fontSize: '12px',
              opacity: pagina === totalPaginas ? 0.5 : 1,
            }}
          >
            Fim »
          </button>
        </div>
      )}

      {/* ── Modal: Adicionar / Editar Edição ─────────────────────────────── */}
      {showEdicaoModal && (
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
          onClick={() => setShowEdicaoModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
                  {edicaoEditando ? `Editar Edição nº ${edicaoEditando.numero}` : 'Adicionar nova edição'}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
                  Preencha os dados da publicação e anexe o arquivo PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdicaoModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#71636a' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Publicação e Número */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Publicação (Jornal) *</label>
                  <select
                    value={formPubId}
                    onChange={(e) => setFormPubId(e.target.value)}
                    style={inputStyle}
                  >
                    {publicacoes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Número da edição *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formNumero}
                    onChange={(e) => {
                      setFormNumero(e.target.value)
                      if (!formTitulo || formTitulo.startsWith('Edição ')) {
                        setFormTitulo(`Edição ${e.target.value}`)
                      }
                    }}
                    placeholder="Ex.: 482"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Complemento e Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Complemento (opcional)</label>
                  <input
                    type="text"
                    value={formComplemento}
                    onChange={(e) => setFormComplemento(e.target.value)}
                    placeholder="Ex.: Especial, Extra"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Data da edição *</label>
                  <input
                    type="date"
                    value={formDataEdicao}
                    onChange={(e) => setFormDataEdicao(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Título público */}
              <div>
                <label style={labelStyle}>Título público (exibido na página)</label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex.: Boca no Trombone — Edição 482"
                  style={inputStyle}
                />
              </div>

              {/* Subtítulo */}
              <div>
                <label style={labelStyle}>Subtítulo ou resumo da edição (opcional)</label>
                <textarea
                  rows={2}
                  value={formSubtitulo}
                  onChange={(e) => setFormSubtitulo(e.target.value)}
                  placeholder="Destaques desta edição: negociação salarial, convocação para assembleia…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Upload de PDF */}
              <div
                style={{
                  border: '1px solid #ced9df',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#fcfbfa',
                }}
              >
                <label style={{ ...labelStyle, marginBottom: '8px' }}>
                  Arquivo PDF da edição *
                </label>

                {formPdfUrl ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#e9f3ef',
                      padding: '10px 14px',
                      borderRadius: '5px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#23634e' }}>
                      <span>📄</span>
                      <strong>{formPdfNome || 'PDF anexado com sucesso'}</strong>
                    </div>
                    <a
                      href={formPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#861e32', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Ver PDF ↗
                    </a>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUploadPdf}
                  disabled={uploadingPdf}
                  style={{ fontSize: '13px' }}
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#71636a' }}>
                  {uploadingPdf
                    ? 'Enviando arquivo PDF…'
                    : 'Arquivo PDF original da edição diagramada.'}
                </small>
              </div>

              {/* Upload de Imagem de Capa Opcional */}
              <div
                style={{
                  border: '1px solid #ced9df',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#fcfbfa',
                }}
              >
                <label style={{ ...labelStyle, marginBottom: '8px' }}>
                  Capa personalizada da edição (opcional)
                </label>

                {formCapaUrl ? (
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '10px' }}>
                    <img
                      src={formCapaUrl}
                      alt="Prévia da capa"
                      style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd7de' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#30252a' }}>
                        Capa carregada
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormCapaUrl('')}
                        style={{ border: 'none', background: 'transparent', color: '#861e32', fontSize: '12px', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remover imagem personalizada
                      </button>
                    </div>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadCapa}
                  disabled={uploadingCapa}
                  style={{ fontSize: '13px' }}
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#71636a' }}>
                  {uploadingCapa
                    ? 'Enviando imagem de capa…'
                    : 'Se não enviar imagem, o sistema exibirá uma capa gráfica padronizada com a cor do jornal.'}
                </small>
              </div>

              {/* Botões de Ação */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  borderTop: '1px solid #e4dce0',
                  paddingTop: '16px',
                }}
              >
                <button type="button" onClick={() => setShowEdicaoModal(false)} style={btnNeutro}>
                  Cancelar
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleSalvarEdicao('rascunho')}
                    disabled={isPending || uploadingPdf || uploadingCapa}
                    style={btnNeutro}
                  >
                    Salvar rascunho
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSalvarEdicao('publicado')}
                    disabled={isPending || uploadingPdf || uploadingCapa}
                    style={btnPrimario}
                  >
                    {isPending ? 'Salvando…' : 'Publicar agora'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Cadastrar Nova Publicação ─────────────────────────────── */}
      {showPubModal && (
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
          onClick={() => setShowPubModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '26px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
              Cadastrar novo jornal
            </h2>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#71636a' }}>
              Crie uma publicação para agrupar suas edições (ex.: Boca no Trombone).
            </p>

            <form onSubmit={handleCadastrarPublicacao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nome da publicação *</label>
                <input
                  type="text"
                  required
                  value={novoPubNome}
                  onChange={(e) => setNovoPubNome(e.target.value)}
                  placeholder="Ex.: Boca no Trombone"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>Cor temática</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={novoPubCor}
                    onChange={(e) => setNovoPubCor(e.target.value)}
                    style={{ width: '40px', height: '40px', border: '1px solid #cbd7de', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    value={novoPubCor}
                    onChange={(e) => setNovoPubCor(e.target.value)}
                    style={{ ...inputStyle, width: '120px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['#65172A', '#1E3A8A', '#065F46', '#374151'].map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setNovoPubCor(cor)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: cor,
                          border: novoPubCor === cor ? '2px solid #30252a' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowPubModal(false)} style={btnNeutro}>
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} style={btnPrimario}>
                  {isPending ? 'Cadastrando…' : 'Cadastrar publicação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Excluir Edição ────────────────────────────────────────── */}
      {showDeleteModal && edicaoParaExcluir && (
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
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '26px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#861e32', margin: '0 0 8px 0' }}>
              Excluir esta edição?
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#30252a', lineHeight: 1.5 }}>
              Tem certeza de que deseja excluir a <strong>Edição nº {edicaoParaExcluir.numero}</strong> de{' '}
              <strong>{edicaoParaExcluir.publicacao_nome}</strong>?
            </p>
            <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#71636a' }}>
              Esta ação remove o registro do acervo público.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} style={btnNeutro}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={isPending}
                style={{ ...btnPrimario, background: '#861e32' }}
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast de Feedback ────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.tipo === 'erro' ? '#861e32' : '#183b4b',
            color: 'white',
            padding: '13px 23px',
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
