'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional } from '@/app/admin/paginas/actions'

interface ConvenioItem {
  id: number
  name: string
  kind: string
  city: string
  description: string
  phone?: string
  whatsapp?: string
  address?: string
  url?: string
  active?: boolean
  order?: number
}

interface EditorConveniosProps {
  pagina: PaginaInstitucional
}

export default function EditorConvenios({ pagina }: EditorConveniosProps) {
  let dadosIniciais: ConvenioItem[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [convenios, setConvenios] = useState<ConvenioItem[]>(dadosIniciais)
  const [busca, setBusca] = useState('')
  const [cidadeFiltro, setCidadeFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  // Modal de edição / adição
  const [modalAberto, setModalAberto] = useState(false)
  const [convenioEditando, setConvenioEditando] = useState<ConvenioItem | null>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  const cidadesUnicas = useMemo(() => {
    return Array.from(new Set(convenios.map((c) => c.city).filter(Boolean))).sort()
  }, [convenios])

  const tiposUnicos = useMemo(() => {
    return Array.from(new Set(convenios.map((c) => c.kind).filter(Boolean))).sort()
  }, [convenios])

  const conveniosFiltrados = useMemo(() => {
    return convenios.filter((c) => {
      const matchBusca =
        !busca ||
        c.name.toLowerCase().includes(busca.toLowerCase()) ||
        c.description.toLowerCase().includes(busca.toLowerCase()) ||
        c.city.toLowerCase().includes(busca.toLowerCase())
      const matchCidade = !cidadeFiltro || c.city === cidadeFiltro
      const matchTipo = !tipoFiltro || c.kind === tipoFiltro
      return matchBusca && matchCidade && matchTipo
    })
  }, [convenios, busca, cidadeFiltro, tipoFiltro])

  function abrirModal(item?: ConvenioItem) {
    if (item) {
      setConvenioEditando({ ...item })
    } else {
      setConvenioEditando({
        id: Date.now(),
        name: '',
        kind: 'Geral',
        city: 'São José dos Campos',
        description: '',
        phone: '',
        whatsapp: '',
        address: '',
        url: '',
        active: true,
        order: convenios.length + 1,
      })
    }
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setConvenioEditando(null)
  }

  function salvarModal() {
    if (!convenioEditando?.name.trim()) {
      showToast('O nome do estabelecimento é obrigatório.', 'erro')
      return
    }
    if (!convenioEditando?.description.trim()) {
      showToast('As condições ou desconto do convênio são obrigatórios.', 'erro')
      return
    }

    const index = convenios.findIndex((c) => c.id === convenioEditando.id)
    let novaLista = [...convenios]
    if (index >= 0) {
      novaLista[index] = convenioEditando
    } else {
      novaLista.push(convenioEditando)
    }

    setConvenios(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Convênio atualizado! Salve as alterações para publicar.')
  }

  function removerConvenio(id: number, nome: string) {
    if (window.confirm(`Deseja realmente remover o convênio com "${nome}"?`)) {
      setConvenios(convenios.filter((c) => c.id !== id))
      setAlterado(true)
      showToast('Convênio removido da lista.')
    }
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const payload = {
      tipoPagina: 'partners',
      grupo: 'Serviços',
      records: convenios,
    }

    const res = await salvarPaginaInstitucional(pagina.slug, {
      tags_json: JSON.stringify(payload),
      status: 'publicado',
    })
    setSalvando(false)

    if ('error' in res) {
      showToast(res.error, 'erro')
    } else {
      setAlterado(false)
      showToast('Relação de convênios salva e publicada com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / SERVIÇOS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Gestão de Convênios
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              Relação de estabelecimentos parceiros com descontos para a categoria.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/admin/paginas"
              style={{
                padding: '7px 14px',
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
              href="/paginas/convenios"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '7px 14px',
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

            <button
              type="button"
              onClick={() => abrirModal()}
              style={{
                padding: '7px 16px',
                borderRadius: '5px',
                border: 'none',
                background: '#861e32',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ＋ Adicionar convênio
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Buscar estabelecimento, benefício ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '9px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '13px',
            outline: 'none',
          }}
        />

        <select
          value={cidadeFiltro}
          onChange={(e) => setCidadeFiltro(e.target.value)}
          style={{
            padding: '9px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '13px',
            background: '#ffffff',
            minWidth: '160px',
          }}
        >
          <option value="">Todas as cidades</option>
          {cidadesUnicas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          style={{
            padding: '9px 12px',
            border: '1px solid #cbd7de',
            borderRadius: '5px',
            fontSize: '13px',
            background: '#ffffff',
            minWidth: '180px',
          }}
        >
          <option value="">Todos os tipos</option>
          {tiposUnicos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {(busca || cidadeFiltro || tipoFiltro) && (
          <button
            type="button"
            onClick={() => { setBusca(''); setCidadeFiltro(''); setTipoFiltro('') }}
            style={{
              padding: '9px 12px',
              borderRadius: '5px',
              border: 'none',
              background: '#f0edf0',
              color: '#65172a',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Grid de Convênios */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {conveniosFiltrados.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e4dce0',
              padding: '40px',
              textAlign: 'center',
              color: '#71636a',
            }}
          >
            Nenhum convênio encontrado para os filtros selecionados.
          </div>
        ) : (
          conveniosFiltrados.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e4dce0',
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#861e32',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {item.kind}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#71636a',
                      background: '#f8fafb',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid #e4dce0',
                    }}
                  >
                    {item.city}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#30252a',
                    margin: '0 0 8px',
                    lineHeight: '1.3',
                  }}
                >
                  {item.name}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#4a3f45',
                    margin: '0 0 12px',
                    lineHeight: '1.45',
                  }}
                >
                  {item.description}
                </p>

                {(item.phone || item.address) && (
                  <div style={{ fontSize: '12px', color: '#71636a', borderTop: '1px solid #f0edf0', paddingTop: '8px', marginBottom: '14px' }}>
                    {item.phone && <div>📞 {item.phone}</div>}
                    {item.address && <div style={{ marginTop: '2px' }}>📍 {item.address}</div>}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f0edf0', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => abrirModal(item)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced9df',
                    background: '#ffffff',
                    color: '#30252a',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => removerConvenio(item.id, item.name)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#fff0f3',
                    color: '#861e32',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Savebar Fixa */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '252px',
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #e4dce0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 90,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <span style={{ fontSize: '13px', color: '#71636a' }}>
          {alterado ? 'Há alterações não salvas' : `${convenios.length} convênios cadastrados`}
        </span>

        <button
          type="button"
          disabled={salvando}
          onClick={handleSalvarGeral}
          style={{
            padding: '9px 24px',
            borderRadius: '5px',
            border: 'none',
            background: '#861e32',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: salvando ? 'not-allowed' : 'pointer',
          }}
        >
          {salvando ? 'Salvando...' : 'Salvar e Publicar Convênios'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && convenioEditando && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30,20,25,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={fecharModal}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#30252a', margin: '0 0 18px' }}>
              {convenioEditando.name ? 'Editar Convênio' : 'Adicionar Novo Convênio'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Nome do estabelecimento *
                </label>
                <input
                  type="text"
                  value={convenioEditando.name}
                  onChange={(e) => setConvenioEditando({ ...convenioEditando, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #cbd7de',
                    borderRadius: '5px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Tipo / Ramo de atividade *
                  </label>
                  <input
                    type="text"
                    value={convenioEditando.kind}
                    onChange={(e) => setConvenioEditando({ ...convenioEditando, kind: e.target.value })}
                    placeholder="Ex.: Fisioterapia, Educação..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={convenioEditando.city}
                    onChange={(e) => setConvenioEditando({ ...convenioEditando, city: e.target.value })}
                    placeholder="Ex.: São José dos Campos..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Desconto e condições do benefício *
                </label>
                <textarea
                  rows={3}
                  value={convenioEditando.description}
                  onChange={(e) => setConvenioEditando({ ...convenioEditando, description: e.target.value })}
                  placeholder="Ex.: Desconto de 20% nas mensalidades para sócios e dependentes..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #cbd7de',
                    borderRadius: '5px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={convenioEditando.phone || ''}
                    onChange={(e) => setConvenioEditando({ ...convenioEditando, phone: e.target.value })}
                    placeholder="(12) 99999-9999"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Site / Link
                  </label>
                  <input
                    type="url"
                    value={convenioEditando.url || ''}
                    onChange={(e) => setConvenioEditando({ ...convenioEditando, url: e.target.value })}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #cbd7de',
                      borderRadius: '5px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Endereço físico
                </label>
                <input
                  type="text"
                  value={convenioEditando.address || ''}
                  onChange={(e) => setConvenioEditando({ ...convenioEditando, address: e.target.value })}
                  placeholder="Rua, número, bairro..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #cbd7de',
                    borderRadius: '5px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                onClick={fecharModal}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: '1px solid #ced9df',
                  background: '#ffffff',
                  color: '#30252a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarModal}
                style={{
                  padding: '8px 18px',
                  borderRadius: '5px',
                  border: 'none',
                  background: '#861e32',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastMsg.tipo === 'ok' ? '#183b4b' : '#861e32',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toastMsg.texto}
        </div>
      )}
    </div>
  )
}
