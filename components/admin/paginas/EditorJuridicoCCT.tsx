'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional, uploadDocumentoInstitucional } from '@/app/admin/paginas/actions'

interface ItemJuridico {
  id: number
  name: string
  kind?: string
  company?: string
  number?: string
  validity?: string
  file?: string
  fileName?: string
  description?: string
  unit?: string
  day?: string
  hours?: string
  phone?: string
  email?: string
  active?: boolean
}

interface EditorJuridicoCCTProps {
  pagina: PaginaInstitucional
}

export default function EditorJuridicoCCT({ pagina }: EditorJuridicoCCTProps) {
  let dadosIniciais: ItemJuridico[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [itens, setItens] = useState<ItemJuridico[]>(dadosIniciais)
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [itemEditando, setItemEditando] = useState<ItemJuridico | null>(null)
  const [modalFile, setModalFile] = useState<File | null>(null)

  const isCct = pagina.slug === 'cct'
  const isProcessos = pagina.slug === 'processos'
  const isHours = pagina.slug === 'juridico'

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  function abrirModal(item?: ItemJuridico) {
    if (item) {
      setItemEditando({ ...item })
    } else {
      setItemEditando({
        id: Date.now(),
        name: '',
        kind: isCct ? 'Convenção' : 'Ação Coletiva',
        company: '',
        number: '',
        validity: '',
        file: '',
        fileName: '',
        description: '',
        unit: 'Geral',
        day: '',
        hours: '',
        active: true,
      })
    }
    setModalFile(null)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setItemEditando(null)
    setModalFile(null)
  }

  async function salvarModal() {
    if (!itemEditando?.name.trim()) {
      showToast('O título / identificação é obrigatório.', 'erro')
      return
    }

    let fileUrl = itemEditando.file || ''
    let fileName = itemEditando.fileName || ''

    if (modalFile) {
      const formData = new FormData()
      formData.append('arquivo', modalFile)
      showToast('Enviando documento PDF...')
      const uploadRes = await uploadDocumentoInstitucional(formData)
      if ('error' in uploadRes) {
        showToast(uploadRes.error, 'erro')
        return
      }
      fileUrl = uploadRes.url
      fileName = uploadRes.nome
    }

    const itemAtualizado: ItemJuridico = {
      ...itemEditando,
      file: fileUrl,
      fileName: fileName,
    }

    const index = itens.findIndex((i) => i.id === itemAtualizado.id)
    let novaLista = [...itens]
    if (index >= 0) {
      novaLista[index] = itemAtualizado
    } else {
      novaLista.push(itemAtualizado)
    }

    setItens(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Registro atualizado! Salve as alterações para publicar.')
  }

  function removerItem(id: number, nome: string) {
    if (window.confirm(`Deseja remover "${nome}"?`)) {
      setItens(itens.filter((i) => i.id !== id))
      setAlterado(true)
      showToast('Item removido.')
    }
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const tipoSchema = isCct ? 'documents' : isProcessos ? 'processes' : 'hours'
    const payload = {
      tipoPagina: tipoSchema,
      grupo: 'Jurídico',
      records: itens,
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
      showToast('Conteúdo jurídico salvo e publicado com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / JURÍDICO
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              {pagina.titulo}
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              {isCct && 'Acervo de Convenções e Acordos Coletivos com download de PDFs.'}
              {isProcessos && 'Processos e ações coletivas no TRT-15 por empresa e comarca.'}
              {isHours && 'Plantões e horários de atendimento dos advogados da entidade.'}
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
              href={`/paginas/${pagina.slug}`}
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
              ＋ Adicionar item
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {itens.map((item, idx) => (
          <div
            key={item.id}
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: idx < itens.length - 1 ? '1px solid #f0edf0' : 'none',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <strong style={{ fontSize: '15px', color: '#30252a' }}>
                  {item.name}
                </strong>
                {item.kind && (
                  <span style={{ fontSize: '11px', color: '#23634e', background: '#e9f3ef', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {item.kind}
                  </span>
                )}
                {item.validity && (
                  <span style={{ fontSize: '11px', color: '#71636a', background: '#f8fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e4dce0' }}>
                    Vigência: {item.validity}
                  </span>
                )}
              </div>

              {item.company && (
                <div style={{ fontSize: '13px', color: '#30252a', marginBottom: '2px' }}>
                  <strong>Empresa / Base:</strong> {item.company}
                </div>
              )}

              {item.number && (
                <div style={{ fontSize: '12px', color: '#71636a' }}>
                  <strong>Numeração / Comarca:</strong> {item.number}
                </div>
              )}

              {item.day && item.hours && (
                <div style={{ fontSize: '13px', color: '#30252a', marginTop: '2px' }}>
                  🗓️ {item.day} • ⏰ {item.hours}
                </div>
              )}

              {item.file && (
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={item.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#861e32', fontWeight: 600, textDecoration: 'none' }}
                  >
                    📄 Abrir documento PDF ({item.fileName || 'Download'}) ↗
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => abrirModal(item)}
                style={{
                  padding: '6px 12px',
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
                onClick={() => removerItem(item.id, item.name)}
                style={{
                  padding: '6px 10px',
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
          {alterado ? 'Há alterações não salvas' : `${itens.length} registros cadastrados`}
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
          {salvando ? 'Salvando...' : 'Salvar e Publicar Registros'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && itemEditando && (
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
              {itemEditando.name ? 'Editar Registro' : 'Adicionar Novo Registro'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  {isCct ? 'Nome do documento *' : isProcessos ? 'Título do processo *' : 'Nome do advogado / Plantão *'}
                </label>
                <input
                  type="text"
                  value={itemEditando.name}
                  onChange={(e) => setItemEditando({ ...itemEditando, name: e.target.value })}
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

              {isCct && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Tipo
                    </label>
                    <select
                      value={itemEditando.kind || 'Convenção'}
                      onChange={(e) => setItemEditando({ ...itemEditando, kind: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px' }}
                    >
                      <option value="Convenção">Convenção Coletiva (CCT)</option>
                      <option value="Acordo">Acordo Coletivo (ACT)</option>
                      <option value="Aditivo">Termo Aditivo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Vigência
                    </label>
                    <input
                      type="text"
                      value={itemEditando.validity || ''}
                      onChange={(e) => setItemEditando({ ...itemEditando, validity: e.target.value })}
                      placeholder="Ex.: 2018 - 2020"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {isProcessos && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={itemEditando.company || ''}
                      onChange={(e) => setItemEditando({ ...itemEditando, company: e.target.value })}
                      placeholder="Ex.: Henkel / Basf (Jacareí)"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Comarca / TRT
                    </label>
                    <input
                      type="text"
                      value={itemEditando.number || ''}
                      onChange={(e) => setItemEditando({ ...itemEditando, number: e.target.value })}
                      placeholder="Ex.: TRT-15 Jacareí"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {isHours && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Dias de atendimento
                    </label>
                    <input
                      type="text"
                      value={itemEditando.day || ''}
                      onChange={(e) => setItemEditando({ ...itemEditando, day: e.target.value })}
                      placeholder="Ex.: Terças e quintas"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                      Horário
                    </label>
                    <input
                      type="text"
                      value={itemEditando.hours || ''}
                      onChange={(e) => setItemEditando({ ...itemEditando, hours: e.target.value })}
                      placeholder="Ex.: Das 9h às 17h"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd7de', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {isCct && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                    Arquivo PDF da Convenção
                  </label>
                  {itemEditando.file && (
                    <div style={{ fontSize: '12px', color: '#23634e', marginBottom: '6px' }}>
                      Arquivo atual: <strong>{itemEditando.fileName || itemEditando.file}</strong>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setModalFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Descrição / Orientações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={itemEditando.description || ''}
                  onChange={(e) => setItemEditando({ ...itemEditando, description: e.target.value })}
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
