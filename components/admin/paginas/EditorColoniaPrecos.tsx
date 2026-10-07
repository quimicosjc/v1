'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional } from '@/app/admin/paginas/actions'

interface PrecoItem {
  id: number
  unit: string
  public: string
  type: string
  value: number
  charge: string
  capacity?: string
  notes?: string
  active?: boolean
}

interface EditorColoniaPrecosProps {
  pagina: PaginaInstitucional
}

export default function EditorColoniaPrecos({ pagina }: EditorColoniaPrecosProps) {
  let dadosIniciais: PrecoItem[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [precos, setPrecos] = useState<PrecoItem[]>(dadosIniciais)
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [precoEditando, setPrecoEditando] = useState<PrecoItem | null>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  function abrirModal(item?: PrecoItem) {
    if (item) {
      setPrecoEditando({ ...item })
    } else {
      setPrecoEditando({
        id: Date.now(),
        unit: 'São Sebastião',
        public: 'Associados dos Químicos',
        type: '',
        value: 100,
        charge: 'por diária',
        capacity: 'Até 4 pessoas',
        notes: '',
        active: true,
      })
    }
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setPrecoEditando(null)
  }

  function salvarModal() {
    if (!precoEditando?.type.trim()) {
      showToast('O tipo de acomodação ou taxa é obrigatório.', 'erro')
      return
    }

    const index = precos.findIndex((p) => p.id === precoEditando.id)
    let novaLista = [...precos]
    if (index >= 0) {
      novaLista[index] = precoEditando
    } else {
      novaLista.push(precoEditando)
    }

    setPrecos(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Tarifa atualizada na lista! Salve para publicar as alterações.')
  }

  function removerPreco(id: number) {
    if (window.confirm('Deseja realmente remover esta tarifa da tabela?')) {
      setPrecos(precos.filter((p) => p.id !== id))
      setAlterado(true)
      showToast('Tarifa removida.')
    }
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const payload = {
      tipoPagina: 'prices',
      grupo: 'Colônia de Férias',
      records: precos,
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
      showToast('Tabela de preços da Colônia salva e publicada com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / COLÔNIA DE FÉRIAS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Valores e Detalhes da Colônia
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              Cadastro estruturado de preços por unidade (São Sebastião e Caraguatatuba) e público atendido.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/admin/paginas/colonia"
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
              ← Telas da Colônia
            </Link>

            <a
              href="/paginas/colonia-valores"
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
              ＋ Adicionar tarifa
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Preços */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px',
        }}
      >
        {precos.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e4dce0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#861e32',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  {item.unit}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#71636a',
                    background: '#f8fafb',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e4dce0',
                  }}
                >
                  {item.public}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 6px' }}>
                {item.type}
              </h3>

              <div style={{ fontSize: '24px', fontWeight: 800, color: '#861e32', margin: '8px 0' }}>
                R$ {item.value.toFixed(2).replace('.', ',')}{' '}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#71636a' }}>
                  {item.charge}
                </span>
              </div>

              {item.capacity && (
                <div style={{ fontSize: '12px', color: '#30252a', marginBottom: '4px' }}>
                  👥 <strong>Capacidade:</strong> {item.capacity}
                </div>
              )}

              {item.notes && (
                <p style={{ fontSize: '12px', color: '#71636a', margin: '8px 0 0', lineHeight: '1.4' }}>
                  {item.notes}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f0edf0', paddingTop: '12px', marginTop: '16px' }}>
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
                onClick={() => removerPreco(item.id)}
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
        ))}
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
          {alterado ? 'Há alterações não salvas' : `${precos.length} faixas de preço ativas`}
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
          {salvando ? 'Salvando...' : 'Salvar e Publicar Tabela de Preços'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && precoEditando && (
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
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#30252a', margin: '0 0 18px' }}>
              {precoEditando.type ? 'Editar Tarifa' : 'Adicionar Nova Tarifa'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Unidade
                  </label>
                  <select
                    value={precoEditando.unit}
                    onChange={(e) => setPrecoEditando({ ...precoEditando, unit: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px' }}
                  >
                    <option value="São Sebastião">São Sebastião</option>
                    <option value="Caraguatatuba">Caraguatatuba</option>
                    <option value="Todas as unidades">Todas as unidades</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Público
                  </label>
                  <input
                    type="text"
                    value={precoEditando.public}
                    onChange={(e) => setPrecoEditando({ ...precoEditando, public: e.target.value })}
                    placeholder="Ex.: Associados dos Químicos..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Tipo de acomodação ou taxa *
                </label>
                <input
                  type="text"
                  value={precoEditando.type}
                  onChange={(e) => setPrecoEditando({ ...precoEditando, type: e.target.value })}
                  placeholder="Ex.: Quarto de casal, Quarto familiar, Taxa diária..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Valor em Reais (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoEditando.value}
                    onChange={(e) => setPrecoEditando({ ...precoEditando, value: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Cobrança
                  </label>
                  <input
                    type="text"
                    value={precoEditando.charge}
                    onChange={(e) => setPrecoEditando({ ...precoEditando, charge: e.target.value })}
                    placeholder="Ex.: por diária, por pessoa/dia"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Capacidade / Lotação máxima
                </label>
                <input
                  type="text"
                  value={precoEditando.capacity || ''}
                  onChange={(e) => setPrecoEditando({ ...precoEditando, capacity: e.target.value })}
                  placeholder="Ex.: 2 pessoas (sem crianças), 3 a 6 pessoas..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Condições e observações
                </label>
                <textarea
                  rows={2}
                  value={precoEditando.notes || ''}
                  onChange={(e) => setPrecoEditando({ ...precoEditando, notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
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
