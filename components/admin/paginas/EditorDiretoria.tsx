'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional, uploadMidiaInstitucional } from '@/app/admin/paginas/actions'

interface DiretorItem {
  id: number
  name: string
  company: string
  role?: string
  group: 'Executiva' | 'Colegiado' | 'Conselho Fiscal'
  image?: string
  active?: boolean
  order?: number
}

interface EditorDiretoriaProps {
  pagina: PaginaInstitucional
}

export default function EditorDiretoria({ pagina }: EditorDiretoriaProps) {
  // Parse dos dados existentes
  let dadosIniciais: DiretorItem[] = []
  if (pagina.tags_json) {
    try {
      const parsed = JSON.parse(pagina.tags_json)
      dadosIniciais = parsed.records || parsed || []
    } catch {
      dadosIniciais = []
    }
  }

  const [diretores, setDiretores] = useState<DiretorItem[]>(dadosIniciais)
  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  // Estado do modal de Adicionar / Editar
  const [modalAberto, setModalAberto] = useState(false)
  const [diretorEditando, setDiretorEditando] = useState<DiretorItem | null>(null)
  const [modalFotoFile, setModalFotoFile] = useState<File | null>(null)
  const [modalFotoPreview, setModalFotoPreview] = useState<string>('')

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  function abrirModal(diretor?: DiretorItem) {
    if (diretor) {
      setDiretorEditando({ ...diretor })
      setModalFotoPreview(diretor.image || '')
    } else {
      setDiretorEditando({
        id: Date.now(),
        name: '',
        company: '',
        role: '',
        group: 'Executiva',
        image: '',
        active: true,
        order: diretores.length + 1,
      })
      setModalFotoPreview('')
    }
    setModalFotoFile(null)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setDiretorEditando(null)
    setModalFotoFile(null)
    setModalFotoPreview('')
  }

  async function salvarDiretorModal() {
    if (!diretorEditando?.name.trim()) {
      showToast('O nome do dirigente é obrigatório.', 'erro')
      return
    }

    let fotoFinal = diretorEditando.image || ''
    if (modalFotoFile) {
      const formData = new FormData()
      formData.append('arquivo', modalFotoFile)
      showToast('Enviando foto...')
      const uploadRes = await uploadMidiaInstitucional(formData)
      if ('error' in uploadRes) {
        showToast(uploadRes.error, 'erro')
        return
      }
      fotoFinal = uploadRes.url
    }

    const itemAtualizado: DiretorItem = {
      ...diretorEditando,
      image: fotoFinal,
    }

    const index = diretores.findIndex((d) => d.id === itemAtualizado.id)
    let novaLista = [...diretores]
    if (index >= 0) {
      novaLista[index] = itemAtualizado
    } else {
      novaLista.push(itemAtualizado)
    }

    setDiretores(novaLista)
    setAlterado(true)
    fecharModal()
    showToast('Dirigente atualizado! Lembre-se de salvar as alterações.')
  }

  function removerDiretor(id: number, nome: string) {
    if (window.confirm(`Deseja realmente remover o dirigente "${nome}"?`)) {
      setDiretores(diretores.filter((d) => d.id !== id))
      setAlterado(true)
      showToast('Dirigente removido da lista.')
    }
  }

  function moverDiretor(index: number, delta: number) {
    const novoIndex = index + delta
    if (novoIndex < 0 || novoIndex >= diretores.length) return
    const novaLista = [...diretores]
    const temp = novaLista[index]
    novaLista[index] = novaLista[novoIndex]
    novaLista[novoIndex] = temp
    setDiretores(novaLista)
    setAlterado(true)
  }

  async function handleSalvarGeral() {
    setSalvando(true)
    const payload = {
      tipoPagina: 'directors',
      grupo: 'Sindicato',
      records: diretores,
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
      showToast('Quadro de diretoria salvo e publicado com sucesso!')
    }
  }

  const diretoresExibidos = diretores.filter((d) => {
    if (grupoFiltro === 'todos') return true
    return d.group === grupoFiltro
  })

  const totalExecutiva = diretores.filter((d) => d.group === 'Executiva').length
  const totalColegiado = diretores.filter((d) => d.group === 'Colegiado').length

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
              Diretoria do Sindicato
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              A ordem manual dentro de cada grupo define rigorosamente a apresentação na página pública.
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
              href="/paginas/diretoria"
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
              ＋ Adicionar diretor
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de Abas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e4dce0', paddingBottom: '12px' }}>
        {[
          { id: 'todos', label: `Todos (${diretores.length})` },
          { id: 'Executiva', label: `Executiva (${totalExecutiva})` },
          { id: 'Colegiado', label: `Colegiado (${totalColegiado})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setGrupoFiltro(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: grupoFiltro === tab.id ? '#861e32' : '#f0edf0',
              color: grupoFiltro === tab.id ? '#ffffff' : '#30252a',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Diretores */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {diretoresExibidos.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#71636a' }}>
            Nenhum dirigente cadastrado neste filtro.
          </div>
        ) : (
          diretoresExibidos.map((diretor, idx) => (
            <div
              key={diretor.id}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: idx < diretoresExibidos.length - 1 ? '1px solid #f0edf0' : 'none',
                gap: '14px',
              }}
            >
              {/* Foto ou Placeholder */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#f0edf0',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e4dce0',
                }}
              >
                {diretor.image ? (
                  <img
                    src={diretor.image}
                    alt={diretor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#861e32' }}>
                    {diretor.name[0] || 'D'}
                  </span>
                )}
              </div>

              {/* Informações */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '15px', color: '#30252a' }}>
                    {diretor.name}
                  </strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '3px',
                      background: diretor.group === 'Executiva' ? '#fde8ed' : '#eaf1fc',
                      color: diretor.group === 'Executiva' ? '#861e32' : '#365786',
                    }}
                  >
                    {diretor.group}
                  </span>
                  {diretor.active === false && (
                    <span style={{ fontSize: '11px', color: '#825914', background: '#fff2df', padding: '2px 6px', borderRadius: '3px' }}>
                      Inativo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#71636a' }}>
                  <strong>{diretor.company}</strong>
                  {diretor.role ? ` • ${diretor.role}` : ''}
                </div>
              </div>

              {/* Controles de Ordenação e Ações */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  title="Subir posição"
                  disabled={idx === 0}
                  onClick={() => moverDiretor(idx, -1)}
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
                  title="Descer posição"
                  disabled={idx === diretoresExibidos.length - 1}
                  onClick={() => moverDiretor(idx, 1)}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '4px',
                    border: '1px solid #ced9df',
                    background: '#ffffff',
                    color: idx === diretoresExibidos.length - 1 ? '#cbd7de' : '#30252a',
                    cursor: idx === diretoresExibidos.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => abrirModal(diretor)}
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
                  onClick={() => removerDiretor(diretor.id, diretor.name)}
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
          {alterado ? 'Há alterações não salvas' : `${diretores.length} dirigentes configurados`}
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
          {salvando ? 'Salvando...' : 'Salvar e Publicar Diretoria'}
        </button>
      </div>

      {/* Modal Adicionar / Editar */}
      {modalAberto && diretorEditando && (
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
              {diretorEditando.name ? 'Editar Dirigente' : 'Adicionar Novo Dirigente'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={diretorEditando.name}
                  onChange={(e) => setDiretorEditando({ ...diretorEditando, name: e.target.value })}
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
                  Empresa de origem *
                </label>
                <input
                  type="text"
                  value={diretorEditando.company}
                  onChange={(e) => setDiretorEditando({ ...diretorEditando, company: e.target.value })}
                  placeholder="Ex.: Teknia, Johnson & Johnson, Não se aplica..."
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
                  Cargo / Função (opcional)
                </label>
                <input
                  type="text"
                  value={diretorEditando.role || ''}
                  onChange={(e) => setDiretorEditando({ ...diretorEditando, role: e.target.value })}
                  placeholder="Ex.: Coordenação, Secretaria Geral, Diretor(a) de Base..."
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
                  Grupo / Instância *
                </label>
                <select
                  value={diretorEditando.group}
                  onChange={(e) => setDiretorEditando({ ...diretorEditando, group: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #cbd7de',
                    borderRadius: '5px',
                    fontSize: '14px',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Executiva">Diretoria Executiva</option>
                  <option value="Colegiado">Diretoria Colegiada / Base</option>
                  <option value="Conselho Fiscal">Conselho Fiscal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#30252a', marginBottom: '5px' }}>
                  Foto do dirigente (opcional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {modalFotoPreview && (
                    <img
                      src={modalFotoPreview}
                      alt="Preview"
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setModalFotoFile(file)
                        setModalFotoPreview(URL.createObjectURL(file))
                      }
                    }}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={diretorEditando.active !== false}
                  onChange={(e) => setDiretorEditando({ ...diretorEditando, active: e.target.checked })}
                />
                Exibir este dirigente no site público
              </label>
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
                onClick={salvarDiretorModal}
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
