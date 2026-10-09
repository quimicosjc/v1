'use client'

import { useState, useTransition } from 'react'
import type { HomepageConfig, BannerItem } from '@/app/admin/homepage/actions'
import { salvarConfigHomepage, uploadBanner } from '@/app/admin/homepage/actions'

interface Props {
  configInicial: HomepageConfig
  usuarioLogado: { id: string; nome: string; papel: string }
}

const SHORTCUT_LABELS: Record<string, { label: string; url: string }> = {
  'fique-socio': { label: 'Fique sócio', url: '/ficar-socio' },
  'denuncia':    { label: 'Enviar denúncia', url: '/enviar-denuncia' },
  'colonia':     { label: 'Colônia de Férias', url: '/colonia-de-ferias' },
  'juridico':    { label: 'Jurídico', url: '/atendimento-juridico' },
}

export default function HomepageGerenciador({ configInicial, usuarioLogado }: Props) {
  const [config, setConfig] = useState<HomepageConfig>(configInicial)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  // Estado do modal de banner
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [bannerEditandoIndex, setBannerEditandoIndex] = useState<number | null>(null)
  const [formBannerTitulo, setFormBannerTitulo] = useState('')
  const [formBannerLink, setFormBannerLink] = useState('')
  const [formBannerImagem, setFormBannerImagem] = useState('')
  const [formBannerImagemMobile, setFormBannerImagemMobile] = useState('')
  const [formBannerAtivo, setFormBannerAtivo] = useState(true)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBannerMobile, setUploadingBannerMobile] = useState(false)

  function showFeedback(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // Manipulação de Blocos
  function toggleBloco(nome: string, ativo: boolean) {
    setConfig((prev) => {
      const novosHidden = ativo
        ? prev.hidden.filter((b) => b !== nome)
        : [...prev.hidden.filter((b) => b !== nome), nome]
      return { ...prev, hidden: novosHidden }
    })
  }

  function moverBloco(idx: number, direcao: -1 | 1) {
    const novoIdx = idx + direcao
    if (novoIdx < 0 || novoIdx >= config.blocks.length) return
    const novos = [...config.blocks]
    const temp = novos[idx]
    novos[idx] = novos[novoIdx]
    novos[novoIdx] = temp
    setConfig((prev) => ({ ...prev, blocks: novos }))
  }

  // Manipulação de Atalhos
  function moverAtalho(idx: number, direcao: -1 | 1) {
    const novoIdx = idx + direcao
    if (novoIdx < 0 || novoIdx >= config.shortcuts.length) return
    const novos = [...config.shortcuts]
    const temp = novos[idx]
    novos[idx] = novos[novoIdx]
    novos[novoIdx] = temp
    setConfig((prev) => ({ ...prev, shortcuts: novos }))
  }

  // Manipulação de Banners
  function abrirNovoBanner() {
    setBannerEditandoIndex(null)
    setFormBannerTitulo('')
    setFormBannerLink('')
    setFormBannerImagem('')
    setFormBannerImagemMobile('')
    setFormBannerAtivo(true)
    setShowBannerModal(true)
  }

  function abrirEditarBanner(idx: number) {
    const b = config.banners[idx]
    if (!b) return
    setBannerEditandoIndex(idx)
    setFormBannerTitulo(b.titulo)
    setFormBannerLink(b.link)
    setFormBannerImagem(b.imagem)
    setFormBannerImagemMobile(b.imagem_mobile || '')
    setFormBannerAtivo(b.ativo)
    setShowBannerModal(true)
  }

  function moverBanner(idx: number, direcao: -1 | 1) {
    const novoIdx = idx + direcao
    if (novoIdx < 0 || novoIdx >= config.banners.length) return
    const novos = [...config.banners]
    const temp = novos[idx]
    novos[idx] = novos[novoIdx]
    novos[novoIdx] = temp
    setConfig((prev) => ({ ...prev, banners: novos }))
  }

  function removerBanner(idx: number) {
    setConfig((prev) => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== idx),
    }))
    showFeedback('Banner removido.')
  }

  async function handleUploadBannerImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    const res = await uploadBanner(formData)
    setUploadingBanner(false)

    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setFormBannerImagem(res.url)
      showFeedback('Imagem do banner carregada com sucesso!')
    }
  }

  async function handleUploadBannerImgMobile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBannerMobile(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    const res = await uploadBanner(formData)
    setUploadingBannerMobile(false)

    if ('error' in res) {
      showFeedback(res.error, 'erro')
    } else {
      setFormBannerImagemMobile(res.url)
      showFeedback('Imagem para celular carregada com sucesso!')
    }
  }

  function handleSalvarBannerModal() {
    if (!formBannerTitulo.trim()) {
      showFeedback('Informe um título administrativo para o banner.', 'erro')
      return
    }
    if (!formBannerImagem) {
      showFeedback('Envie a imagem panorâmica do banner.', 'erro')
      return
    }

    const item: BannerItem = {
      id:
        bannerEditandoIndex !== null && config.banners[bannerEditandoIndex]
          ? config.banners[bannerEditandoIndex].id
          : String(Date.now()),
      titulo: formBannerTitulo.trim(),
      link: formBannerLink.trim() || '/',
      imagem: formBannerImagem,
      imagem_mobile: formBannerImagemMobile.trim() || undefined,
      ativo: formBannerAtivo,
    }

    setConfig((prev) => {
      const novos = [...prev.banners]
      if (bannerEditandoIndex !== null) {
        novos[bannerEditandoIndex] = item
      } else {
        novos.push(item)
      }
      return { ...prev, banners: novos }
    })

    setShowBannerModal(false)
    showFeedback('Banner preparado! Salve as alterações da homepage para aplicar.')
  }

  // Salvamento Geral da Homepage
  function handleSalvarTudo() {
    startTransition(async () => {
      const res = await salvarConfigHomepage(config)
      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        showFeedback('Configuração da Homepage salva com sucesso!')
      }
    })
  }

  // Estilos padronizados v9
  const cardStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e4dce0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  }

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
    padding: '8px 14px',
    fontSize: '13px',
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
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '90px' }}>
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
            Homepage
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
            Composição da homepage
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#71636a' }}>
            Organize os blocos da página inicial, banners e apresentação geral do site.
          </p>
        </div>

        <div className="homepage-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={btnNeutro}>
            Ver homepage ↗
          </a>
          <button
            type="button"
            onClick={handleSalvarTudo}
            disabled={isPending}
            style={btnPrimario}
          >
            {isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="homepage-manager-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Bloco 1: Estrutura da Página ───────────────────────────────── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
            Blocos da página inicial
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#71636a' }}>
            Ative, desative ou reordene os blocos que compõem a homepage.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {config.blocks.map((bloco, idx) => {
              const ativo = !config.hidden.includes(bloco)
              return (
                <div
                  key={bloco}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: ativo ? '#ffffff' : '#f9fafb',
                    border: '1px solid #e4dce0',
                    borderRadius: '6px',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={(e) => toggleBloco(bloco, e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#861e32' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: ativo ? '#30252a' : '#888' }}>
                      {bloco}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: ativo ? '#e9f3ef' : '#f0f0f0',
                        color: ativo ? '#23634e' : '#777',
                        padding: '1px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => moverBloco(idx, -1)}
                      disabled={idx === 0}
                      title="Subir bloco"
                      style={{
                        border: '1px solid #ced9df',
                        background: 'white',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        opacity: idx === 0 ? 0.3 : 1,
                        fontSize: '12px',
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moverBloco(idx, 1)}
                      disabled={idx === config.blocks.length - 1}
                      title="Descer bloco"
                      style={{
                        border: '1px solid #ced9df',
                        background: 'white',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        cursor: idx === config.blocks.length - 1 ? 'default' : 'pointer',
                        opacity: idx === config.blocks.length - 1 ? 0.3 : 1,
                        fontSize: '12px',
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <small style={{ display: 'block', marginTop: '12px', color: '#71636a' }}>
            * Cabeçalho e rodapé têm posição fixa permanente.
          </small>
        </div>

        {/* ── Bloco 2: Atalhos de Serviços ───────────────────────────────── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
            Atalhos de serviços
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#71636a' }}>
            Os 4 botões de acesso rápido aos serviços mais demandados da categoria.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {config.shortcuts.map((shortcutId, idx) => {
              const item = SHORTCUT_LABELS[shortcutId] || { label: shortcutId, url: '#' }
              return (
                <div
                  key={shortcutId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#ffffff',
                    border: '1px solid #e4dce0',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#30252a' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71636a' }}>
                      Destino: {item.url}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => moverAtalho(idx, -1)}
                      disabled={idx === 0}
                      title="Subir atalho"
                      style={{
                        border: '1px solid #ced9df',
                        background: 'white',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        opacity: idx === 0 ? 0.3 : 1,
                        fontSize: '12px',
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moverAtalho(idx, 1)}
                      disabled={idx === config.shortcuts.length - 1}
                      title="Descer atalho"
                      style={{
                        border: '1px solid #ced9df',
                        background: 'white',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        cursor: idx === config.shortcuts.length - 1 ? 'default' : 'pointer',
                        opacity: idx === config.shortcuts.length - 1 ? 0.3 : 1,
                        fontSize: '12px',
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <small style={{ display: 'block', marginTop: '12px', color: '#71636a' }}>
            Ordem da esquerda para a direita na exibição da barra de atalhos.
          </small>
        </div>
      </div>

      {/* ── Bloco 3: Apresentação das Notícias (Modelos A e B) ─────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
              Apresentação das notícias em destaque
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
              Escolha o formato visual de distribuição das 4 notícias de capa.
            </p>
          </div>

          <a
            href="/admin/noticias"
            style={{
              ...btnNeutro,
              background: '#fff2df',
              color: '#825914',
              borderColor: '#f6deb3',
              fontWeight: 700,
            }}
          >
            ★ Ir para Notícias e Organizar Destaques →
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Modelo A */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, model: 'A' }))}
            style={{
              border: config.model === 'A' ? '2px solid #861e32' : '1px solid #e4dce0',
              background: config.model === 'A' ? '#fdf8f9' : 'white',
              borderRadius: '8px',
              padding: '18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '15px', color: '#30252a' }}>Modelo A</strong>
              <input
                type="radio"
                name="modeloNoticias"
                checked={config.model === 'A'}
                onChange={() => setConfig((prev) => ({ ...prev, model: 'A' }))}
                style={{ accentColor: '#861e32', width: '16px', height: '16px' }}
              />
            </div>
            <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 12px 0' }}>
              Quatro matérias em <strong>duas colunas e duas linhas</strong>. Leitura equilibrada de 1 a 4.
            </p>

            {/* Diagrama Modelo A */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', height: '60px' }}>
              {['1', '2', '3', '4'].map((n) => (
                <div
                  key={n}
                  style={{
                    background: config.model === 'A' ? '#e8c8ce' : '#f0f0f0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#65172a',
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Modelo B */}
          <div
            onClick={() => setConfig((prev) => ({ ...prev, model: 'B' }))}
            style={{
              border: config.model === 'B' ? '2px solid #861e32' : '1px solid #e4dce0',
              background: config.model === 'B' ? '#fdf8f9' : 'white',
              borderRadius: '8px',
              padding: '18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '15px', color: '#30252a' }}>Modelo B</strong>
              <input
                type="radio"
                name="modeloNoticias"
                checked={config.model === 'B'}
                onChange={() => setConfig((prev) => ({ ...prev, model: 'B' }))}
                style={{ accentColor: '#861e32', width: '16px', height: '16px' }}
              />
            </div>
            <p style={{ fontSize: '13px', color: '#71636a', margin: '0 0 12px 0' }}>
              Uma matéria <strong>maior em destaque</strong> e três menores logo abaixo.
            </p>

            {/* Diagrama Modelo B */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '60px' }}>
              <div
                style={{
                  flex: 1,
                  background: config.model === 'B' ? '#e8c8ce' : '#f0f0f0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#65172a',
                }}
              >
                1 (Principal)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', flex: 1 }}>
                {['2', '3', '4'].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: config.model === 'B' ? '#e8c8ce' : '#f0f0f0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#65172a',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Posicionamento do Bloco de Serviços ── */}
        <div
          style={{
            marginTop: '20px',
            marginBottom: '16px',
            paddingTop: '18px',
            borderTop: '1px solid #e4dce0',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', margin: '0 0 4px 0' }}>
              Posição do Bloco de Serviços (Fique Sócio, Denúncia, Colônia e Jurídico)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
              Escolha a posição dos atalhos em relação ao bloco de notícias em destaque na homepage.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: config.model === 'B' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            {config.model === 'B' ? (
              <>
                <label
                  onClick={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'entre' }))}
                  style={{
                    border: (config.posicaoServicos || 'entre') === 'entre' ? '2px solid #861e32' : '1px solid #e4dce0',
                    background: (config.posicaoServicos || 'entre') === 'entre' ? '#fdf8f9' : 'white',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="posicaoServicos"
                    checked={(config.posicaoServicos || 'entre') === 'entre'}
                    onChange={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'entre' }))}
                    style={{ accentColor: '#861e32' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#30252a' }}>Entre Manchete e Secundárias</strong>
                    <span style={{ fontSize: '11.5px', color: '#71636a' }}>No meio da tela (Padrão)</span>
                  </div>
                </label>

                <label
                  onClick={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'acima' }))}
                  style={{
                    border: config.posicaoServicos === 'acima' ? '2px solid #861e32' : '1px solid #e4dce0',
                    background: config.posicaoServicos === 'acima' ? '#fdf8f9' : 'white',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="posicaoServicos"
                    checked={config.posicaoServicos === 'acima'}
                    onChange={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'acima' }))}
                    style={{ accentColor: '#861e32' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#30252a' }}>Acima da Manchete</strong>
                    <span style={{ fontSize: '11.5px', color: '#71636a' }}>No topo antes das notícias</span>
                  </div>
                </label>

                <label
                  onClick={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'abaixo' }))}
                  style={{
                    border: config.posicaoServicos === 'abaixo' ? '2px solid #861e32' : '1px solid #e4dce0',
                    background: config.posicaoServicos === 'abaixo' ? '#fdf8f9' : 'white',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="posicaoServicos"
                    checked={config.posicaoServicos === 'abaixo'}
                    onChange={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'abaixo' }))}
                    style={{ accentColor: '#861e32' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#30252a' }}>Abaixo das Secundárias</strong>
                    <span style={{ fontSize: '11.5px', color: '#71636a' }}>Logo após as 4 notícias</span>
                  </div>
                </label>
              </>
            ) : (
              <>
                <label
                  onClick={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'acima' }))}
                  style={{
                    border: (config.posicaoServicos === 'acima' || config.posicaoServicos === 'entre' || !config.posicaoServicos) ? '2px solid #861e32' : '1px solid #e4dce0',
                    background: (config.posicaoServicos === 'acima' || config.posicaoServicos === 'entre' || !config.posicaoServicos) ? '#fdf8f9' : 'white',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="posicaoServicos"
                    checked={config.posicaoServicos === 'acima' || config.posicaoServicos === 'entre' || !config.posicaoServicos}
                    onChange={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'acima' }))}
                    style={{ accentColor: '#861e32' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#30252a' }}>Acima da Grade 2×2</strong>
                    <span style={{ fontSize: '11.5px', color: '#71636a' }}>No topo antes das 4 notícias</span>
                  </div>
                </label>

                <label
                  onClick={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'abaixo' }))}
                  style={{
                    border: config.posicaoServicos === 'abaixo' ? '2px solid #861e32' : '1px solid #e4dce0',
                    background: config.posicaoServicos === 'abaixo' ? '#fdf8f9' : 'white',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="posicaoServicos"
                    checked={config.posicaoServicos === 'abaixo'}
                    onChange={() => setConfig((prev) => ({ ...prev, posicaoServicos: 'abaixo' }))}
                    style={{ accentColor: '#861e32' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#30252a' }}>Abaixo da Grade 2×2</strong>
                    <span style={{ fontSize: '11.5px', color: '#71636a' }}>Logo após as 4 notícias</span>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Aviso de Destaques alinhado ao pedido do usuário */}
        <div
          style={{
            background: '#fff9ea',
            border: '1px solid #f2dfa9',
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#7a5a10', lineHeight: 1.5 }}>
            📌 <strong>Gestão de Destaques:</strong> A escolha de quais 4 notícias aparecem no bloco e sua ordem exata (1ª a 4ª) são administradas diretamente na tela de <strong>Notícias</strong>.
          </div>
          <a
            href="/admin/noticias"
            style={{
              background: '#861e32',
              color: 'white',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Abrir Notícias →
          </a>
        </div>
      </div>

      {/* ── Bloco 4: Banners Rotativos (9:2) ───────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
              Banners rotativos da homepage
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
              Banners panorâmicos em proporção 9:2 (dimensão de referência: 1800 × 400 pixels).
            </p>
          </div>

          <button type="button" onClick={abrirNovoBanner} style={btnPrimario}>
            ＋ Adicionar banner
          </button>
        </div>

        {config.banners.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {config.banners.map((banner, idx) => (
              <div
                key={banner.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 16px',
                  background: '#fcfbfa',
                  border: '1px solid #e4dce0',
                  borderRadius: '6px',
                }}
              >
                {/* Miniatura 9:2 */}
                <div
                  style={{
                    width: '135px',
                    height: '30px',
                    background: '#30252a',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={banner.imagem}
                    alt={banner.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#30252a' }}>{banner.titulo}</strong>
                    <span
                      style={{
                        fontSize: '11px',
                        background: banner.ativo ? '#e9f3ef' : '#f0f0f0',
                        color: banner.ativo ? '#23634e' : '#777',
                        padding: '1px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {banner.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>
                    Link: {banner.link || 'Nenhum'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => moverBanner(idx, -1)}
                    disabled={idx === 0}
                    title="Subir banner"
                    style={{
                      border: '1px solid #ced9df',
                      background: 'white',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: idx === 0 ? 'default' : 'pointer',
                      opacity: idx === 0 ? 0.3 : 1,
                      fontSize: '12px',
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverBanner(idx, 1)}
                    disabled={idx === config.banners.length - 1}
                    title="Descer banner"
                    style={{
                      border: '1px solid #ced9df',
                      background: 'white',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: idx === config.banners.length - 1 ? 'default' : 'pointer',
                      opacity: idx === config.banners.length - 1 ? 0.3 : 1,
                      fontSize: '12px',
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirEditarBanner(idx)}
                    style={{ ...btnNeutro, padding: '4px 10px', fontSize: '12px' }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removerBanner(idx)}
                    style={{
                      ...btnNeutro,
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#861e32',
                      borderColor: '#e8c8ce',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              border: '1px dashed #ced9df',
              borderRadius: '6px',
              color: '#71636a',
              fontSize: '13px',
            }}
          >
            Nenhum banner cadastrado. Clique no botão acima para adicionar o primeiro banner da homepage.
          </div>
        )}
      </div>

      {/* ── Bloco 5: Rodapé Editorial ──────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
          Rodapé institucional
        </h2>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#71636a' }}>
          Informações de contato e dados das sedes sindicais exibidos na base de todas as páginas públicas.
        </p>

        <textarea
          rows={4}
          value={config.footer}
          onChange={(e) => setConfig((prev) => ({ ...prev, footer: e.target.value }))}
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5 }}
          placeholder="São José dos Campos — (12) 3921-8177 | Taubaté — (12) 3632-0932…"
        />
        <small style={{ display: 'block', marginTop: '6px', color: '#71636a' }}>
          Conteúdo independente do formulário de Fale Conosco.
        </small>
      </div>

      {/* ── Savebar Fixa na Base ────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '252px',
          right: 0,
          background: 'white',
          borderTop: '1px solid #e4dce0',
          padding: '14px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          zIndex: 90,
        }}
      >
        <span style={{ fontSize: '13px', color: '#71636a' }}>
          Alterações na homepage só entram no ar após clicar em Salvar.
        </span>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={btnNeutro}>
            Ver homepage ↗
          </a>
          <button
            type="button"
            onClick={handleSalvarTudo}
            disabled={isPending}
            style={btnPrimario}
          >
            {isPending ? 'Salvando alterações…' : 'Salvar alterações da homepage'}
          </button>
        </div>
      </div>

      {/* ── Modal: Adicionar / Editar Banner ────────────────────────────── */}
      {showBannerModal && (
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
          onClick={() => setShowBannerModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
              {bannerEditandoIndex !== null ? 'Editar banner rotativo' : 'Adicionar novo banner'}
            </h2>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#71636a' }}>
              Banners rotativos exibem campanhas, avisos e mobilizações na parte superior da homepage.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Título administrativo (identificação interna e acessibilidade) *</label>
                <input
                  type="text"
                  required
                  value={formBannerTitulo}
                  onChange={(e) => setFormBannerTitulo(e.target.value)}
                  placeholder="Ex.: Campanha Salarial 2026"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>Link de destino (ao clicar no banner)</label>
                <input
                  type="text"
                  value={formBannerLink}
                  onChange={(e) => setFormBannerLink(e.target.value)}
                  placeholder="Ex.: /noticias/campanha-salarial ou https://…"
                  style={inputStyle}
                />
              </div>

              {/* Upload de Imagem 9:2 */}
              <div
                style={{
                  border: '1px solid #ced9df',
                  borderRadius: '6px',
                  padding: '14px',
                  background: '#fcfbfa',
                }}
              >
                <label style={{ ...labelStyle, marginBottom: '8px' }}>
                  Imagem panorâmica (Proporção 9:2 — ref. 1800 × 400 px) *
                </label>

                {formBannerImagem ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '9 / 2',
                        background: '#30252a',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '6px',
                      }}
                    >
                      <img
                        src={formBannerImagem}
                        alt="Prévia do banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormBannerImagem('')}
                      style={{ border: 'none', background: 'transparent', color: '#861e32', fontSize: '12px', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Trocar imagem do banner
                    </button>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadBannerImg}
                  disabled={uploadingBanner}
                  style={{ fontSize: '13px' }}
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#71636a' }}>
                  {uploadingBanner
                    ? 'Enviando imagem do banner…'
                    : 'Formatos aceitos: JPG, PNG ou WebP.'}
                </small>
              </div>

              {/* Upload de Imagem para Celular (4:3) */}
              <div
                style={{
                  border: '1px solid #ced9df',
                  borderRadius: '6px',
                  padding: '14px',
                  background: '#fcfbfa',
                }}
              >
                <label style={{ ...labelStyle, marginBottom: '8px' }}>
                  Versão para celular (Opcional — Proporção 4:3 — ref. 1200 × 900 px)
                </label>

                {formBannerImagemMobile ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '160px',
                        aspectRatio: '4 / 3',
                        background: '#30252a',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '6px',
                      }}
                    >
                      <img
                        src={formBannerImagemMobile}
                        alt="Prévia do banner para celular"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormBannerImagemMobile('')}
                      style={{ border: 'none', background: 'transparent', color: '#861e32', fontSize: '12px', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remover imagem de celular
                    </button>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadBannerImgMobile}
                  disabled={uploadingBannerMobile}
                  style={{ fontSize: '13px' }}
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#71636a' }}>
                  {uploadingBannerMobile
                    ? 'Enviando imagem para celular…'
                    : 'Se não informada, será usada a imagem panorâmica normal.'}
                </small>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formBannerAtivo}
                  onChange={(e) => setFormBannerAtivo(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#861e32' }}
                />
                <span>Exibir este banner na homepage (ativo)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e4dce0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowBannerModal(false)} style={btnNeutro}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarBannerModal}
                  disabled={uploadingBanner}
                  style={btnPrimario}
                >
                  Concluir
                </button>
              </div>
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
      {/* ── ESTILOS RESPONSIVOS MOBILE DA HOMEPAGE ── */}
      <style>{`
        @media (max-width: 860px) {
          .homepage-manager-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .homepage-header-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          .homepage-header-actions button,
          .homepage-header-actions a {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
            padding: 12px 14px !important;
            font-size: 14px !important;
            min-height: 44px !important;
          }
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
