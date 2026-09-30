'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Noticia, NoticiaFormData } from '@/app/admin/noticias/actions'
import {
  criarNoticia,
  atualizarNoticia,
  publicarNoticia,
  moverParaLixeira,
  uploadMidia,
} from '@/app/admin/noticias/actions'

interface NoticiaEditorProps {
  noticia: Noticia | null
}

type ToastType = 'sucesso' | 'erro'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    publicado:  { label: 'Publicado',   bg: '#e9f3ef', color: '#23634e' },
    rascunho:   { label: 'Rascunho',    bg: '#fff2df', color: '#825914' },
    programado: { label: 'Programado',  bg: '#eaf1fc', color: '#365786' },
    lixeira:    { label: 'Na lixeira',  bg: '#fce4ea', color: '#861e32' },
  }
  const s = map[status] ?? { label: status, bg: '#f0f0f0', color: '#555' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: '4px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  )
}

export default function NoticiaEditor({ noticia }: NoticiaEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [titulo, setTitulo] = useState(noticia?.titulo ?? '')
  const [resumo, setResumo] = useState(noticia?.resumo ?? '')
  const [corpo, setCorpo] = useState(noticia?.corpo ?? '')
  const [destaque, setDestaque] = useState(noticia?.destaque ?? false)
  const [bannerUrl, setBannerUrl] = useState(noticia?.banner_url ?? '')
  const [bannerPreview, setBannerPreview] = useState(noticia?.banner_url ?? '')
  const [publicadoEm, setPublicadoEm] = useState(
    noticia?.publicado_em ? noticia.publicado_em.slice(0, 16) : ''
  )
  const [status, setStatus] = useState<'rascunho' | 'publicado' | 'lixeira' | 'programado'>(noticia?.status ?? 'rascunho')
  const [noticiaId, setNoticiaId] = useState(noticia?.id ?? null as string | null)
  const [alterado, setAlterado] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dialog de confirmação de publicação
  const [showConfirm, setShowConfirm] = useState(false)

  function showToast(msg: string, type: ToastType = 'sucesso') {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, type })
    toastRef.current = setTimeout(() => setToast(null), 3500)
  }

  function markAlterado() {
    setAlterado(true)
  }

  function buildFormData(): NoticiaFormData {
    return {
      titulo,
      resumo: resumo || undefined,
      corpo: corpo || undefined,
      destaque,
      banner_url: bannerUrl || null,
      publicado_em: publicadoEm ? new Date(publicadoEm).toISOString() : null,
    }
  }

  async function salvarRascunho() {
    startTransition(async () => {
      const data = buildFormData()

      if (!noticiaId) {
        // Criar nova notícia como rascunho
        const result = await criarNoticia({ ...data, status: 'rascunho' })
        if ('error' in result) {
          showToast(result.error, 'erro')
          return
        }
        setNoticiaId(result.id)
        setStatus('rascunho')
        setAlterado(false)
        showToast('Rascunho criado com sucesso.')
        router.replace(`/admin/noticias/${result.id}`)
      } else {
        const result = await atualizarNoticia(noticiaId, { ...data, status: 'rascunho' })
        if ('error' in result) {
          showToast(result.error, 'erro')
          return
        }
        setStatus('rascunho')
        setAlterado(false)
        showToast('Rascunho salvo com sucesso.')
      }
    })
  }

  async function handlePublicar() {
    // Validação
    if (!titulo.trim()) {
      showToast('O título é obrigatório para publicar.', 'erro')
      return
    }
    if (!corpo.trim()) {
      showToast('O texto da notícia é obrigatório para publicar.', 'erro')
      return
    }
    setShowConfirm(true)
  }

  async function confirmarPublicacao() {
    setShowConfirm(false)
    startTransition(async () => {
      const data = buildFormData()

      if (!noticiaId) {
        // Criar e já publicar
        const result = await criarNoticia({ ...data, status: 'publicado' })
        if ('error' in result) {
          showToast(result.error, 'erro')
          return
        }
        setNoticiaId(result.id)
        setStatus('publicado')
        setAlterado(false)
        showToast('Notícia publicada com sucesso!')
        router.replace(`/admin/noticias/${result.id}`)
      } else {
        // Salvar dados e publicar
        await atualizarNoticia(noticiaId, data)
        const result = await publicarNoticia(noticiaId)
        if ('error' in result) {
          showToast(result.error, 'erro')
          return
        }
        setStatus('publicado')
        setAlterado(false)
        showToast('Notícia publicada com sucesso!')
      }
    })
  }

  async function handleLixeira() {
    if (!noticiaId) {
      showToast('Salve a notícia antes de movê-la para a lixeira.', 'erro')
      return
    }
    startTransition(async () => {
      const result = await moverParaLixeira(noticiaId)
      if ('error' in result) {
        showToast(result.error, 'erro')
        return
      }
      showToast('Notícia movida para a lixeira.')
      setTimeout(() => router.push('/admin/noticias'), 1200)
    })
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação local antes do upload
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo é muito grande. O limite é de 5 MB.', 'erro')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('Use imagens JPG, PNG, WebP ou GIF.', 'erro')
      return
    }

    // Preview local imediato
    const localUrl = URL.createObjectURL(file)
    setBannerPreview(localUrl)

    // Upload real para o Supabase Storage
    setEnviandoFoto(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    const result = await uploadMidia(formData)

    if ('error' in result) {
      showToast(result.error, 'erro')
      setBannerPreview(bannerUrl) // Reverte preview para URL anterior
      setEnviandoFoto(false)
      return
    }

    setBannerUrl(result.url)
    setBannerPreview(result.url)
    setEnviandoFoto(false)
    markAlterado()
    showToast('Foto enviada com sucesso.')
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    padding: '11px 12px',
    fontSize: '14px',
    width: '100%',
    fontFamily: 'inherit',
    color: '#30252a',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#30252a',
    marginBottom: '6px',
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          NOTÍCIAS
        </p>
        <h1 style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.6px', margin: '0', color: '#30252a' }}>
          {noticia ? 'Editar notícia' : 'Nova notícia'}
        </h1>
      </div>

      {/* Grid principal: editor + sidebar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ── COLUNA PRINCIPAL ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Título */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <label style={labelStyle} htmlFor="titulo">
              Título <span style={{ color: '#861e32' }}>*</span>
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); markAlterado() }}
              placeholder="Digite o título da notícia…"
              style={inputStyle}
            />
          </div>

          {/* Resumo */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <label style={labelStyle} htmlFor="resumo">
              Resumo <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              id="resumo"
              value={resumo}
              onChange={(e) => { setResumo(e.target.value); markAlterado() }}
              placeholder="Breve descrição exibida nos cartões e nas redes sociais…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Texto da notícia */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <label style={labelStyle} htmlFor="corpo">
              Texto da notícia <span style={{ color: '#861e32' }}>*</span>
            </label>
            <textarea
              id="corpo"
              value={corpo}
              onChange={(e) => { setCorpo(e.target.value); markAlterado() }}
              placeholder="Escreva o conteúdo completo da notícia aqui…"
              rows={14}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Foto principal */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <label style={labelStyle}>Foto principal</label>

            {/* Preview 3:2 */}
            {bannerPreview ? (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '14px',
                  border: '1px solid #e4dce0',
                  background: '#f7f5f6',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerPreview}
                  alt="Preview do banner"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  borderRadius: '6px',
                  border: '2px dashed #cbd7de',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f7f5f6',
                  marginBottom: '14px',
                  color: '#71636a',
                  fontSize: '14px',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🖼️</span>
                <span>Nenhuma imagem selecionada</span>
              </div>
            )}

            <label
              htmlFor="banner-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #ced9df',
                background: 'white',
                color: enviandoFoto ? '#71636a' : '#30252a',
                borderRadius: '5px',
                padding: '9px 16px',
                fontSize: '14px',
                cursor: enviandoFoto ? 'not-allowed' : 'pointer',
                opacity: enviandoFoto ? 0.7 : 1,
              }}
            >
              {enviandoFoto ? 'Enviando foto…' : bannerPreview ? 'Trocar imagem' : 'Escolher imagem'}
            </label>
            <input
              id="banner-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleBannerChange}
              disabled={enviandoFoto}
              style={{ display: 'none' }}
            />

            <div style={{ marginTop: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: '4px' }} htmlFor="banner-url">
                Ou cole a URL da imagem
              </label>
              <input
                id="banner-url"
                type="url"
                value={bannerUrl}
                onChange={(e) => {
                  setBannerUrl(e.target.value)
                  setBannerPreview(e.target.value)
                  markAlterado()
                }}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── SIDEBAR DE PUBLICAÇÃO ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#71636a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
              Situação
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Destaque */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#30252a',
              }}
            >
              <input
                type="checkbox"
                checked={destaque}
                onChange={(e) => { setDestaque(e.target.checked); markAlterado() }}
                style={{ width: '16px', height: '16px', accentColor: '#861e32', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Destaque na homepage</div>
                <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>
                  Exibido em posição de destaque
                </div>
              </div>
            </label>
          </div>

          {/* Data de publicação */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e4dce0',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <label style={labelStyle} htmlFor="publicado-em">
              Data de publicação
            </label>
            <input
              id="publicado-em"
              type="datetime-local"
              value={publicadoEm}
              onChange={(e) => { setPublicadoEm(e.target.value); markAlterado() }}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: '#71636a', margin: '6px 0 0' }}>
              Deixe em branco para usar a data atual ao publicar.
            </p>
          </div>
        </div>
      </div>

      {/* ── SAVEBAR FIXA ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: '20px',
          marginTop: '32px',
          background: 'white',
          border: '1px solid #e4dce0',
          borderRadius: '6px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <a
            href="/admin/noticias"
            style={{
              fontSize: '14px',
              color: '#71636a',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Notícias
          </a>
          <span style={{ fontSize: '13px', color: '#71636a' }}>
            {alterado ? '● Há alterações não salvas' : status === 'rascunho' ? 'Rascunho salvo' : status === 'publicado' ? 'Publicado' : 'Salvo'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleLixeira}
            disabled={isPending || !noticiaId}
            style={{
              border: '1px solid #ced9df',
              background: 'white',
              color: '#71636a',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '14px',
              cursor: noticiaId ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              opacity: noticiaId ? 1 : 0.5,
            }}
          >
            Mover para lixeira
          </button>
          <button
            onClick={salvarRascunho}
            disabled={isPending}
            style={{
              border: '1px solid #ced9df',
              background: 'white',
              color: '#30252a',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          <button
            onClick={handlePublicar}
            disabled={isPending}
            style={{
              background: '#861e32',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            Publicar agora
          </button>
        </div>
      </div>

      {/* ── DIALOG DE CONFIRMAÇÃO ─────────────────────────────────── */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30,20,25,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#30252a' }}>
              Publicar notícia?
            </h2>
            <p style={{ margin: '0 0 24px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
              Tem certeza que deseja publicar esta notícia? Ela ficará visível para todos os visitantes do site.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  border: '1px solid #ced9df',
                  background: 'white',
                  color: '#30252a',
                  borderRadius: '5px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPublicacao}
                style={{
                  background: '#861e32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Sim, publicar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'erro' ? '#7a1a1a' : '#183b4b',
            color: 'white',
            padding: '13px 23px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 2000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
