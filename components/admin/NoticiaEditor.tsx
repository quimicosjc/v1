'use client'

import { useState, useRef, useTransition, useEffect, useCallback, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Noticia, NoticiaFormData } from '@/app/admin/noticias/actions'
import {
  criarNoticia,
  atualizarNoticia,
  moverParaLixeira,
  retirarDoAr,
  uploadMidia,
  uploadDocumento,
  buscarThumbnailInstagram,
} from '@/app/admin/noticias/actions'
import {
  OrigemNoticia,
  detectarOrigem,
  extrairYoutubeId,
  parseInstagramUrl,
  validarUrlInstagram,
  obterYoutubeThumb,
  gerarIframeYoutube,
  inserirOuAtualizarEmbedInstagram,
} from '@/lib/social-origem'
import { IconePlataforma } from '@/components/publico/SeloOrigemSocial'
import ImagemLightboxModal, { type ImagemLightboxDados } from '@/components/admin/ImagemLightboxModal'

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

// ── Helper: strip HTML ────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// ── Helper: format datetime ───────────────────────────────────────────────────

function formatDatetimeLocal(val: string): string {
  if (!val) return ''
  try {
    const d = new Date(val)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
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
  padding: '8px 10px',
  fontSize: '13.5px',
  width: '100%',
  fontFamily: 'inherit',
  color: '#30252a',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#30252a',
  marginBottom: '4px',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e4dce0',
  borderRadius: '7px',
  padding: '14px 16px',
}

const btnNeutro: React.CSSProperties = {
  border: '1px solid #ced9df',
  background: 'white',
  color: '#30252a',
  borderRadius: '5px',
  padding: '7px 12px',
  fontSize: '12.5px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnPrimario: React.CSSProperties = {
  background: '#861e32',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  padding: '8px 15px',
  fontSize: '13.5px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NoticiaEditor({ noticia }: NoticiaEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- Form state ---
  const [abaMobile, setAbaMobile] = useState<'redacao' | 'fotos' | 'publicacao'>('redacao')
  const [chapeu, setChapeu] = useState(noticia?.chapeu ?? '')
  const [titulo, setTitulo] = useState(noticia?.titulo ?? '')
  const [subtitulo, setSubtitulo] = useState(noticia?.subtitulo ?? '')
  const [resumo, setResumo] = useState(noticia?.resumo ?? '')
  const [corpo, setCorpo] = useState(noticia?.corpo ?? '')
  const [tags, setTags] = useState<string[]>(() => {
    if (noticia?.tags_json) {
      try { return JSON.parse(noticia.tags_json) as string[] } catch { return [] }
    }
    return []
  })
  const [tagInput, setTagInput] = useState('')
  const [destaque, setDestaque] = useState(noticia?.destaque ?? false)
  const [publicadoEm, setPublicadoEm] = useState(() => {
    const d = noticia?.publicado_em ? new Date(noticia.publicado_em) : new Date()
    if (isNaN(d.getTime())) {
      const fallback = new Date()
      fallback.setMinutes(fallback.getMinutes() - fallback.getTimezoneOffset())
      return fallback.toISOString().slice(0, 16)
    }
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [status, setStatus] = useState<'rascunho' | 'publicado' | 'lixeira' | 'programado'>(
    noticia?.status ?? 'rascunho',
  )
  const [noticiaId, setNoticiaId] = useState<string | null>(noticia?.id ?? null)
  const [alterado, setAlterado] = useState(false)
  const noticiaIdRef = useRef<string | null>(noticia?.id ?? null)

  // Origem e Automação Social (Site | YouTube | Instagram)
  const [origem, setOrigem] = useState<OrigemNoticia>(() => detectarOrigem(noticia?.url_referencia))
  const [socialInput, setSocialInput] = useState(() => noticia?.url_referencia ?? '')
  const [buscandoThumbInsta, setBuscandoThumbInsta] = useState(false)
  const [igAutoStatus, setIgAutoStatus] = useState<{
    tipo: 'processando' | 'ok' | 'aviso' | 'erro'
    mensagem: string
    detalheCapa?: string
  } | null>(() => {
    const infoInicial = parseInstagramUrl(noticia?.url_referencia)
    if (!infoInicial) return null
    return {
      tipo: 'ok',
      mensagem:
        infoInicial.tipo === 'reel'
          ? 'Reel do Instagram vinculado à matéria.'
          : 'Publicação do Instagram vinculada à matéria.',
    }
  })
  const [imagemAmpliada, setImagemAmpliada] = useState<ImagemLightboxDados | null>(null)
  const ultimoIgProcessadoRef = useRef<string | null>(parseInstagramUrl(noticia?.url_referencia)?.id ?? null)
  const capaManualRef = useRef<boolean>(
    Boolean(noticia?.banner_url || (noticia?.fotos_json && noticia.fotos_json !== '[]'))
  )
  const capaAutoIgUrlRef = useRef<string | null>(null)
  const igDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const igReqSeqRef = useRef(0)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  // Mais opções editoriais
  const [showMaisOpcoes, setShowMaisOpcoes] = useState(false)
  const [urlReferencia, setUrlReferencia] = useState(noticia?.url_referencia ?? '')
  const [credito, setCredito] = useState(noticia?.credito ?? '')

  // Endereço e prévia do link
  const [showPrevia, setShowPrevia] = useState(false)

  // --- Confirm retirar do ar dialog ---
  const [showConfirmRetirar, setShowConfirmRetirar] = useState(false)

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

  // ── Computed slug ─────────────────────────────────────────────────────────

  const slug = (
    titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
      .replace(/-$/, '')
  ) || noticia?.slug || ''

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: ToastType = 'sucesso') {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, type })
    toastRef.current = setTimeout(() => setToast(null), 4000)
  }

  function markAlterado() {
    setAlterado(true)
  }

  const fotosRef = useRef<FotoItem[]>(fotos)
  useEffect(() => {
    fotosRef.current = fotos
  }, [fotos])

  useEffect(() => {
    return () => {
      if (igDebounceRef.current) clearTimeout(igDebounceRef.current)
    }
  }, [])

  function handleTrocarOrigem(novaOrigem: OrigemNoticia) {
    setOrigem(novaOrigem)
    markAlterado()
    if (novaOrigem === 'youtube' && !chapeu) {
      setChapeu('Vídeo')
    } else if (novaOrigem === 'instagram' && !chapeu) {
      setChapeu('Redes Sociais')
    }
    if (novaOrigem !== 'instagram') {
      setIgAutoStatus(null)
    }
  }

  const processarLinkInstagramAutomatico = useCallback(
    async (rawUrl: string, opcoes?: { forcarCapa?: boolean }) => {
      const limpo = rawUrl.trim()
      if (!limpo) {
        setIgAutoStatus(null)
        return
      }

      const validacao = validarUrlInstagram(limpo)
      if (!validacao.valido || !validacao.info) {
        setIgAutoStatus({
          tipo: 'erro',
          mensagem: validacao.mensagem || 'Endereço inválido do Instagram.',
        })
        return
      }

      const info = validacao.info
      setOrigem('instagram')
      setUrlReferencia(info.permalink)
      setChapeu((prev) => prev || 'Redes Sociais')

      // 1) Incorpora automaticamente no corpo da notícia sem duplicar
      const idAnterior = ultimoIgProcessadoRef.current
      setCorpo((prev) => {
        const res = inserirOuAtualizarEmbedInstagram(prev, info, idAnterior)
        return res.html
      })
      ultimoIgProcessadoRef.current = info.id
      markAlterado()

      const rotuloTipo = info.tipo === 'reel' ? 'Reel do Instagram' : 'Publicação do Instagram'
      const jaTemCapaManual =
        capaManualRef.current && fotosRef.current.some((f) => Boolean(f.url || f.enviando))

      // 2) Nunca sobrescrever capa selecionada intencionalmente pelo editor
      if (jaTemCapaManual && !opcoes?.forcarCapa) {
        setIgAutoStatus({
          tipo: 'ok',
          mensagem: `${rotuloTipo} reconhecido e incorporado automaticamente ao texto da matéria.`,
          detalheCapa: 'A imagem de capa escolhida manualmente foi mantida.',
        })
        return
      }

      // 3) Recupera imagem de capa automaticamente via metadados públicos oficiais
      const seq = ++igReqSeqRef.current
      setBuscandoThumbInsta(true)
      setIgAutoStatus({
        tipo: 'processando',
        mensagem: `${rotuloTipo} incorporado automaticamente. Recuperando imagem de capa…`,
      })

      try {
        const res = await buscarThumbnailInstagram(info.permalink)
        if (seq !== igReqSeqRef.current) return

        if ('error' in res) {
          setIgAutoStatus({
            tipo: 'aviso',
            mensagem: `${rotuloTipo} incorporado automaticamente ao texto da matéria.`,
            detalheCapa: res.error,
          })
          return
        }

        // Reconfirma que o editor não adicionou uma capa manual durante o download
        const adicionouManualDuranteBusca =
          capaManualRef.current &&
          fotosRef.current.some((f) => Boolean(f.url || f.enviando)) &&
          !opcoes?.forcarCapa

        if (adicionouManualDuranteBusca) {
          setIgAutoStatus({
            tipo: 'ok',
            mensagem: `${rotuloTipo} incorporado automaticamente.`,
            detalheCapa: 'Sua capa manual foi preservada.',
          })
          return
        }

        const novaFoto: FotoItem = {
          url: res.url,
          preview: res.url,
          foco: 50,
          legenda: info.tipo === 'reel' ? 'Reel do Instagram' : 'Publicação do Instagram',
          credito: 'Instagram',
          enviando: false,
          erro: null,
        }

        const urlAutoAnterior = capaAutoIgUrlRef.current
        capaAutoIgUrlRef.current = res.url
        if (opcoes?.forcarCapa) {
          capaManualRef.current = false
        }

        setFotos((prev) => {
          const semAnteriorAuto = urlAutoAnterior
            ? prev.filter((f) => f.url !== urlAutoAnterior)
            : prev
          const semDuplicada = semAnteriorAuto.filter((f) => f.url !== res.url)
          return [novaFoto, ...semDuplicada].slice(0, 5)
        })
        markAlterado()
        setIgAutoStatus({
          tipo: 'ok',
          mensagem: `${rotuloTipo} incorporado automaticamente e capa obtida com sucesso.`,
        })
      } catch (err) {
        if (seq !== igReqSeqRef.current) return
        console.error('Erro ao obter capa do Instagram:', err)
        setIgAutoStatus({
          tipo: 'aviso',
          mensagem: `${rotuloTipo} incorporado automaticamente ao texto da matéria.`,
          detalheCapa:
            'Não foi possível recuperar a capa automaticamente agora. Você pode enviar uma imagem manualmente ou publicar com a capa padrão.',
        })
      } finally {
        if (seq === igReqSeqRef.current) {
          setBuscandoThumbInsta(false)
        }
      }
    },
    []
  )

  function handleMudarSocialUrl(val: string) {
    setSocialInput(val)
    setUrlReferencia(val)
    markAlterado()

    const detectada = detectarOrigem(val)
    if (detectada === 'youtube') {
      if (igDebounceRef.current) clearTimeout(igDebounceRef.current)
      setOrigem('youtube')
      setIgAutoStatus(null)
      if (!chapeu) setChapeu('Vídeo')
      return
    }

    const pareceInstagram =
      detectada === 'instagram' ||
      origem === 'instagram' ||
      val.toLowerCase().includes('instagram.com')

    if (pareceInstagram) {
      if (detectada === 'instagram' && origem !== 'instagram') {
        setOrigem('instagram')
        if (!chapeu) setChapeu('Redes Sociais')
      }
      if (igDebounceRef.current) clearTimeout(igDebounceRef.current)
      if (!val.trim()) {
        setIgAutoStatus(null)
        return
      }
      igDebounceRef.current = setTimeout(() => {
        void processarLinkInstagramAutomatico(val)
      }, 380)
    } else if (!val.trim()) {
      setIgAutoStatus(null)
    }
  }

  function handleUsarCapaYoutube() {
    const ytId = extrairYoutubeId(socialInput)
    if (!ytId) {
      showToast('Cole um link válido do YouTube primeiro.', 'erro')
      return
    }
    const thumbUrl = obterYoutubeThumb(ytId)
    const novaFoto: FotoItem = {
      url: thumbUrl,
      preview: thumbUrl,
      foco: 50,
      legenda: 'Vídeo oficial do YouTube',
      credito: 'YouTube / Sindicato dos Químicos',
      enviando: false,
      erro: null,
    }
    capaManualRef.current = true
    setFotos((prev) => [novaFoto, ...prev.filter((f) => f.url !== thumbUrl)].slice(0, 5))
    markAlterado()
    showToast('Capa do YouTube definida como foto principal!', 'sucesso')
  }

  function handleInserirPlayerYoutube() {
    const ytId = extrairYoutubeId(socialInput)
    if (!ytId) {
      showToast('Cole um link válido do YouTube primeiro.', 'erro')
      return
    }
    const iframeHtml = gerarIframeYoutube(ytId)
    setCorpo((prev) => {
      const p = prev?.trim() || ''
      if (!p || p === '<p></p>') return `<p>${iframeHtml}</p>`
      return `${p}<p>${iframeHtml}</p>`
    })
    markAlterado()
    showToast('Player do YouTube inserido no texto da notícia!', 'sucesso')
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
      chapeu: chapeu || null,
      subtitulo: subtitulo || null,
      tags_json: tags.length > 0 ? JSON.stringify(tags) : null,
      url_referencia: urlReferencia || null,
      credito: credito || null,
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
        chapeu?: string
        titulo?: string
        subtitulo?: string
        resumo?: string
        corpo?: string
        destaque?: boolean
        publicadoEm?: string
        fotos?: FotoItem[]
        documentos?: DocumentoItem[]
        tags?: string[]
        urlReferencia?: string
        credito?: string
      }
      if (draft.chapeu !== undefined) setChapeu(draft.chapeu)
      if (draft.titulo !== undefined) setTitulo(draft.titulo)
      if (draft.subtitulo !== undefined) setSubtitulo(draft.subtitulo)
      if (draft.resumo !== undefined) setResumo(draft.resumo)
      if (draft.corpo !== undefined) setCorpo(draft.corpo)
      if (draft.destaque !== undefined) setDestaque(draft.destaque)
      if (draft.publicadoEm !== undefined) setPublicadoEm(draft.publicadoEm)
      if (draft.fotos) setFotos(draft.fotos)
      if (draft.documentos) setDocumentos(draft.documentos)
      if (draft.tags) setTags(draft.tags)
      if (draft.urlReferencia !== undefined) setUrlReferencia(draft.urlReferencia)
      if (draft.credito !== undefined) setCredito(draft.credito)
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
      const draft = { chapeu, titulo, subtitulo, resumo, corpo, destaque, publicadoEm, fotos, documentos, tags, urlReferencia, credito }
      localStorage.setItem(key, JSON.stringify(draft))
    }, 5000)
    return () => clearInterval(interval)
  }, [alterado, chapeu, titulo, subtitulo, resumo, corpo, destaque, publicadoEm, fotos, documentos, tags, urlReferencia, credito])

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
  }, [alterado, chapeu, titulo, subtitulo, resumo, corpo, destaque, publicadoEm, fotos, documentos, tags, urlReferencia, credito])

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

  // Suporte a Cmd+V / Ctrl+V para colar imagens da área de transferência
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            const vagas = 5 - fotos.filter((f) => !f.enviando && f.url).length
            if (vagas <= 0) {
              showToast('Limite máximo de 5 fotos atingido.', 'erro')
              return
            }
            showToast('Processando foto colada da área de transferência…')
            const preview = URL.createObjectURL(file)
            const novoIndex = fotos.length
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
            try {
              const compressed = await comprimirImagem(file)
              const formData = new FormData()
              formData.append('arquivo', compressed)
              const result = await uploadMidia(formData)
              if ('error' in result) {
                setFotos((prev) =>
                  prev.map((f, fi) =>
                    fi === novoIndex ? { ...f, enviando: false, erro: result.error } : f,
                  ),
                )
                showToast(result.error, 'erro')
              } else {
                capaManualRef.current = true
                setFotos((prev) =>
                  prev.map((f, fi) =>
                    fi === novoIndex
                      ? { ...f, url: result.url, preview: result.url, enviando: false, erro: null }
                      : f,
                  ),
                )
                markAlterado()
                showToast('Foto da área de transferência adicionada com sucesso!')
              }
            } catch {
              setFotos((prev) =>
                prev.map((f, fi) =>
                  fi === novoIndex ? { ...f, enviando: false, erro: 'Falha ao processar' } : f,
                ),
              )
            }
            break
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [fotos])

  // ── Tags handling ─────────────────────────────────────────────────────────

  function adicionarTag(valor: string) {
    const tag = valor.trim().toLowerCase().replace(/,/g, '')
    if (!tag) return
    if (tags.length >= 8) {
      showToast('Limite de 8 tags por matéria atingido.', 'erro')
      return
    }
    if (tag.length > 30) {
      showToast('Cada tag pode ter no máximo 30 caracteres.', 'erro')
      return
    }
    if (tags.includes(tag)) return
    setTags((prev) => [...prev, tag])
    setTagInput('')
    markAlterado()
  }

  function removerTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
    markAlterado()
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      adicionarTag(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
      markAlterado()
    }
  }

  function handleTagChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val.endsWith(',')) {
      adicionarTag(val)
    } else {
      setTagInput(val)
    }
  }

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

      capaManualRef.current = true
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
    setFotos((prev) => {
      const restante = prev.filter((_, i) => i !== idx)
      if (restante.length === 0) {
        capaManualRef.current = false
        capaAutoIgUrlRef.current = null
      }
      return restante
    })
    markAlterado()
  }

  function subirFoto(idx: number) {
    if (idx === 0) return
    capaManualRef.current = true
    setFotos((prev) => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
    markAlterado()
  }

  function descerFoto(idx: number) {
    capaManualRef.current = true
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
      } else {
        const result = await atualizarNoticia(noticiaIdRef.current, { ...data, status: 'rascunho' })
        if ('error' in result) { showToast(result.error, 'erro'); return }
      }
      router.push('/admin/noticias')
      router.refresh()
    })
  }

  async function atualizarPublicacao() {
    startTransition(async () => {
      if (!noticiaIdRef.current) return
      const data = buildFormData()
      const result = await atualizarNoticia(noticiaIdRef.current, { ...data, status: 'publicado' })
      if ('error' in result) { showToast(result.error, 'erro'); return }
      router.push('/admin/noticias')
      router.refresh()
    })
  }

  async function confirmarRetirarDoAr() {
    setShowConfirmRetirar(false)
    if (!noticiaIdRef.current) return
    startTransition(async () => {
      const result = await retirarDoAr(noticiaIdRef.current!)
      if ('error' in result) { showToast(result.error, 'erro'); return }
      setStatus('rascunho')
      showToast('Notícia retirada do ar e movida para rascunho.')
    })
  }

  function handlePublicar() {
    if (!titulo.trim()) { showToast('O título é obrigatório para publicar.', 'erro'); return }
    const temConteudoEmbutido = origem === 'youtube' || origem === 'instagram' || corpo.includes('<iframe') || Boolean(urlReferencia)
    const corpoTexto = corpo.replace(/<[^>]*>/g, '').trim()
    if (!temConteudoEmbutido && !corpoTexto) {
      showToast('O texto da notícia é obrigatório para matérias de texto do site.', 'erro')
      return
    }
    setShowConfirm(true)
  }

  async function confirmarPublicacao() {
    setShowConfirm(false)
    startTransition(async () => {
      const data = buildFormData()
      const dataPublicacao = data.publicado_em || new Date().toISOString()
      let id = noticiaIdRef.current
      if (!id) {
        const result = await criarNoticia({ ...data, status: 'publicado', publicado_em: dataPublicacao })
        if ('error' in result) { showToast(result.error, 'erro'); return }
      } else {
        const result = await atualizarNoticia(id, { ...data, status: 'publicado', publicado_em: dataPublicacao })
        if ('error' in result) { showToast(result.error, 'erro'); return }
      }
      router.push('/admin/noticias')
      router.refresh()
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
      } else {
        const result = await atualizarNoticia(id, { ...data, status: 'programado', publicado_em: isoData })
        if ('error' in result) { showToast(result.error, 'erro'); return }
      }
      router.push('/admin/noticias')
      router.refresh()
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

  // Resumo da prévia (strip HTML, max 120 chars)
  const resumoPrevia = (() => {
    const texto = resumo || stripHtml(corpo)
    return texto.length > 120 ? texto.slice(0, 120) + '…' : texto
  })()

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

      {/* ── Header compacto ── */}
      <div
        style={{
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#861e32', fontWeight: 700, margin: '0 0 2px' }}>
            NOTÍCIAS
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '23px', lineHeight: '1.2', letterSpacing: '-0.4px', margin: 0, color: '#30252a' }}>
              {noticia ? 'Editar notícia' : 'Nova notícia'}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>
        <a
          href="/admin/noticias"
          style={{ ...btnNeutro, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          ← Voltar à lista
        </a>
      </div>

      {/* ── Abas Táteis Superiores (Exclusivas Mobile) ── */}
      <div
        className="noticia-mobile-tabs"
        style={{
          display: 'none',
          gap: '6px',
          marginBottom: '14px',
          background: '#ffffff',
          padding: '5px',
          borderRadius: '8px',
          border: '1px solid #e4dce0',
          position: 'sticky',
          top: '64px',
          zIndex: 80,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {[
          { id: 'redacao', label: '📝 Redação' },
          { id: 'fotos', label: `📸 Fotos (${fotosValidas.length})` },
          { id: 'publicacao', label: '🚀 Publicar' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAbaMobile(tab.id as 'redacao' | 'fotos' | 'publicacao')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderRadius: '6px',
              background: abaMobile === tab.id ? '#861e32' : 'transparent',
              color: abaMobile === tab.id ? '#ffffff' : '#71636a',
              fontWeight: abaMobile === tab.id ? 700 : 600,
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 2-column grid (melhor aproveitamento horizontal) ── */}
      <div
        className="noticia-editor-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 288px',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          {/* ── BLOCO COMPACTO: ORIGEM + CABEÇALHO EDITORIAL ── */}
          <div className="noticia-secao-redacao" style={cardStyle}>
            {/* Linha 1: Origem + Link rápido de Instagram/YouTube */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                marginBottom: '12px',
                borderBottom: '1px solid #f0eaed',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleTrocarOrigem('site')}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '5px',
                    border: origem === 'site' ? '2px solid #861e32' : '1px solid #cbd7de',
                    background: origem === 'site' ? '#fdf5f6' : '#ffffff',
                    color: origem === 'site' ? '#861e32' : '#30252a',
                    fontWeight: origem === 'site' ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: 'inherit',
                  }}
                >
                  Matéria do Site
                </button>

                <button
                  type="button"
                  onClick={() => handleTrocarOrigem('instagram')}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '5px',
                    border: origem === 'instagram' ? '2px solid #ad1457' : '1px solid #cbd7de',
                    background: origem === 'instagram' ? '#fce4ec' : '#ffffff',
                    color: origem === 'instagram' ? '#ad1457' : '#30252a',
                    fontWeight: origem === 'instagram' ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                  }}
                >
                  <IconePlataforma origem="instagram" tamanho={15} decorativo />
                  <span>Instagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTrocarOrigem('youtube')}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '5px',
                    border: origem === 'youtube' ? '2px solid #c62828' : '1px solid #cbd7de',
                    background: origem === 'youtube' ? '#ffebee' : '#ffffff',
                    color: origem === 'youtube' ? '#c62828' : '#30252a',
                    fontWeight: origem === 'youtube' ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                  }}
                >
                  <IconePlataforma origem="youtube" tamanho={16} decorativo />
                  <span>YouTube</span>
                </button>
              </div>

              {/* Campo direto para colar link do Instagram ou YouTube com detecção automática */}
              <div style={{ flex: '1 1 250px', minWidth: '210px' }}>
                <label htmlFor="social-url-input" className="sr-only">
                  Link do Instagram ou YouTube
                </label>
                <input
                  id="social-url-input"
                  type="url"
                  placeholder={
                    origem === 'youtube'
                      ? 'Cole o link do vídeo do YouTube (watch?v=... ou youtu.be/...)'
                      : origem === 'instagram'
                      ? 'Cole o link do post ou Reel do Instagram (incorporação automática)…'
                      : 'Opcional: cole um link do Instagram ou YouTube para incorporar automaticamente…'
                  }
                  value={socialInput}
                  onChange={(e) => handleMudarSocialUrl(e.target.value)}
                  onBlur={() => {
                    if (
                      socialInput.trim() &&
                      (origem === 'instagram' || socialInput.toLowerCase().includes('instagram.com'))
                    ) {
                      if (igDebounceRef.current) clearTimeout(igDebounceRef.current)
                      void processarLinkInstagramAutomatico(socialInput)
                    }
                  }}
                  style={{
                    ...inputStyle,
                    padding: '7px 10px',
                    fontSize: '13px',
                    borderColor:
                      origem === 'instagram'
                        ? '#f1a7c4'
                        : origem === 'youtube'
                        ? '#ef9a9a'
                        : '#cbd7de',
                  }}
                />
              </div>
            </div>

            {/* Painel compacto: YouTube */}
            {origem === 'youtube' && (
              <div
                style={{
                  background: '#fff8f9',
                  border: '1px solid #ffcdd2',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {extrairYoutubeId(socialInput) ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>
                      ✓ Link do YouTube reconhecido
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleUsarCapaYoutube}
                        style={{
                          background: '#861e32',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Usar capa do vídeo
                      </button>
                      <button
                        type="button"
                        onClick={handleInserirPlayerYoutube}
                        style={{
                          background: '#ffffff',
                          color: '#c62828',
                          border: '1px solid #ffcdd2',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        ▶ Inserir player no texto
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: '12px', color: '#71636a' }}>
                    Cole acima o link do vídeo do YouTube para habilitar capa automática e player incorporado.
                  </p>
                )}
              </div>
            )}

            {/* Painel compacto: Instagram 100% automático */}
            {origem === 'instagram' && (
              <div
                style={{
                  background:
                    igAutoStatus?.tipo === 'erro'
                      ? '#fff5f5'
                      : igAutoStatus?.tipo === 'aviso'
                      ? '#fffbeb'
                      : '#fdf7f9',
                  border:
                    igAutoStatus?.tipo === 'erro'
                      ? '1px solid #f5b5b5'
                      : igAutoStatus?.tipo === 'aviso'
                      ? '1px solid #f2dfa9'
                      : '1px solid #f8bbd0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                }}
              >
                {!igAutoStatus ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#71636a' }}>
                    Cole o link de um post (<code>/p/...</code>) ou Reel (<code>/reel/...</code>) do Instagram no campo acima. A incorporação no texto e a captura da imagem de capa ocorrem automaticamente.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color:
                            igAutoStatus.tipo === 'erro'
                              ? '#a11f2b'
                              : igAutoStatus.tipo === 'aviso'
                              ? '#825914'
                              : '#23634e',
                        }}
                      >
                        {igAutoStatus.tipo === 'processando' && '⏳ '}
                        {igAutoStatus.tipo === 'ok' && '✓ '}
                        {igAutoStatus.tipo === 'aviso' && '⚠ '}
                        {igAutoStatus.tipo === 'erro' && '✕ '}
                        {igAutoStatus.mensagem}
                      </span>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(igAutoStatus.tipo === 'aviso' || igAutoStatus.tipo === 'erro') && (
                          <button
                            type="button"
                            onClick={() => fotoInputRef.current?.click()}
                            style={{
                              ...btnNeutro,
                              padding: '4px 9px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            Enviar capa manual
                          </button>
                        )}
                        {igAutoStatus.tipo === 'ok' &&
                          Boolean(igAutoStatus.detalheCapa) &&
                          parseInstagramUrl(socialInput) && (
                            <button
                              type="button"
                              disabled={buscandoThumbInsta}
                              onClick={() =>
                                void processarLinkInstagramAutomatico(socialInput, { forcarCapa: true })
                              }
                              style={{
                                ...btnNeutro,
                                padding: '4px 9px',
                                fontSize: '11.5px',
                                opacity: buscandoThumbInsta ? 0.6 : 1,
                              }}
                            >
                              {buscandoThumbInsta ? 'Buscando…' : 'Usar capa do Instagram'}
                            </button>
                          )}
                      </div>
                    </div>

                    {igAutoStatus.detalheCapa && (
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#5c4f55', lineHeight: 1.4 }}>
                        {igAutoStatus.detalheCapa}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Linha 2: Chapéu + Título lado a lado */}
            <div
              className="noticia-fields-chapeu-titulo"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(175px, 1fr) minmax(0, 2.3fr)',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="chapeu">
                    Chapéu / assunto <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: chapeu.length > 35 ? '#861e32' : '#71636a' }}>
                    {chapeu.length}/40
                  </span>
                </div>
                <input
                  id="chapeu"
                  type="text"
                  value={chapeu}
                  maxLength={40}
                  onChange={(e) => { if (e.target.value.length <= 40) { setChapeu(e.target.value); markAlterado() } }}
                  placeholder="Ex.: Campanha salarial…"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="titulo">
                    Título <span style={{ color: '#861e32' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: titulo.length > 90 ? '#861e32' : '#71636a' }}>
                    {titulo.length}/100
                  </span>
                </div>
                <input
                  id="titulo"
                  type="text"
                  value={titulo}
                  maxLength={100}
                  onChange={(e) => { if (e.target.value.length <= 100) { setTitulo(e.target.value); markAlterado() } }}
                  placeholder="Digite o título da notícia…"
                  style={{ ...inputStyle, fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Linha 3: Subtítulo + Resumo lado a lado */}
            <div
              className="noticia-fields-sub-resumo"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="subtitulo">
                    Subtítulo <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: subtitulo.length > 135 ? '#861e32' : '#71636a' }}>
                    {subtitulo.length}/150
                  </span>
                </div>
                <textarea
                  id="subtitulo"
                  value={subtitulo}
                  onChange={(e) => { if (e.target.value.length <= 150) { setSubtitulo(e.target.value); markAlterado() } }}
                  placeholder="Complemento exibido abaixo do título…"
                  rows={2}
                  maxLength={150}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="resumo">
                    Resumo <span style={{ color: '#71636a', fontWeight: 400 }}>(cartões e compartilhamento)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: resumo.length > 285 ? '#861e32' : '#71636a' }}>
                    {resumo.length}/300
                  </span>
                </div>
                <textarea
                  id="resumo"
                  value={resumo}
                  onChange={(e) => { if (e.target.value.length <= 300) { setResumo(e.target.value); markAlterado() } }}
                  placeholder="Breve descrição exibida nos cartões e redes sociais…"
                  rows={2}
                  maxLength={300}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Corpo */}
          <div className="noticia-secao-redacao" style={cardStyle}>
            <label style={{ ...labelStyle, marginBottom: '6px' }}>
              Texto da notícia{' '}
              {origem === 'youtube' || origem === 'instagram' ? (
                <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional — publicação incorporada)</span>
              ) : (
                <span style={{ color: '#861e32' }}>*</span>
              )}
            </label>
            <RichEditor
              content={corpo}
              onChange={(html) => { setCorpo(html); markAlterado() }}
              placeholder="Escreva o conteúdo completo da notícia aqui…"
              onUploadImage={async (file) => {
                const comprimido = await comprimirImagem(file)
                const formData = new FormData()
                formData.append('arquivo', comprimido)
                const result = await uploadMidia(formData)
                if ('error' in result) {
                  showToast(result.error, 'erro')
                  throw new Error(result.error)
                }
                return result.url
              }}
            />
          </div>

          {/* Botão de avanço mobile da Redação para Fotos */}
          <div className="noticia-mobile-nav-step" style={{ display: 'none', margin: '4px 0 12px' }}>
            <button
              type="button"
              onClick={() => { setAbaMobile('fotos'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#861e32',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(134,30,50,0.25)',
              }}
            >
              <span>Próximo: Adicionar Fotos e Mídia</span>
              <span>📸 →</span>
            </button>
          </div>

          {/* ── Fotos (pré-visualização compacta com opção de ampliar) ── */}
          <div className="noticia-secao-fotos" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Fotos <span style={{ color: '#71636a', fontWeight: 400 }}>(até 5 · Ctrl+V também cola imagem)</span>
                </label>
              </div>
              {fotosValidas.length < 5 && (
                <label
                  htmlFor="fotos-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    ...btnNeutro,
                    padding: '6px 11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {fotosValidas.length === 0 ? '+ Escolher fotos' : '+ Adicionar fotos'}
                </label>
              )}
              <input
                ref={fotoInputRef}
                id="fotos-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFotosChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Photo list — layout horizontal compacto preservando proporção original */}
            {fotosValidas.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fotosValidas.map((foto, idx) => (
                  <div
                    key={idx}
                    className="noticia-foto-row"
                    style={{
                      border: '1px solid #e4dce0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      background: '#faf8f9',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Miniatura compacta preservando proporção real (sem recorte destrutivo) */}
                    {foto.enviando ? (
                      <div
                        style={{
                          width: '124px',
                          height: '88px',
                          borderRadius: '5px',
                          background: '#e4dce0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#71636a',
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        Enviando…
                      </div>
                    ) : foto.erro ? (
                      <div
                        style={{
                          width: '124px',
                          height: '88px',
                          borderRadius: '5px',
                          background: '#fce4ea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#861e32',
                          fontSize: '11.5px',
                          padding: '6px',
                          textAlign: 'center',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        {foto.erro}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setImagemAmpliada({
                            url: foto.url || foto.preview,
                            titulo: idx === 0 ? 'Foto principal da notícia' : `Foto ${idx + 1}`,
                            subtitulo: [foto.legenda, foto.credito].filter(Boolean).join(' · ') || undefined,
                          })
                        }
                        aria-label={`Ampliar ${idx === 0 ? 'foto principal' : `foto ${idx + 1}`}`}
                        title="Clique para visualizar em tamanho maior"
                        style={{
                          width: '124px',
                          height: '88px',
                          padding: '3px',
                          borderRadius: '5px',
                          background: '#efebed',
                          border: '1px solid #d9ced3',
                          cursor: 'zoom-in',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={foto.preview}
                          alt={`Miniatura da foto ${idx + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                        {idx === 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: '3px',
                              background: '#861e32',
                              color: '#ffffff',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              letterSpacing: '0.4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Capa
                          </span>
                        )}
                      </button>
                    )}

                    {/* Campos e ações compactos ao lado da miniatura */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: idx === 0 ? '#861e32' : '#30252a' }}>
                          {idx === 0 ? 'Foto principal' : `Foto ${idx + 1}`}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {!foto.enviando && !foto.erro && (
                            <button
                              type="button"
                              onClick={() =>
                                setImagemAmpliada({
                                  url: foto.url || foto.preview,
                                  titulo: idx === 0 ? 'Foto principal da notícia' : `Foto ${idx + 1}`,
                                  subtitulo: [foto.legenda, foto.credito].filter(Boolean).join(' · ') || undefined,
                                })
                              }
                              style={{ ...btnNeutro, padding: '3px 8px', fontSize: '11.5px', color: '#183b4b', fontWeight: 600 }}
                            >
                              Ampliar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => subirFoto(idx)}
                            disabled={idx === 0}
                            title="Subir posição"
                            style={{ ...btnNeutro, padding: '3px 7px', fontSize: '11.5px', opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => descerFoto(idx)}
                            disabled={idx === fotosValidas.length - 1}
                            title="Descer posição"
                            style={{ ...btnNeutro, padding: '3px 7px', fontSize: '11.5px', opacity: idx === fotosValidas.length - 1 ? 0.4 : 1, cursor: idx === fotosValidas.length - 1 ? 'default' : 'pointer' }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removerFoto(idx)}
                            style={{ ...btnNeutro, padding: '3px 8px', fontSize: '11.5px', color: '#861e32', borderColor: '#e8c8ce' }}
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      {!foto.enviando && !foto.erro && (
                        <>
                          {/* Legenda + crédito */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                              type="text"
                              value={foto.legenda}
                              maxLength={150}
                              onChange={(e) => { if (e.target.value.length <= 150) atualizarFoto(idx, { legenda: e.target.value }) }}
                              placeholder="Legenda da foto (opcional)…"
                              aria-label={`Legenda da foto ${idx + 1}`}
                              style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}
                            />
                            <input
                              type="text"
                              value={foto.credito}
                              maxLength={60}
                              onChange={(e) => { if (e.target.value.length <= 60) atualizarFoto(idx, { credito: e.target.value }) }}
                              placeholder="Crédito / fotógrafo (opcional)…"
                              aria-label={`Crédito da foto ${idx + 1}`}
                              style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}
                            />
                          </div>

                          {/* Foco vertical compacto */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <label
                              htmlFor={`foco-foto-${idx}`}
                              style={{ fontSize: '11.5px', color: '#71636a', whiteSpace: 'nowrap' }}
                            >
                              Enquadramento nos cartões ({foto.foco}%):
                            </label>
                            <input
                              id={`foco-foto-${idx}`}
                              type="range"
                              min="0"
                              max="100"
                              value={foto.foco}
                              onChange={(e) => atualizarFoto(idx, { foco: Number(e.target.value) })}
                              style={{ flex: '1 1 110px', accentColor: '#861e32' }}
                            />
                            <button
                              type="button"
                              onClick={() => atualizarFoto(idx, { foco: 50 })}
                              style={{ ...btnNeutro, padding: '2px 7px', fontSize: '11px' }}
                            >
                              50%
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#71636a', margin: 0 }}>
                JPG, PNG, WebP ou GIF · Sem foto selecionada, o site exibirá a imagem institucional padrão.
              </p>
            )}
            {fotosValidas.length >= 5 && (
              <p style={{ fontSize: '11.5px', color: '#71636a', margin: '8px 0 0' }}>
                Limite de 5 fotos atingido.
              </p>
            )}
          </div>

          {/* ── Documentos ── */}
          <div className="noticia-secao-fotos" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: documentos.length > 0 ? '10px' : '0' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Documentos anexos</label>
                <span style={{ fontSize: '11.5px', color: '#71636a' }}>PDF, DOCX ou ZIP (máx. 20 MB)</span>
              </div>
              <label
                htmlFor="doc-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  ...btnNeutro,
                  padding: '6px 11px',
                  fontWeight: 600,
                  cursor: enviandoDoc ? 'not-allowed' : 'pointer',
                  opacity: enviandoDoc ? 0.6 : 1,
                }}
              >
                {enviandoDoc ? 'Enviando…' : '+ Anexar documento'}
              </label>
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,.docx,.zip"
                onChange={handleDocumentoChange}
                disabled={enviandoDoc}
                style={{ display: 'none' }}
              />
            </div>

            {documentos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {documentos.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#faf8f9',
                      border: '1px solid #e4dce0',
                      borderRadius: '5px',
                      padding: '7px 10px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{doc.tipo === 'pdf' ? '📄' : doc.tipo === 'docx' ? '📝' : '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#30252a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.nome}
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#861e32', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Ver ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => removerDocumento(idx)}
                      style={{ ...btnNeutro, padding: '3px 8px', fontSize: '11.5px', color: '#861e32', borderColor: '#e8c8ce' }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão de avanço mobile de Fotos para Publicação */}
          <div className="noticia-mobile-nav-step" style={{ display: 'none', margin: '4px 0 12px' }}>
            <button
              type="button"
              onClick={() => { setAbaMobile('publicacao'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#861e32',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(134,30,50,0.25)',
              }}
            >
              <span>Próximo: Revisar e Publicar</span>
              <span>🚀 →</span>
            </button>
          </div>

          {/* ── Tags ── */}
          <div className="noticia-secao-publicacao" style={cardStyle}>
            <label style={labelStyle}>
              Tags{' '}
              <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional, tecle Enter ou vírgula para adicionar)</span>
            </label>
            <div
              style={{
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                padding: '8px 10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center',
                background: 'white',
                minHeight: '44px',
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: '#f0e8ea',
                    color: '#65172a',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {tag}
                  <button
                    onClick={() => removerTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#65172a',
                      cursor: 'pointer',
                      padding: '0 0 0 2px',
                      fontSize: '14px',
                      lineHeight: 1,
                      fontFamily: 'inherit',
                    }}
                    title={`Remover tag "${tag}"`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                maxLength={30}
                disabled={tags.length >= 8}
                onChange={handleTagChange}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length >= 8 ? 'Limite de 8 tags atingido' : tags.length === 0 ? 'Adicionar tag…' : ''}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#30252a',
                  flex: '1 1 100px',
                  minWidth: '100px',
                  background: 'transparent',
                }}
              />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#71636a' }}>
              Até 8 tags, com no máximo 30 caracteres cada. {tags.length}/8 adicionadas.
            </p>
          </div>

          {/* ── Mais opções editoriais ── */}
          <div className="noticia-secao-publicacao" style={cardStyle}>
            <button
              onClick={() => setShowMaisOpcoes((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: 600,
                color: '#30252a',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {showMaisOpcoes ? 'Mais opções editoriais ▾' : 'Mais opções editoriais ▸'}
            </button>

            {showMaisOpcoes && (
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="noticia-fields-sub-resumo">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="url-referencia">
                      URL de referência
                    </label>
                    <span style={{ fontSize: '11px', color: urlReferencia.length > 230 ? '#861e32' : '#71636a' }}>
                      {urlReferencia.length}/250
                    </span>
                  </div>
                  <input
                    id="url-referencia"
                    type="url"
                    value={urlReferencia}
                    maxLength={250}
                    onChange={(e) => {
                      if (e.target.value.length <= 250) {
                        handleMudarSocialUrl(e.target.value)
                      }
                    }}
                    placeholder="https://…"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="credito">
                      Crédito / fonte
                    </label>
                    <span style={{ fontSize: '11px', color: credito.length > 50 ? '#861e32' : '#71636a' }}>
                      {credito.length}/60
                    </span>
                  </div>
                  <input
                    id="credito"
                    type="text"
                    value={credito}
                    maxLength={60}
                    onChange={(e) => { if (e.target.value.length <= 60) { setCredito(e.target.value); markAlterado() } }}
                    placeholder="Nome do veículo ou autor"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Endereço e prévia do link ── */}
          <div className="noticia-secao-publicacao" style={cardStyle}>
            <button
              type="button"
              onClick={() => setShowPrevia((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#30252a',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {showPrevia ? 'Endereço e prévia do link ▾' : 'Endereço e prévia do link ▸'}
            </button>

            {showPrevia && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Slug */}
                <div>
                  <label style={labelStyle}>Slug (endereço gerado a partir do título)</label>
                  <input
                    type="text"
                    value={slug}
                    readOnly
                    style={{ ...inputStyle, background: '#f7f5f6', color: '#71636a', cursor: 'default' }}
                  />
                </div>

                {/* Prévia compacta de compartilhamento */}
                <div
                  style={{
                    background: '#f5f8fb',
                    border: '1px solid #cbd7de',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  {fotos[0]?.url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setImagemAmpliada({
                          url: fotos[0].url,
                          titulo: titulo || 'Prévia de compartilhamento',
                        })
                      }
                      aria-label="Ampliar imagem da prévia"
                      style={{
                        width: '108px',
                        height: '74px',
                        padding: '2px',
                        borderRadius: '4px',
                        background: '#e7edf2',
                        border: '1px solid #cbd7de',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: 'zoom-in',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotos[0].url}
                        alt="Prévia"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </button>
                  ) : (
                    <div
                      style={{
                        width: '108px',
                        height: '74px',
                        borderRadius: '4px',
                        background: '#dde5ed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#71636a',
                        fontSize: '11px',
                        textAlign: 'center',
                        padding: '6px',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      Imagem padrão
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#30252a', marginBottom: '3px' }}>
                      {titulo || '(sem título)'}
                    </div>
                    {resumoPrevia && (
                      <div style={{ fontSize: '12px', color: '#71636a', marginBottom: '4px', lineHeight: 1.35 }}>
                        {resumoPrevia}
                      </div>
                    )}
                    <div style={{ fontSize: '11.5px', color: '#71636a', wordBreak: 'break-all' }}>
                      {status === 'publicado' && slug ? (
                        <a
                          href={`/noticias/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#861e32', fontWeight: 600, textDecoration: 'underline' }}
                        >
                          quimicosjc.org.br/noticias/{slug} ↗
                        </a>
                      ) : (
                        `quimicosjc.org.br/noticias/${slug || '…'}`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar unificada e compacta ── */}
        <div
          className="noticia-sidebar-column noticia-secao-publicacao"
          style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Situação */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f0eaed' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: '#71636a', textTransform: 'uppercase', letterSpacing: '0.7px', fontSize: '11px' }}>
                Situação
              </span>
              <StatusBadge status={status} />
            </div>
            {status === 'programado' && publicadoEm && (
              <p style={{ fontSize: '11.5px', color: '#365786', margin: '6px 0 0' }}>
                Programada para {new Date(publicadoEm).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* Destaque */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f0eaed' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#30252a' }}>
              <input
                type="checkbox"
                checked={destaque}
                onChange={(e) => {
                  setDestaque(e.target.checked)
                  markAlterado()
                  if (e.target.checked) {
                    showToast('Ao salvar, esta notícia ficará fixada em destaque na homepage.')
                  }
                }}
                style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#861e32', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Destacar na homepage</div>
                <div style={{ fontSize: '11.5px', color: '#71636a', marginTop: '2px', lineHeight: 1.4 }}>
                  Novas publicações assumem automaticamente o 1º destaque. Marque para fixar manualmente.
                </div>
              </div>
            </label>
          </div>

          {/* Data e hora da notícia */}
          <div style={status !== 'publicado' ? { paddingBottom: '12px', borderBottom: '1px solid #f0eaed' } : undefined}>
            <label style={labelStyle} htmlFor="publicado-em">Data e hora da notícia</label>
            <input
              id="publicado-em"
              type="datetime-local"
              value={publicadoEm}
              onChange={(e) => { setPublicadoEm(e.target.value); markAlterado() }}
              style={inputStyle}
            />
            {publicadoEm && (
              <p style={{ fontSize: '11.5px', color: '#71636a', margin: '5px 0 2px' }}>
                {formatDatetimeLocal(publicadoEm)}
              </p>
            )}
            <p style={{ fontSize: '11.5px', color: '#71636a', margin: 0 }}>
              Define a ordem cronológica no site.
            </p>
          </div>

          {/* Programar */}
          {status !== 'publicado' && (
            <div>
              <div style={{ fontWeight: 700, color: '#71636a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.7px', fontSize: '11px' }}>
                Programação
              </div>
              {status === 'programado' ? (
                <button
                  type="button"
                  onClick={cancelarProgramacao}
                  disabled={isPending}
                  style={{ ...btnNeutro, width: '100%', textAlign: 'center', color: '#861e32', borderColor: '#e8c8ce' }}
                >
                  Cancelar programação
                </button>
              ) : (
                <button
                  type="button"
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

      {/* ── Savebar compacta ── */}
      <div
        className="noticia-savebar"
        style={{
          position: 'sticky',
          bottom: '12px',
          marginTop: '16px',
          background: 'white',
          border: '1px solid #e4dce0',
          borderRadius: '6px',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <a
            href="/admin/noticias"
            style={{ fontSize: '14px', color: '#71636a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            ← Notícias
          </a>
          <span style={{ fontSize: '13px', color: '#71636a' }}>{savebarStatus}</span>
          {status === 'publicado' && <StatusBadge status="publicado" />}
        </div>

        {status === 'publicado' ? (
          /* Savebar: notícia publicada */
          <div className="noticia-savebar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              Mover para lixeira
            </button>
            <button
              onClick={() => setShowConfirmRetirar(true)}
              disabled={isPending}
              style={{ ...btnNeutro, color: '#861e32', borderColor: '#e8c8ce', opacity: isPending ? 0.6 : 1 }}
            >
              Retirar do ar
            </button>
            {slug && (
              <a
                href={`/noticias/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...btnNeutro,
                  color: '#65172a',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                Ver no site ↗
              </a>
            )}
            <button
              onClick={atualizarPublicacao}
              disabled={isPending}
              style={{ ...btnPrimario, opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Salvando…' : 'Atualizar publicação'}
            </button>
          </div>
        ) : (
          /* Savebar: rascunho / programado */
          <div className="noticia-savebar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            <button
              onClick={() => setShowAgendarDialog(true)}
              disabled={isPending}
              style={{ ...btnNeutro, opacity: isPending ? 0.6 : 1 }}
            >
              Programar
            </button>
            <button
              onClick={handlePublicar}
              disabled={isPending}
              style={{ ...btnPrimario, opacity: isPending ? 0.6 : 1 }}
            >
              Publicar agora
            </button>
          </div>
        )}
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

      {/* ── Dialog: confirm retirar do ar ── */}
      {showConfirmRetirar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowConfirmRetirar(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '8px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#30252a' }}>Retirar do ar?</h2>
            <p style={{ margin: '0 0 24px', color: '#71636a', fontSize: '14px', lineHeight: '1.6' }}>
              A notícia será movida de volta para <strong>Rascunho</strong> e deixará de ser visível no site.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmRetirar(false)} style={btnNeutro}>Cancelar</button>
              <button onClick={confirmarRetirarDoAr} style={{ ...btnNeutro, color: '#861e32', borderColor: '#e8c8ce' }}>
                Retirar do ar
              </button>
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

      {/* ── Lightbox de visualização ampliada ── */}
      <ImagemLightboxModal
        imagem={imagemAmpliada}
        onClose={() => setImagemAmpliada(null)}
      />

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
            textOverflow: 'ellipsis',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── ESTILOS RESPONSIVOS MOBILE DO EDITOR ── */}
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 960px) {
          .noticia-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 768px) {
          .noticia-fields-chapeu-titulo,
          .noticia-fields-sub-resumo {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .noticia-mobile-tabs {
            display: flex !important;
          }
          .noticia-mobile-nav-step {
            display: block !important;
          }
          ${abaMobile !== 'redacao' ? '.noticia-secao-redacao { display: none !important; }' : ''}
          ${abaMobile !== 'fotos' ? '.noticia-secao-fotos { display: none !important; }' : ''}
          ${abaMobile !== 'publicacao' ? '.noticia-secao-publicacao { display: none !important; }' : ''}
          .noticia-savebar {
            bottom: 68px !important;
            padding: 14px 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
          }
          .noticia-savebar-actions {
            display: flex !important;
            flex-wrap: wrap !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .noticia-savebar-actions button,
          .noticia-savebar-actions a {
            flex: 1 1 45% !important;
            text-align: center !important;
            justify-content: center !important;
            padding: 12px 14px !important;
            font-size: 13.5px !important;
            min-height: 44px !important;
          }
          input[type="text"],
          input[type="url"],
          input[type="datetime-local"],
          textarea,
          select {
            font-size: 16px !important;
          }
        }
        @media (max-width: 540px) {
          .noticia-foto-row {
            flex-direction: column !important;
          }
        }
        @media (min-width: 769px) {
          .noticia-mobile-tabs {
            display: none !important;
          }
          .noticia-mobile-nav-step {
            display: none !important;
          }
          .noticia-secao-redacao,
          .noticia-secao-fotos,
          .noticia-secao-publicacao {
            display: block !important;
          }
          .noticia-sidebar-column {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
