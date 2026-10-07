'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional } from '@/app/admin/paginas/actions'

interface LinkItem {
  id: number
  name: string
  url: string
  description?: string
  group?: string
  active?: boolean
  order?: number
}

interface EditorLinksUteisProps {
  pagina: PaginaInstitucional
}

export default function EditorLinksUteis({ pagina }: EditorLinksUteisProps) {
  let dadosIniciais: LinkItem[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [links, setLinks] = useState<LinkItem[]>(dadosIniciais)
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [linkEditando, setLinkEditando] = useState<LinkItem | null>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  function abrirModal(item?: LinkItem) {
    if (item) {
      setLinkEditando({ ...item })
    } else {
      setLinkEditando({
        id: Date.now(),
        name: '',
        url: 'https://',
        description: '',
        group: 'Sindical e Trabalhista',
        active: true,
        order: links.length + 1,
      })
    }
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setLinkEditando(null)
  }

  function salvarModal() {
    if (!linkEditando?.name.trim()) {
      showToast('O nome do link é obrigatório.', 'erro')
      return
    }
    if (!linkEditando?.url.trim() || !linkEditando.url.startsWith('http')) {
      showToast('Informe uma URL válida iniciando com http:// ou https://', 'erro')
      return
    }

    const index = links.findIndex((l) => l.id === linkEditando.id)
    let novaLista = [...links]
    if (index >= 0) {
      novaLista[index] = linkEditando
    } else {
      novaLista.push(linkEditando)
    }

    setLinks(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Link salvo na lista! Salve para publicar as alterações.')
  }

  function removerLink(id: number, nome: string) {
    if (window.confirm(`Deseja remover o link "${nome}"?`)) {
      setLinks(links.filter((l) => l.id !== id))
      setAlterado(true)
      showToast('Link removido.')
    }
  }

  function moverLink(index: number, delta: number) {
    const novoIndex = index + delta
    if (novoIndex < 0 || novoIndex >= links.length) return
    const novaLista = [...links]
    const temp = novaLista[index]
    novaLista[index] = novaLista[novoIndex]
    novaLista[novoIndex] = temp
    setLinks(novaLista)
    setAlterado(true)
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const payload = {
      tipoPagina: 'links',
      grupo: 'Sindicato',
      records: links,
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
      showToast('Relação de links úteis salva e publicada com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / SINDICATO
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Links Úteis
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              Cadastre e organize os atalhos para entidades parceiras e fontes de consulta dos trabalhadores.
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
              href="/paginas/links-uteis"
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
              ＋ Adicionar link
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Links */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {links.map((item, idx) => (
          <div
            key={item.id}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: idx < links.length - 1 ? '1px solid #f0edf0' : 'none',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <strong style={{ fontSize: '15px', color: '#30252a' }}>
                  {item.name}
                </strong>
                {item.group && (
                  <span style={{ fontSize: '11px', color: '#71636a', background: '#f8fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e4dce0' }}>
                    {item.group}
                  </span>
                )}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#861e32', textDecoration: 'none', display: 'block', wordBreak: 'break-all' }}
              >
                {item.url} ↗
              </a>
              {item.description && (
                <p style={{ fontSize: '12px', color: '#71636a', margin: '4px 0 0' }}>
                  {item.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moverLink(idx, -1)}
                style={{
                  padding: '5px 9px',
                  borderRadius: '4px',
                  border: '1px solid #ced9df',
                  background: '#ffffff',
                  color: idx === 0 ? '#cbd7de' : '#30252a',
                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={idx === links.length - 1}
                onClick={() => moverLink(idx, 1)}
                style={{
                  padding: '5px 9px',
                  borderRadius: '4px',
                  border: '1px solid #ced9df',
                  background: '#ffffff',
                  color: idx === links.length - 1 ? '#cbd7de' : '#30252a',
                  cursor: idx === links.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                ↓
              </button>

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
                onClick={() => removerLink(item.id, item.name)}
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
          {alterado ? 'Há alterações não salvas' : `${links.length} links cadastrados`}
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
          {salvando ? 'Salvando...' : 'Salvar e Publicar Links'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && linkEditando && (
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
              {linkEditando.name ? 'Editar Link' : 'Adicionar Novo Link'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Nome da entidade ou site *
                </label>
                <input
                  type="text"
                  value={linkEditando.name}
                  onChange={(e) => setLinkEditando({ ...linkEditando, name: e.target.value })}
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
                  Endereço URL (completo com https://) *
                </label>
                <input
                  type="url"
                  value={linkEditando.url}
                  onChange={(e) => setLinkEditando({ ...linkEditando, url: e.target.value })}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Grupo / Categoria (opcional)
                </label>
                <input
                  type="text"
                  value={linkEditando.group || ''}
                  onChange={(e) => setLinkEditando({ ...linkEditando, group: e.target.value })}
                  placeholder="Ex.: Sindical, Movimentos Sociais, Órgãos Públicos..."
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
                  Breve descrição (opcional)
                </label>
                <textarea
                  rows={2}
                  value={linkEditando.description || ''}
                  onChange={(e) => setLinkEditando({ ...linkEditando, description: e.target.value })}
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
