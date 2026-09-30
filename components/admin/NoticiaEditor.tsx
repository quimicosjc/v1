'use client'

import { useState, useRef, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Noticia, NoticiaFormData } from '@/app/admin/noticias/actions'
import {
  criarNoticia,
  atualizarNoticia,
  publicarNoticia,
  moverParaLixeira,
  uploadMidia,
  uploadDocumento,
} from '@/app/admin/noticias/actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FotoItem {
  url: string
  preview: string
  foco: number
  legenda: string
  credito: string
  enviando: boolean
  erro: string | null
}

interface DocumentoItem {
  url: string
  nome: string
  tipo: string
}

interface NoticiaEditorProps {
  noticia: Noticia | null
}

type ToastType = 'sucesso' | 'erro'

// ── Helper: format file size ──────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Helper: browser image compression ────────────────────────────────────────

async function comprimirImagem(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_WIDTH = 1400
      let { width, height } = img
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas não disponível'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'))
            return
          }
          resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.82,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Falha ao carregar imagem'))
    }
    img.src = objectUrl
  })
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

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

// ── Shared styles ─────────────────────────────────────────────────────────────

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

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e4dce0',
  borderRadius: '8px',
  padding: '24px',
}

const btnNeutro: React.CSSProperties = {
  border: '1px solid #ced9df',
  background: 'white',
  color: '#30252a',
  borderRadius: '5px',
  padding: '9px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnPrimario: React.CSSProperties = {
  background: '#861e32',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NoticiaEditor({ noticia }: NoticiaEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- Form state ---
  const [titulo, setTitulo] = useState(noticia?.titulo ?? '')
  const [resumo, setResumo] = useState(noticia?.resumo ?? '')
  const [corpo, setCorpo] = useState(noticia?.corpo ?? '')
  const [destaque, setDestaque] = useState(noticia?.destaque ?? false)
  const [publicadoEm, setPublicadoEm] = useState(
    noticia?.publicado_em ? noticia.publicado_em.slice(0, 16) : '',
  )
  const [status, setStatus] = useState<'rascunho' | 'publicado' | 'lixeira' | 'programado'>(
    noticia?.status ?? 'rascunho',
  )
  const [noticiaId, setNoticiaId] = useState<string | null>(noticia?.id ?? null)
  const [alterado, setAlterado] = useState(false)
  const noticiaIdRef = useRef<string | null>(noticia?.id ?? null)

  // --- Photos ---
  const [fotos, setFotos] = useState<FotoItem[]>(() => {
    if (noticia?.fotos_json) {
      try {
        const parsed = JSON.parse(noticia.fotos_json) as Array<{
          url: string
          foco?: number
          legenda?: string
          credito?: string
        }>
        return parsed.map((f) => ({
          url: f.url,
          preview: f.url,
          foco: f.foco ?? 50,
          legenda: f.legenda ?? '',
          credito: f.credito ?? '',
          enviando: false,
          erro: null,
        }))
      } catch {
        // fallback to banner_url
      }
    }
    if (noticia?.banner_url) {
      return [{
        url: noticia.banner_url,
        preview: noticia.banner_url,
        foco: noticia.imagem_y ?? 50,
        legenda: '',
        credito: '',
        enviando: false,
        erro: null,
      }]
    }
    return []
  })

  // --- Documents ---
  const [documentos, setDocumentos] = useState<DocumentoItem[]>(() => {
    if (noticia?.documentos_json) {
      try {
        return JSON.parse(noticia.documentos_json) as DocumentoItem[]
      } catch {
        return []
      }
    }
    return []
  })
  const [enviandoDoc, setEnviandoDoc] = useState(false)

  // --- Toast ---
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Dialogs ---
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPostPublish, setShowPostPublish] = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')
  const [showAgendarDialog, setShowAgendarDialog] = useState(false)
  const [agendarData, setAgendarData] = useState('')

  // --- Autosave status ---
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('')
  const autoSaveInProgress = useRef(false)

  // --- Draft recovery ---
  const [draftDisponivel, setDraftDisponivel] = useState(false)
  const [draftIgnorado, setDraftIgnorado] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: ToastType = 'sucesso') {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, type })
    toastRef.current = setTimeout(() => setToast(null), 4000)
  }

  function markAlterado() {
    setAlterado(true)
  }

  function buildFormData(): NoticiaFormData {
    const fotosParaSalvar = fotos
      .filter((f) => f.url)
      .map((f) => ({ url: f.url, foco: f.foco, legenda: f.legenda, credito: f.credito }))

    return {
      titulo,
      resumo: resumo || undefined,
      corpo: corpo || undefined,
      destaque,
      banner_url: fotosParaSalvar[0]?.url ?? null,
      imagem_y: fotosParaSalvar[0]?.foco ?? 50,
      fotos_json: fotosParaSalvar.length > 0 ? JSON.stringify(fotosParaSalvar) : null,
      documentos_json: documentos.length > 0 ? JSON.stringify(documentos) : null,
      publicado_em: publicadoEm ? new Date(publicadoEm).toISOString() : null,
    }
  }

  // ── Draft key ─────────────────────────────────────────────────────────────

  function draftKey(id: string | null) {
    return `quimicos-rascunho-${id ?? 'nova'}`
  }

  // ── Check for local draft on mount ────────────────────────────────────────

  useEffect(() => {
    const key = draftKey(noticiaId)
    const saved = localStorage.getItem(key)
    if (saved && noticiaId) {
      setDraftDisponivel(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function recuperarDraft() {
    const key = draftKey(noticiaId)
    const saved = localStorage.getItem(key)
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as {
        titulo?: string
        resumo?: string
        corpo?: string
        destaque?: boolean
        publicadoEm?: string
        fotos?: FotoItem[]
        documentos?: DocumentoItem[]
      }
      if (draft.titulo !== undefined) setTitulo(draft.titulo)
      if (draft.resumo !== undefined) setResumo(draft.resumo)
      if (draft.corpo !== undefined) setCorpo(draft.corpo)
      if (draft.destaque !== undefined) setDestaque(draft.destaque)
      if (draft.publicadoEm !== undefined) setPublicadoEm(draft.publicadoEm)
      if (draft.fotos) setFotos(draft.fotos)
      if (draft.documentos) setDocumentos(draft.documentos)
    } catch {
      // ignore parse errors
    }
    setDraftDisponivel(false)
    setAlterado(true)
  }

  // ── Auto-save local draft every 5 seconds ────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (!alterado) return
      const key = draftKey(noticiaIdRef.current)
      const draft = { titulo, resumo, corpo, destaque, publicadoEm, fotos, documentos }
      localStorage.setItem(key, JSON.stringify(draft))
    }, 5000)
    return () => clearInterval(interval)
  }, [alterado, titulo, resumo, corpo, destaque, publicadoEm, fotos, documentos])

  // ── Auto-save to server every 30 seconds ─────────────────────────────────

  const autoSave = useCallback(async () => {
    if (!alterado || !noticiaIdRef.current || autoSaveInProgress.current) return
    autoSaveInProgress.current = true
    setAutoSaveStatus('Salvando automaticamente…')
    const data = buildFormData()
    const result = await atualizarNoticia(noticiaIdRef.current, data)
    autoSaveInProgress.current = false
    if (!('error' in result)) {
      setAlterado(false)
      const agora = new Date()
      const hhmm = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
      setAutoSaveStatus(`Salvo automaticamente às ${hhmm}`)
    } else {
      setAutoSaveStatus('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alterado, titulo, resumo, corpo, destaque, publicadoEm, fotos, documentos])

  useEffect(() => {
    const interval = setInterval(() => {
      autoSave()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  // keep ref in sync
  useEffect(() => {
    noticiaIdRef.current = noticiaId
  }, [noticiaId])

  // ── Photo handling ────────────────────────────────────────────────────────

  async function handleFotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    if (!arquivos.length) return
    e.target.value = ''

    const vagasRestantes = 5 - fotos.filter((f) => !f.enviando && f.url).length
    const arquivosParaProcessar = arquivos.slice(0, vagasRestantes)

    for (let i = 0; i < arquivosParaProcessar.length; i++) {
      const file = arquivosParaProcessar[i]
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        showToast(`"${file.name}" não é uma imagem válida. Use JPG, PNG, WebP ou GIF.`, 'erro')
        continue
      }

      const preview = URL.createObjectURL(file)
      const idx = fotos.length + i // approximate; we use functional updates below
      setFotos((prev) => [
        ...prev,
        {
          url: '',
          preview,
          foco: 50,
          legenda: '',
          credito: '',
          enviando: true,
          erro: null,
        },
      ])

      const originalSize = file.size
      showToast(`Enviando foto ${i + 1} de ${arquivosParaProcessar.length}…`)

      let compressed: File
      try {
        compressed = await comprimirImagem(file)
      } catch {
        setFotos((prev) =>
          prev.map((f, fi) =>
            fi === fotos.length + i ? { ...f, enviando: false, erro: 'Falha ao comprimir' } : f,
          ),
        )
        continue
      }

      const compressedSize = compressed.size
      const formData = new FormData()
      formData.append('arquivo', compressed)
      const result = await uploadMidia(formData)

      if ('error' in result) {
        setFotos((prev) =>
          prev.map((f, fi) =>
            fi === idx ? { ...f, enviando: false, erro: result.error } : f,
          ),
        )
        showToast(result.error, 'erro')
        continue
      }

      setFotos((prev) =>
        prev.map((f, fi) =>
          fi === idx
            ? { ...f, url: result.url, preview: result.url, enviando: false, erro: null }
            : f,
        ),
      )
      markAlterado()
      showToast(
        `Foto enviada (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`,
      )
    }
  }

  function removerFoto(idx: number) {
    if (!window.confirm('Remover esta foto da matéria? O arquivo no Storage não será apagado.'))
      return
    setFotos((prev) => prev.filter((_, i) => i !== idx))
    markAlterado()
  }

  function subirFoto(idx: number) {
    if (idx === 0) return
    setFotos((prev) => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
    markAlterado()
  }

  function descerFoto(idx: number) {
    setFotos((prev) => {
      if (idx >= prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
    markAlterado()
  }

  function atualizarFoto(idx: number, patch: Partial<FotoItem>) {
    setFotos((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
    markAlterado()
  }

  // ── Document handling ─────────────────────────────────────────────────────

  async function handleDocumentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setEnviandoDoc(true)
    const formData = new FormData()
    formData.append('arquivo', file)
    const result = await uploadDocumento(formData)
    setEnviandoDoc(false)
    if ('error' in result) {
      showToast(result.error, 'erro')
      return
    }
    setDocumentos((prev) => [...prev, { url: result.url, nome: result.nome, tipo: result.tipo }])
    markAlterado()
    showToast('Documento anexado com sucesso.')
  }

  function removerDocumento(idx: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== idx))
    markAlterado()
  }

  // ── Save / publish ────────────────────────────────────────────────────────

  async function salvarRascunho() {
    startTransition(async () => {
      const data = buildFormData()
      if (!noticiaIdRef.current) {
        const result = await criarNoticia({ ...data, status: 'rascunho' })
        if ('error' in result) { showToast(result.error, 'erro'); return }
        setNoticiaId(result.id)
        noticiaIdRef.current = result.id
        setStatus('rascunho')
        setAlterado(false)
        setAutoSaveStatus('')
        showToast('Rascunho criado com sucesso.')
        router.replace(`/admin/noticias/${result.id}`)
      } else {
        const result = await atualizarNoticia(noticiaIdRef.current, { ...data, status: 'rascunho' })
        if ('error' in result) { showToast(result.error, 'erro'); return }
        setStatus('rascunho')
        setAlterado(false)
        setAutoSaveStatus('')
        showToast('Rascunho salvo com sucesso.')
      }
    })
  }

  function handlePublicar() {
    if (!titulo.trim()) { showToast('O título é obrigatório para publicar.', 'erro'); return }
    if (!corpo.trim()) { showToast('O texto da notícia é obrigatório para publicar.', 'erro'); return }
    setShowConfirm(true)
  }

  async function confirmarPublicacao() {
    setShowConfirm(false)
    startTransition(async () => {
      const data = buildFormData()
      let id = noticiaIdRef.current
      if (!id) {
        const result = await criarNoticia({ ...data, status: 'publicado' })
        if ('error' in result) { showToast(result.error, 'erro'); return }
        id = result.id
        setNoticiaId(id)
        noticiaIdRef.current = id
        router.replace(`/admin/noticias/${id}`)
      } else {
        await atualizarNoticia(id, data)
        const result = await publicarNoticia(id)
        if ('error' in result) { showToast(result.error, 'erro'); return }
      }
      setStatus('publicado')
      setAlterado(false)
      setAutoSaveStatus('')
      // get slug for post-publish dialog
      const slug = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setPublishedSlug(slug)
      setShowPostPublish(true)
    })
  }

  async function handleAgendar() {
    if (!agendarData) { showToast('Escolha a data e hora de publicação.', 'erro'); return }
    setShowAgendarDialog(false)
    startTransition(async () => {
      const data = buildFormData()
      const isoData = new Date(agendarData).toISOString()
      let id = noticiaIdRef.current
      if (!id) {
        const result = await criarNoticia({ ...data, status: 'programado', publicado_em: isoData })
        if ('error' in result) { showToast(result.error, 'erro'); return }
        id = result.id
        setNoticiaId(id)
        noticiaIdRef.current = id
        router.replace(`/admin/noticias/${id}`)
      } else {
        const result = await atualizarNoticia(id, { ...data, status: 'programado', publicado_em: isoData })
        if ('error' in result) { showToast(result.error, 'erro'); return }
      }
      setStatus('programado')
      setPublicadoEm(agendarData)
      setAlterado(false)
      setAutoSaveStatus('')
      showToast(`Publicação programada para ${new Date(agendarData).toLocaleString('pt-BR')}.`)
    })
  }

  async function cancelarProgramacao() {
    if (!noticiaIdRef.current) return
    startTransition(async () => {
      const result = await atualizarNoticia(noticiaIdRef.current!, {
        status: 'rascunho',
        publicado_em: null,
      })
      if ('error' in result) { showToast(result.error, 'erro'); return }
      setStatus('rascunho')
      showToast('Programação cancelada.')
    })
  }

  async function handleLixeira() {
    if (!noticiaIdRef.current) { showToast('Salve a notícia antes de movê-la para a lixeira.', 'erro'); return }
    startTransition(async () => {
      const result = await moverParaLixeira(noticiaIdRef.current!)
      if ('error' in result) { showToast(result.error, 'erro'); return }
      showToast('Notícia movida para a lixeira.')
      setTimeout(() => router.push('/admin/noticias'), 1200)
    })
  }

  // ── Savebar status text ───────────────────────────────────────────────────

  let savebarStatus = ''
  if (autoSaveStatus) {
    savebarStatus = autoSaveStatus
  } else if (alterado) {
    savebarStatus = '● Há alterações não salvas'
  } else if (status === 'publicado') {
    savebarStatus = 'Publicado'
  } else if (status === 'programado') {
    const d = publicadoEm ? new Date(publicadoEm).toLocaleString('pt-BR') : ''
    savebarStatus = `Programada para ${d}`
  } else {
    savebarStatus = 'Rascunho salvo'
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fotosValidas = fotos.filter((f) => f.url || f.enviando)

  return (
    <div>
      {/* ── Draft recovery bar ── */}
      {draftDisponivel && !draftIgnorado && (
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #f0d97a',
            borderRadius: '6px',
            padding: '10px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#5a4a00',
          }}
        >
          <span>📋 Rascunho local disponível.</span>
          <button
            onClick={recuperarDraft}
            style={{ ...btnNeutro, padding: '5px 12px', fontSize: '12px', color: '#5a4a00', border: '1px solid #c9b84a' }}
          >
            Recuperar
          </button>
          <button
            onClick={() => { setDraftDisponivel(false); setDraftIgnorado(true) }}
            style={{ background: 'none', border: 'none', color: '#71636a', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
          >
            Ignorar
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          NOTÍCIAS
        </p>
        <h1 style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.6px', margin: '0', color: '#30252a' }}>
          {noticia ? 'Editar notícia' : 'Nova notícia'}
        </h1>
      </div>

      {/* ── 2-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Título */}
          <div style={cardStyle}>
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
          <div style={cardStyle}>
            <label style={labelStyle} htmlFor="resumo">
              Subtítulo <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
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

          {/* Corpo */}
          <div style={cardStyle}>
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

          {/* ── Fotos ── */}
          <div style={cardStyle}>
            <label style={{ ...labelStyle, marginBottom: '16px' }}>
              Fotos <span style={{ color: '#71636a', fontWeight: 400 }}>(até 5)</span>
            </label>

            {/* Photo list */}
            {fotosValidas.map((foto, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #e4dce0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  background: '#f7f5f6',
                }}
              >
                {/* Principal badge */}
                {idx === 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Foto principal
                    </span>
                  </div>
                )}

                {/* Enviando spinner */}
                {foto.enviando ? (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '3 / 2',
                      borderRadius: '6px',
                      background: '#e4dce0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#71636a',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    Enviando…
                  </div>
                ) : foto.erro ? (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '3 / 2',
                      borderRadius: '6px',
                      background: '#fce4ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#861e32',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    {foto.erro}
                  </div>
                ) : (
                  <>
                    {/* Image preview 3:2 with focus */}
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '3 / 2',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        border: '1px solid #e4dce0',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.preview}
                        alt={`Foto ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${foto.foco}%`,
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Focus slider */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#30252a' }}>
                          Posição da foto
                        </label>
                        <button
                          onClick={() => atualizarFoto(idx, { foco: 50 })}
                          style={{ ...btnNeutro, padding: '3px 10px', fontSize: '11px' }}
                        >
                          Centralizar
                        </button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={foto.foco}
                        onChange={(e) => atualizarFoto(idx, { foco: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#861e32' }}
                      />
                      <p style={{ fontSize: '11px', color: '#71636a', margin: '4px 0 0' }}>
                        Arraste o controle para definir qual parte da foto aparece nos recortes.
                      </p>
                    </div>

                    {/* Legenda + crédito */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#30252a', display: 'block', marginBottom: '4px' }}>
                          Legenda
                        </label>
                        <input
                          type="text"
                          value={foto.legenda}
                          onChange={(e) => atualizarFoto(idx, { legenda: e.target.value })}
                          placeholder="Descreva a foto…"
                          style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#30252a', display: 'block', marginBottom: '4px' }}>
                          Crédito
                        </label>
                        <input
                          type="text"
                          value={foto.credito}
                          onChange={(e) => atualizarFoto(idx, { credito: e.target.value })}
                          placeholder="Fotógrafo / fonte…"
                          style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Actions row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => subirFoto(idx)}
                    disabled={idx === 0}
                    style={{ ...btnNeutro, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}
                  >
                    ↑ Subir
                  </button>
                  <button
                    onClick={() => descerFoto(idx)}
                    disabled={idx === fotosValidas.length - 1}
                    style={{ ...btnNeutro, opacity: idx === fotosValidas.length - 1 ? 0.4 : 1, cursor: idx === fotosValidas.length - 1 ? 'default' : 'pointer' }}
                  >
                    ↓ Descer
                  </button>
                  <button
                    onClick={() => removerFoto(idx)}
                    style={{ ...btnNeutro, color: '#861e32', borderColor: '#e8c8ce', marginLeft: 'auto' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            {/* Add photos button */}
            {fotosValidas.length < 5 && (
              <>
                <label
                  htmlFor="fotos-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    ...btnNeutro,
                    cursor: 'pointer',
                  }}
                >
                  {fotosValidas.length === 0 ? '🖼️ Escolher fotos' : '+ Adicionar fotos'}
                </label>
                <input
                  id="fotos-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFotosChange}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '12px', color: '#71636a', margin: '8px 0 0' }}>
                  JPG, PNG, WebP ou GIF · Até {5 - fotosValidas.length} foto{5 - fotosValidas.length !== 1 ? 's' : ''} restante{5 - fotosValidas.length !== 1 ? 's' : ''} · Imagens são comprimidas automaticamente antes do envio
                </p>
              </>
            )}
            {fotosValidas.length >= 5 && (
              <p style={{ fontSize: '12px', color: '#71636a', margin: '0' }}>
                Limite de 5 fotos atingido.
              </p>
            )}
          </div>

          {/* ── Documentos ── */}
          <div style={cardStyle}>
            <label style={{ ...labelStyle, marginBottom: '16px' }}>Documentos</label>

            {documentos.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documentos.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#f7f5f6',
                      border: '1px solid #e4dce0',
                      borderRadius: '6px',
                      padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{doc.tipo === 'pdf' ? '📄' : doc.tipo === 'docx' ? '📝' : '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#30252a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.nome}
                      </div>
                      <div style={{ fontSize: '11px', color: '#71636a' }}>
                        {doc.tipo === 'pdf' ? 'Abrirá no navegador' : 'Download'}
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#861e32', textDecoration: 'none' }}
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => removerDocumento(idx)}
                      style={{ ...btnNeutro, padding: '4px 10px', fontSize: '12px', color: '#861e32', borderColor: '#e8c8ce' }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              htmlFor="doc-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                ...btnNeutro,
                cursor: enviandoDoc ? 'not-allowed' : 'pointer',
                opacity: enviandoDoc ? 0.6 : 1,
              }}
            >
              {enviandoDoc ? 'Enviando…' : '+ Adicionar documento'}
            </label>
            <input
              id="doc-upload"
              type="file"
              accept=".pdf,.docx,.zip"
              onChange={handleDocumentoChange}
              disabled={enviandoDoc}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: '12px', color: '#71636a', margin: '8px 0 0' }}>
              PDF, DOCX ou ZIP · Tamanho máximo: 20 MB
            </p>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ fontWeight: 600, color: '#71636a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
              Situação
            </div>
            <StatusBadge status={status} />
            {status === 'programado' && publicadoEm && (
              <p style={{ fontSize: '12px', color: '#365786', margin: '8px 0 0' }}>
                Programada para {new Date(publicadoEm).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* Destaque */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#30252a' }}>
              <input
                type="checkbox"
                checked={destaque}
                onChange={(e) => { setDestaque(e.target.checked); markAlterado() }}
                style={{ width: '16px', height: '16px', accentColor: '#861e32', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Destaque na homepage</div>
                <div style={{ fontSize: '12px', color: '#71636a', marginTop: '2px' }}>Exibido em posição de destaque</div>
              </div>
            </label>
          </div>

          {/* Data de publicação */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <label style={labelStyle} htmlFor="publicado-em">Data da notícia</label>
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

          {/* Programar */}
          {status !== 'publicado' && (
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ fontWeight: 600, color: '#71636a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '11px' }}>
                Programação
              </div>
              {status === 'programado' ? (
                <button
                  onClick={cancelarProgramacao}
                  disabled={isPending}
                  style={{ ...btnNeutro, width: '100%', textAlign: 'center', color: '#861e32', borderColor: '#e8c8ce' }}
                >
                  Cancelar programação
                </button>
              ) : (
                <button
                  onClick={() => setShowAgendarDialog(true)}
                  disabled={isPending}
                  style={{ ...btnNeutro, width: '100%', textAlign: 'center' }}
                >
                  🕐 Programar publicação
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Savebar ── */}
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
            style={{ fontSize: '14px', color: '#71636a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            ← Notícias
          </a>
          <span style={{ fontSize: '13px', color: '#71636a' }}>{savebarStatus}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleLixeira}
            disabled={isPending || !noticiaId}
            style={{
              ...btnNeutro,
              color: '#71636a',
              cursor: noticiaId ? 'pointer' : 'not-allowed',
              opacity: noticiaId ? 1 : 0.5,
            }}
          >
            Lixeira
          </button>
          <button
            onClick={salvarRascunho}
            disabled={isPending}
            style={{ ...btnNeutro, opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          {status !== 'publicado' && (
            <button
              onClick={() => setShowAgendarDialog(true)}
              disabled={isPending}
              style={{ ...btnNeutro, opacity: isPending ? 0.6 : 1 }}
            >
              Programar
            </button>
          )}
          <button
            onClick={handlePublicar}
            disabled={isPending}
            style={{ ...btnPrimario, opacity: isPending ? 0.6 : 1 }}
          >
            Publicar agora
          </button>
        </div>
      </div>

      {/* ── Dialog: confirm publish ── */}
      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '8px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#30252a' }}>Publicar notícia?</h2>
            <p style={{ margin: '0 0 24px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
              Tem certeza que deseja publicar? Ela ficará visível para todos os visitantes do site.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={btnNeutro}>Cancelar</button>
              <button onClick={confirmarPublicacao} style={btnPrimario}>Sim, publicar agora</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: post-publish ── */}
      {showPostPublish && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            style={{ background: 'white', borderRadius: '8px', padding: '36px', maxWidth: '440px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#30252a' }}>Notícia publicada com sucesso!</h2>
            <p style={{ margin: '0 0 28px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
              Sua notícia já está disponível no site.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`/noticias/${publishedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnPrimario, display: 'block', textDecoration: 'none', textAlign: 'center' }}
              >
                Ver no site →
              </a>
              <button
                onClick={() => setShowPostPublish(false)}
                style={{ ...btnNeutro, textAlign: 'center' }}
              >
                Continuar editando
              </button>
              <button
                onClick={() => router.push('/admin/noticias/nova')}
                style={{ ...btnNeutro, textAlign: 'center' }}
              >
                Criar outra notícia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: schedule ── */}
      {showAgendarDialog && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowAgendarDialog(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '8px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: '#30252a' }}>Programar publicação</h2>
            <label style={labelStyle} htmlFor="agendar-data">Data e hora da publicação</label>
            <input
              id="agendar-data"
              type="datetime-local"
              value={agendarData}
              onChange={(e) => setAgendarData(e.target.value)}
              style={{ ...inputStyle, marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAgendarDialog(false)} style={btnNeutro}>Cancelar</button>
              <button
                onClick={handleAgendar}
                disabled={!agendarData || isPending}
                style={{ ...btnPrimario, opacity: !agendarData || isPending ? 0.6 : 1 }}
              >
                Confirmar programação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
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
            maxWidth: '90vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
