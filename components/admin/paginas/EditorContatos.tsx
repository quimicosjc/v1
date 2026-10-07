'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional } from '@/app/admin/paginas/actions'

interface ContatoItem {
  id: number
  name: string
  kind?: string
  city?: string
  address?: string
  hours?: string
  phone?: string
  whatsapp?: string
  email?: string
  url?: string
  description?: string
  active?: boolean
}

interface EditorContatosProps {
  pagina: PaginaInstitucional
}

export default function EditorContatos({ pagina }: EditorContatosProps) {
  let dadosIniciais: ContatoItem[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [contatos, setContatos] = useState<ContatoItem[]>(dadosIniciais)
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [contatoEditando, setContatoEditando] = useState<ContatoItem | null>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  function abrirModal(item?: ContatoItem) {
    if (item) {
      setContatoEditando({ ...item })
    } else {
      setContatoEditando({
        id: Date.now(),
        name: '',
        kind: 'Unidade',
        city: 'São José dos Campos',
        address: '',
        hours: 'Segunda a sexta-feira, das 8h às 17h',
        phone: '',
        whatsapp: '',
        email: '',
        url: '',
        description: '',
        active: true,
      })
    }
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setContatoEditando(null)
  }

  function salvarModal() {
    if (!contatoEditando?.name.trim()) {
      showToast('O nome da unidade ou departamento é obrigatório.', 'erro')
      return
    }

    const index = contatos.findIndex((c) => c.id === contatoEditando.id)
    let novaLista = [...contatos]
    if (index >= 0) {
      novaLista[index] = contatoEditando
    } else {
      novaLista.push(contatoEditando)
    }

    setContatos(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Unidade atualizada! Salve as alterações para publicar.')
  }

  function removerContato(id: number, nome: string) {
    if (window.confirm(`Deseja remover a unidade "${nome}"?`)) {
      setContatos(contatos.filter((c) => c.id !== id))
      setAlterado(true)
      showToast('Unidade removida da lista.')
    }
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const payload = {
      tipoPagina: 'contacts',
      grupo: pagina.chapeu || 'Sindicato',
      records: contatos,
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
      showToast('Unidades e contatos salvos e publicados com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / {pagina.chapeu?.toUpperCase() || 'SINDICATO'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              {pagina.titulo} — Sedes e Atendimento
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              Gerencie a Sede Central, Subsedes e Departamentos com telefones, horários e mapas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={pagina.slug.startsWith('colonia-') ? '/admin/paginas/colonia' : '/admin/paginas'}
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
              ＋ Adicionar unidade
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Sedes e Contatos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {contatos.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e4dce0',
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: 0 }}>
                  {item.name}
                </h3>
                {item.city && (
                  <span style={{ fontSize: '11px', color: '#71636a', background: '#f8fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e4dce0' }}>
                    {item.city}
                  </span>
                )}
              </div>

              {item.description && (
                <p style={{ fontSize: '13px', color: '#65172a', fontWeight: 500, margin: '0 0 8px' }}>
                  {item.description}
                </p>
              )}

              <div style={{ fontSize: '13px', color: '#4a3f45', lineHeight: '1.6' }}>
                {item.address && <div>📍 <strong>Endereço:</strong> {item.address}</div>}
                {item.hours && <div>⏰ <strong>Horário:</strong> {item.hours}</div>}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {item.phone && <div>📞 <strong>Telefone:</strong> {item.phone}</div>}
                  {item.whatsapp && <div>💬 <strong>WhatsApp:</strong> {item.whatsapp}</div>}
                  {item.email && <div>✉️ <strong>E-mail:</strong> {item.email}</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => abrirModal(item)}
                style={{
                  padding: '6px 14px',
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
                onClick={() => removerContato(item.id, item.name)}
                style={{
                  padding: '6px 12px',
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
          {alterado ? 'Há alterações não salvas' : `${contatos.length} sedes e unidades configuradas`}
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
          {salvando ? 'Salvando...' : 'Salvar e Publicar Contatos'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && contatoEditando && (
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
              {contatoEditando.name ? 'Editar Unidade' : 'Adicionar Nova Unidade'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Nome da unidade ou departamento *
                </label>
                <input
                  type="text"
                  value={contatoEditando.name}
                  onChange={(e) => setContatoEditando({ ...contatoEditando, name: e.target.value })}
                  placeholder="Ex.: Sede Central — São José dos Campos..."
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
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={contatoEditando.city || ''}
                    onChange={(e) => setContatoEditando({ ...contatoEditando, city: e.target.value })}
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
                    Horário de atendimento
                  </label>
                  <input
                    type="text"
                    value={contatoEditando.hours || ''}
                    onChange={(e) => setContatoEditando({ ...contatoEditando, hours: e.target.value })}
                    placeholder="Segunda a sexta, das 8h às 17h"
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
                  Endereço completo com CEP
                </label>
                <input
                  type="text"
                  value={contatoEditando.address || ''}
                  onChange={(e) => setContatoEditando({ ...contatoEditando, address: e.target.value })}
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
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={contatoEditando.phone || ''}
                    onChange={(e) => setContatoEditando({ ...contatoEditando, phone: e.target.value })}
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
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={contatoEditando.whatsapp || ''}
                    onChange={(e) => setContatoEditando({ ...contatoEditando, whatsapp: e.target.value })}
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
                  E-mail institucional
                </label>
                <input
                  type="email"
                  value={contatoEditando.email || ''}
                  onChange={(e) => setContatoEditando({ ...contatoEditando, email: e.target.value })}
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
                  Link do mapa (Google Maps)
                </label>
                <input
                  type="url"
                  value={contatoEditando.url || ''}
                  onChange={(e) => setContatoEditando({ ...contatoEditando, url: e.target.value })}
                  placeholder="https://maps.google.com/..."
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
