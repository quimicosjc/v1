'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import {
  salvarPaginaInstitucional,
  uploadMidiaInstitucional,
  uploadDocumentoInstitucional,
} from '@/app/admin/paginas/actions'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        border: '1px solid #cbd7de',
        borderRadius: '5px',
        minHeight: '280px',
        background: 'white',
      }}
    />
  ),
})

interface EditorTextoProps {
  pagina: PaginaInstitucional
}

export default function EditorTextoInstitucional({ pagina }: EditorTextoProps) {
  const [titulo, setTitulo] = useState(pagina.titulo || '')
  const [subtitulo, setSubtitulo] = useState(pagina.subtitulo || '')
  const [chapeu, setChapeu] = useState(pagina.chapeu || '')
  const [corpo, setCorpo] = useState(pagina.corpo || '')
  const [bannerUrl, setBannerUrl] = useState(pagina.banner_url || '')
  const [imagemY, setImagemY] = useState(pagina.imagem_y ?? 50)
  const [status, setStatus] = useState<'rascunho' | 'publicado'>(pagina.status === 'rascunho' ? 'rascunho' : 'publicado')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  const bannerInputRef = useRef<HTMLInputElement>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Salvamento automático a cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      if (alterado && !salvando) {
        handleSalvar(status, true)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [alterado, salvando, titulo, subtitulo, chapeu, corpo, bannerUrl, imagemY, status])

  async function handleSalvar(novoStatus: 'rascunho' | 'publicado', silencioso = false) {
    if (!titulo.trim()) {
      if (!silencioso) showToast('O título da página é obrigatório.', 'erro')
      return
    }

    setSalvando(true)
    const res = await salvarPaginaInstitucional(pagina.slug, {
      titulo,
      subtitulo: subtitulo || null,
      chapeu: chapeu || null,
      corpo,
      banner_url: bannerUrl || null,
      imagem_y: imagemY,
      status: novoStatus,
    })
    setSalvando(false)

    if ('error' in res) {
      if (!silencioso) showToast(res.error, 'erro')
    } else {
      setStatus(novoStatus)
      setAlterado(false)
      if (!silencioso) {
        showToast(novoStatus === 'publicado' ? 'Página publicada com sucesso!' : 'Rascunho salvo com sucesso!')
      }
    }
  }

  async function handleUploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('arquivo', file)
    showToast('Enviando foto...')

    const res = await uploadMidiaInstitucional(formData)
    if ('error' in res) {
      showToast(res.error, 'erro')
    } else {
      setBannerUrl(res.url)
      setAlterado(true)
      showToast('Foto atualizada com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Eyebrow e Título */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / {pagina.chapeu?.toUpperCase() || 'INSTITUCIONAL'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: 0, letterSpacing: '-0.5px' }}>
            {pagina.titulo}
          </h1>

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
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card Título e Subtítulo */}
        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#30252a', marginBottom: '6px' }}>
              Chapéu / Grupo
            </label>
            <input
              type="text"
              value={chapeu}
              onChange={(e) => { setChapeu(e.target.value); setAlterado(true) }}
              placeholder="Ex.: Sindicato, Serviços, Jurídico..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '14px',
                color: '#30252a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#30252a', marginBottom: '6px' }}>
              Título da página <span style={{ color: '#861e32' }}>*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setAlterado(true) }}
              placeholder="Título exibido no topo da página..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#30252a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#30252a', marginBottom: '6px' }}>
              Subtítulo <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={subtitulo}
              onChange={(e) => { setSubtitulo(e.target.value); setAlterado(true) }}
              placeholder="Breve linha descritiva exibida abaixo do título..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '14px',
                color: '#30252a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Card Foto Principal / Banner (com Foco 3:2) */}
        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#30252a' }}>
                Foto principal / Imagem de cabeçalho
              </label>
              <p style={{ fontSize: '12px', color: '#71636a', margin: '2px 0 0' }}>
                Exibida em destaque no topo da página (proporção 3:2).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleUploadBanner}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                style={{
                  padding: '7px 14px',
                  borderRadius: '5px',
                  border: '1px solid #ced9df',
                  background: '#ffffff',
                  color: '#30252a',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {bannerUrl ? 'Trocar foto' : 'Enviar foto'}
              </button>

              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => { setBannerUrl(''); setAlterado(true) }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '5px',
                    border: '1px solid #e4dce0',
                    background: '#fff0f3',
                    color: '#861e32',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {bannerUrl && (
            <div style={{ marginTop: '14px' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  maxHeight: '360px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f0f0f0',
                  border: '1px solid #e4dce0',
                }}
              >
                <img
                  src={bannerUrl}
                  alt={titulo}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `50% ${imagemY}%`,
                    display: 'block',
                  }}
                />
              </div>

              {/* Slider de Foco */}
              <div style={{ marginTop: '12px', background: '#f8fafb', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e4dce0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#30252a' }}>
                    Ponto de foco vertical: {imagemY}%
                  </span>
                  <button
                    type="button"
                    onClick={() => { setImagemY(50); setAlterado(true) }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#861e32',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Centralizar (50%)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imagemY}
                  onChange={(e) => { setImagemY(Number(e.target.value)); setAlterado(true) }}
                  style={{ width: '100%', accentColor: '#861e32', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card Editor de Texto Rico */}
        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#30252a', marginBottom: '8px' }}>
            Conteúdo da página <span style={{ color: '#861e32' }}>*</span>
          </label>
          <RichEditor
            content={corpo}
            onChange={(html) => { setCorpo(html); setAlterado(true) }}
            placeholder="Escreva e formate os textos desta seção..."
            onUploadImage={async (file) => {
              const formData = new FormData()
              formData.append('arquivo', file)
              const res = await uploadMidiaInstitucional(formData)
              if ('error' in res) throw new Error(res.error)
              return res.url
            }}
          />
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '3px',
              background: status === 'publicado' ? '#e9f3ef' : '#fff2df',
              color: status === 'publicado' ? '#23634e' : '#825914',
            }}
          >
            {status === 'publicado' ? 'Publicada' : 'Rascunho'}
          </span>
          <span style={{ fontSize: '13px', color: '#71636a' }}>
            {alterado ? 'Alterações não salvas' : 'Tudo salvo'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            disabled={salvando}
            onClick={() => handleSalvar('rascunho')}
            style={{
              padding: '9px 18px',
              borderRadius: '5px',
              border: '1px solid #ced9df',
              background: '#ffffff',
              color: '#30252a',
              fontSize: '13px',
              fontWeight: 600,
              cursor: salvando ? 'not-allowed' : 'pointer',
            }}
          >
            Salvar rascunho
          </button>

          <button
            type="button"
            disabled={salvando}
            onClick={() => handleSalvar('publicado')}
            style={{
              padding: '9px 20px',
              borderRadius: '5px',
              border: 'none',
              background: '#861e32',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: salvando ? 'not-allowed' : 'pointer',
            }}
          >
            {salvando ? 'Salvando...' : status === 'publicado' ? 'Atualizar publicação' : 'Publicar página'}
          </button>
        </div>
      </div>

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
