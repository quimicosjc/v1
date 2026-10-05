'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { PaginaAvulsa, PaginaAvulsaFormData } from '@/app/admin/avulsas/actions'
import {
  criarPaginaAvulsa,
  atualizarPaginaAvulsa,
  publicarPaginaAvulsa,
  retirarDoAr,
  moverParaLixeira,
  uploadMidia,
  uploadDocumento,
} from '@/app/admin/avulsas/actions'

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

interface FotoItem {
  url: string
  foco: number
  legenda?: string
  credito?: string
}

interface DocumentoItem {
  url: string
  nome: string
  tipo: string
}

interface PaginaAvulsaEditorProps {
  pagina: PaginaAvulsa | null
}

type ToastType = 'sucesso' | 'erro'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    publicado:  { label: 'Publicada',   bg: '#e9f3ef', color: '#23634e' },
    rascunho:   { label: 'Rascunho',    bg: '#fff2df', color: '#825914' },
    programado: { label: 'Programada',  bg: '#eaf1fc', color: '#365786' },
    lixeira:    { label: 'Na lixeira',  bg: '#fce4ea', color: '#861e32' },
  }
  const s = map[status] ?? { label: status, bg: '#f0f0f0', color: '#555' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: '4px',
        padding: '3px 9px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}

// ── Estilos Inline ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e4dce0',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '20px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#30252a',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #cbd7de',
  borderRadius: '5px',
  padding: '11px 12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: '#30252a',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
}

const btnPrimario: React.CSSProperties = {
  background: '#861e32',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnNeutro: React.CSSProperties = {
  border: '1px solid #ced9df',
  background: 'white',
  color: '#30252a',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnPerigo: React.CSSProperties = {
  border: '1px solid #e4dce0',
  background: 'white',
  color: '#861e32',
  borderRadius: '5px',
  padding: '10px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export default function PaginaAvulsaEditor({ pagina }: PaginaAvulsaEditorProps) {
  const router = useRouter()
  const isNovo = !pagina

  // Estados principais
  const [paginaId, setPaginaId] = useState<string | null>(pagina?.id ?? null)
  const [status, setStatus] = useState<string>(pagina?.status ?? 'rascunho')
  const [chapeu, setChapeu] = useState(pagina?.chapeu ?? '')
  const [titulo, setTitulo] = useState(pagina?.titulo ?? '')
  const [subtitulo, setSubtitulo] = useState(pagina?.subtitulo ?? '')
  const [corpo, setCorpo] = useState(pagina?.corpo ?? '')
  const [slug, setSlug] = useState(pagina?.slug ?? '')
  const [noindex, setNoindex] = useState(pagina?.noindex ?? false)
  const [dataProgramada, setDataProgramada] = useState(pagina?.publicado_em ?? '')

  // Fotos
  const [fotos, setFotos] = useState<FotoItem[]>(() => {
    if (!pagina?.fotos_json) {
      if (pagina?.banner_url) {
        return [{ url: pagina.banner_url, foco: pagina.imagem_y ?? 50 }]
      }
      return []
    }
    try {
      return JSON.parse(pagina.fotos_json)
    } catch {
      return []
    }
  })

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoItem[]>(() => {
    if (!pagina?.documentos_json) return []
    try {
      return JSON.parse(pagina.documentos_json)
    } catch {
      return []
    }
  })

  // Tags
  const [tags, setTags] = useState<string[]>(() => {
    if (!pagina?.tags_json) return []
    try {
      return JSON.parse(pagina.tags_json)
    } catch {
      return []
    }
  })
  const [tagInput, setTagInput] = useState('')

  // Seções recolhíveis
  const [openMaisOpcoes, setOpenMaisOpcoes] = useState(false)
  const [openPrevia, setOpenPrevia] = useState(false)

  // Controle de alterações e salvamento
  const [alterado, setAlterado] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>('Pronto para editar')
  const [isPending, startTransition] = useTransition()
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Dialogs
  const [toast, setToast] = useState<{ msg: string; tipo: ToastType } | null>(null)
  const [dialogPublicar, setDialogPublicar] = useState(false)
  const [dialogRetirar, setDialogRetirar] = useState(false)
  const [dialogLixeira, setDialogLixeira] = useState(false)
  const [dialogPosPublicacao, setDialogPosPublicacao] = useState(false)
  const [dialogProgramar, setDialogProgramar] = useState(false)
  const [hasLocalDraft, setHasLocalDraft] = useState(false)

  const isSavingRef = useRef(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, tipo: ToastType = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  function markAlterado() {
    setAlterado(true)
    setSaveStatus('Alterações não salvas')
  }

  // ── Sincronização e Recuperação Local (localStorage) ─────────────────────────
  const storageKey = `quimicos-rascunho-avulsa-${paginaId || 'nova'}`

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(storageKey)
      if (salvo) {
        const parsed = JSON.parse(salvo)
        if (parsed.titulo && parsed.titulo !== titulo) {
          setHasLocalDraft(true)
        }
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!alterado) return
    const interval = setInterval(() => {
      try {
        const rascunho = {
          chapeu,
          titulo,
          subtitulo,
          corpo,
          slug,
          noindex,
          fotos,
          documentos,
          tags,
          salvoEm: new Date().toISOString(),
        }
        localStorage.setItem(storageKey, JSON.stringify(rascunho))
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [alterado, chapeu, titulo, subtitulo, corpo, slug, noindex, fotos, documentos, tags, storageKey])

  function recuperarRascunhoLocal() {
    try {
      const salvo = localStorage.getItem(storageKey)
      if (!salvo) return
      const parsed = JSON.parse(salvo)
      if (parsed.chapeu !== undefined) setChapeu(parsed.chapeu)
      if (parsed.titulo) setTitulo(parsed.titulo)
      if (parsed.subtitulo !== undefined) setSubtitulo(parsed.subtitulo)
      if (parsed.corpo !== undefined) setCorpo(parsed.corpo)
      if (parsed.slug) setSlug(parsed.slug)
      if (parsed.noindex !== undefined) setNoindex(parsed.noindex)
      if (parsed.fotos) setFotos(parsed.fotos)
      if (parsed.documentos) setDocumentos(parsed.documentos)
      if (parsed.tags) setTags(parsed.tags)
      setHasLocalDraft(false)
      markAlterado()
      showToast('Rascunho local restaurado!')
    } catch {
      showToast('Não foi possível restaurar o rascunho.', 'erro')
    }
  }

  // ── Salvamento no Servidor ───────────────────────────────────────────────────
  const salvarDados = useCallback(
    async (novoStatus?: 'rascunho' | 'publicado' | 'programado') => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      setSaveStatus('Salvando…')

      const banner_url = fotos[0]?.url ?? null
      const imagem_y = fotos[0]?.foco ?? 50
      const statusFinal = novoStatus ?? (status as any)

      const payload: PaginaAvulsaFormData = {
        titulo: titulo.trim() || 'Página sem título',
        subtitulo: subtitulo.trim() || null,
        chapeu: chapeu.trim() || null,
        corpo: corpo || null,
        slug: slug.trim() || undefined,
        status: statusFinal,
        banner_url,
        imagem_y,
        fotos_json: fotos.length > 0 ? JSON.stringify(fotos) : null,
        documentos_json: documentos.length > 0 ? JSON.stringify(documentos) : null,
        tags_json: tags.length > 0 ? JSON.stringify(tags) : null,
        noindex,
        publicado_em: dataProgramada || null,
      }

      try {
        if (!paginaId) {
          const res = await criarPaginaAvulsa(payload)
          if ('error' in res) {
            setSaveStatus('Erro ao salvar')
            showToast(res.error, 'erro')
          } else {
            setPaginaId(res.id)
            setAlterado(false)
            setStatus(statusFinal)
            setSaveStatus(`Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
            router.replace(`/admin/avulsas/${res.id}`)
          }
        } else {
          const res = await atualizarPaginaAvulsa(paginaId, payload)
          if ('error' in res) {
            setSaveStatus('Erro ao salvar')
            showToast(res.error, 'erro')
          } else {
            setAlterado(false)
            if (novoStatus) setStatus(novoStatus)
            setSaveStatus(`Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
          }
        }
      } catch (err) {
        setSaveStatus('Erro de conexão')
        showToast('Falha ao comunicar com o servidor.', 'erro')
      } finally {
        isSavingRef.current = false
      }
    },
    [paginaId, status, chapeu, titulo, subtitulo, corpo, slug, fotos, documentos, tags, noindex, dataProgramada, router]
  )

  // Autosave a cada 30s
  useEffect(() => {
    if (!alterado || !paginaId) return
    const interval = setInterval(() => {
      salvarDados()
    }, 30000)
    return () => clearInterval(interval)
  }, [alterado, paginaId, salvarDados])

  // ── Upload de Fotos ─────────────────────────────────────────────────────────
  async function handleAddFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    if (fotos.length + files.length > 5) {
      showToast('O limite é de até 5 fotos por página.', 'erro')
      return
    }

    setUploadingFoto(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const comprimido = await comprimirImagem(file)
        const formData = new FormData()
        formData.append('arquivo', comprimido)
        const res = await uploadMidia(formData)
        if ('error' in res) {
          showToast(res.error, 'erro')
        } else {
          setFotos((prev) => [...prev, { url: res.url, foco: 50 }])
          markAlterado()
        }
      } catch (err) {
        showToast('Erro ao processar imagem.', 'erro')
      }
    }
    setUploadingFoto(false)
    e.target.value = ''
  }

  function moverFoto(index: number, direcao: 'up' | 'down') {
    const target = direcao === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= fotos.length) return
    const nova = [...fotos]
    const temp = nova[index]
    nova[index] = nova[target]
    nova[target] = temp
    setFotos(nova)
    markAlterado()
  }

  function removerFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index))
    markAlterado()
  }

  // ── Upload de Documentos ────────────────────────────────────────────────────
  async function handleAddDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(true)
    const formData = new FormData()
    formData.append('arquivo', file)
    const res = await uploadDocumento(formData)
    setUploadingDoc(false)
    e.target.value = ''

    if ('error' in res) {
      showToast(res.error, 'erro')
    } else {
      setDocumentos((prev) => [...prev, { url: res.url, nome: res.nome, tipo: res.tipo }])
      markAlterado()
      showToast(`Documento "${res.nome}" anexado.`)
    }
  }

  function removerDoc(index: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== index))
    markAlterado()
  }

  // ── Ações de Publicação ─────────────────────────────────────────────────────
  async function handlePublicarAgora() {
    if (!titulo.trim()) {
      showToast('Informe o título da página para publicar.', 'erro')
      return
    }
    if (!stripHtml(corpo)) {
      showToast('Escreva o texto da página antes de publicar.', 'erro')
      return
    }

    setDialogPublicar(false)
    startTransition(async () => {
      await salvarDados('publicado')
      if (paginaId) {
        await publicarPaginaAvulsa(paginaId)
      }
      setStatus('publicado')
      setDialogPosPublicacao(true)
    })
  }

  async function handleRetirarDoAr() {
    if (!paginaId) return
    setDialogRetirar(false)
    startTransition(async () => {
      const res = await retirarDoAr(paginaId)
      if ('error' in res) {
        showToast(res.error, 'erro')
      } else {
        setStatus('rascunho')
        showToast('Página retirada do ar. A versão pública agora é um rascunho.')
      }
    })
  }

  async function handleMoverLixeira() {
    if (!paginaId) return
    setDialogLixeira(false)
    startTransition(async () => {
      const res = await moverParaLixeira(paginaId)
      if ('error' in res) {
        showToast(res.error, 'erro')
      } else {
        showToast('Página movida para a lixeira.')
        router.push('/admin/avulsas')
      }
    })
  }

  async function handleConfirmarProgramacao() {
    if (!dataProgramada) {
      showToast('Escolha uma data e hora futuras para a publicação.', 'erro')
      return
    }
    setDialogProgramar(false)
    await salvarDados('programado')
    showToast(`Página programada para ${formatDatetimeLocal(dataProgramada)}.`)
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.tipo === 'erro' ? '#861e32' : '#183b4b',
            color: 'white',
            padding: '13px 23px',
            borderRadius: '6px',
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 2000,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Barra de recuperação de rascunho local */}
      {hasLocalDraft && (
        <div
          style={{
            background: '#fff2df',
            border: '1px solid #ebd3b0',
            borderRadius: '6px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#825914',
          }}
        >
          <span>Há uma versão salva localmente no seu navegador mais recente que a do servidor.</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={recuperarRascunhoLocal}
              style={{ ...btnNeutro, padding: '6px 12px', fontSize: '12px', borderColor: '#d4a373' }}
            >
              Recuperar versão local
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(storageKey)
                setHasLocalDraft(false)
              }}
              style={{ background: 'none', border: 'none', color: '#825914', cursor: 'pointer', fontSize: '12px' }}
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#861e32',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          PÁGINAS AVULSAS
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 700, color: '#30252a' }}>
          {titulo.trim() || 'Nova página avulsa'}
        </h1>
        <p style={{ margin: 0, color: '#71636a', fontSize: '14px' }}>
          {status === 'publicado'
            ? 'Página publicada no site. Alterações em rascunho só entram no ar ao clicar em "Atualizar publicação".'
            : 'Preencha o conteúdo. A publicação exige apenas título e texto.'}
        </p>
      </div>

      {/* Grid Principal: 2 Colunas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          alignItems: 'start',
          marginBottom: '100px',
        }}
      >
        {/* Coluna Principal */}
        <div>
          {/* Card: Chapéu */}
          <div style={cardStyle}>
            <label style={labelStyle}>
              Chapéu / assunto <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex.: Campanha Salarial, Comunicado, Edital…"
              value={chapeu}
              onChange={(e) => {
                setChapeu(e.target.value)
                markAlterado()
              }}
              style={inputStyle}
            />
          </div>

          {/* Card: Título */}
          <div style={cardStyle}>
            <label style={labelStyle}>
              Título da página <span style={{ color: '#861e32' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Título principal da página avulsa…"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value)
                markAlterado()
              }}
              style={{ ...inputStyle, fontSize: '16px', fontWeight: 600 }}
            />
          </div>

          {/* Card: Subtítulo */}
          <div style={cardStyle}>
            <label style={labelStyle}>
              Subtítulo <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Complemento do título exibido abaixo do cabeçalho…"
              value={subtitulo}
              onChange={(e) => {
                setSubtitulo(e.target.value)
                markAlterado()
              }}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Card: Texto da Página (RichEditor) */}
          <div style={cardStyle}>
            <label style={labelStyle}>
              Texto da página <span style={{ color: '#861e32' }}>*</span>
            </label>
            <RichEditor
              content={corpo}
              onChange={(html) => {
                setCorpo(html)
                markAlterado()
              }}
              placeholder="Escreva o conteúdo completo da página aqui…"
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

          {/* Card: Fotos (até 5) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <label style={{ ...labelStyle, margin: 0 }}>
                  Fotos da página <span style={{ color: '#71636a', fontWeight: 400 }}>(até 5 fotos opcionais)</span>
                </label>
                <small style={{ color: '#71636a', fontSize: '12px' }}>
                  A primeira foto é a capa principal. Use o controle vertical para ajustar o enquadramento 3:2.
                </small>
              </div>
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={fotos.length >= 5 || uploadingFoto}
                style={{
                  ...btnNeutro,
                  padding: '7px 12px',
                  fontSize: '12px',
                  opacity: fotos.length >= 5 ? 0.5 : 1,
                  cursor: fotos.length >= 5 ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadingFoto ? 'Enviando…' : '＋ Adicionar fotos'}
              </button>
            </div>

            <input
              ref={fotoInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAddFotos}
            />

            {fotos.length === 0 ? (
              <div
                style={{
                  border: '2px dashed #cbd7de',
                  borderRadius: '6px',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#71636a',
                  fontSize: '13px',
                  background: '#fafbfc',
                }}
              >
                Nenhuma foto adicionada. Fotos são opcionais em páginas avulsas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {fotos.map((f, i) => (
                  <div
                    key={f.url}
                    style={{
                      border: '1px solid #e4dce0',
                      borderRadius: '6px',
                      padding: '14px',
                      background: '#fafbfc',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Preview 3:2 com recorte dinâmico */}
                    <div
                      style={{
                        width: '160px',
                        height: '107px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#e4dce0',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={f.url}
                        alt={`Foto ${i + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${f.foco}%`,
                        }}
                      />
                      {i === 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            background: '#861e32',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                          }}
                        >
                          Capa
                        </span>
                      )}
                    </div>

                    {/* Controles de Foco e Ordem */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#30252a' }}>
                          Foto {i + 1} {i === 0 && '· Foto Principal'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => moverFoto(i, 'up')}
                            disabled={i === 0}
                            style={{ ...btnNeutro, padding: '4px 8px', fontSize: '11px', opacity: i === 0 ? 0.4 : 1 }}
                            title="Subir posição"
                          >
                            ↑ Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => moverFoto(i, 'down')}
                            disabled={i === fotos.length - 1}
                            style={{ ...btnNeutro, padding: '4px 8px', fontSize: '11px', opacity: i === fotos.length - 1 ? 0.4 : 1 }}
                            title="Descer posição"
                          >
                            ↓ Descer
                          </button>
                          <button
                            type="button"
                            onClick={() => removerFoto(i)}
                            style={{ ...btnPerigo, padding: '4px 8px', fontSize: '11px' }}
                            title="Remover foto da página"
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      {/* Slider de Posição Vertical */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#71636a', whiteSpace: 'nowrap' }}>
                          Foco vertical:
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={f.foco}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            setFotos((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, foco: val } : item))
                            )
                            markAlterado()
                          }}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFotos((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, foco: 50 } : item))
                            )
                            markAlterado()
                          }}
                          style={{ ...btnNeutro, padding: '2px 8px', fontSize: '11px' }}
                        >
                          Centralizar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Documentos Anexos */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <label style={{ ...labelStyle, margin: 0 }}>
                  Documentos anexos <span style={{ color: '#71636a', fontWeight: 400 }}>(PDF ou DOCX opcionais)</span>
                </label>
                <small style={{ color: '#71636a', fontSize: '12px' }}>
                  Documentos vinculados à página avulsa (editais, tabelas, termos).
                </small>
              </div>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDoc}
                style={{ ...btnNeutro, padding: '7px 12px', fontSize: '12px' }}
              >
                {uploadingDoc ? 'Enviando…' : '＋ Adicionar documento'}
              </button>
            </div>

            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={handleAddDoc}
            />

            {documentos.length === 0 ? (
              <div
                style={{
                  border: '2px dashed #cbd7de',
                  borderRadius: '6px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#71636a',
                  fontSize: '13px',
                  background: '#fafbfc',
                }}
              >
                Nenhum documento anexado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documentos.map((doc, idx) => (
                  <div
                    key={doc.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #e4dce0',
                      borderRadius: '5px',
                      padding: '10px 14px',
                      background: '#fafbfc',
                      fontSize: '13px',
                    }}
                  >
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#861e32', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      📄 {doc.nome} <small style={{ color: '#71636a', fontWeight: 400 }}>({doc.tipo.toUpperCase()})</small> ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => removerDoc(idx)}
                      style={{ ...btnPerigo, padding: '4px 8px', fontSize: '11px' }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Recolhível: Mais Opções */}
          <div style={cardStyle}>
            <div
              onClick={() => setOpenMaisOpcoes((v) => !v)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#30252a' }}>
                {openMaisOpcoes ? '▾' : '▸'} Mais opções editoriais (endereço, indexação e tags)
              </div>
              <span style={{ fontSize: '12px', color: '#71636a' }}>
                {openMaisOpcoes ? 'Recolher' : 'Expandir'}
              </span>
            </div>

            {openMaisOpcoes && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Endereço / Slug */}
                <div>
                  <label style={labelStyle}>
                    Endereço amigável (slug)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#71636a', fontFamily: 'monospace' }}>
                      quimicosjc.org.br/paginas/
                    </span>
                    <input
                      type="text"
                      placeholder="gerado-automaticamente"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value)
                        markAlterado()
                      }}
                      style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }}
                    />
                  </div>
                  <small style={{ color: '#71636a', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Defina um endereço único com letras minúsculas, números e hífens.
                  </small>
                </div>

                {/* Indexação nos Buscadores (noindex) */}
                <div style={{ background: '#f8fafb', border: '1px solid #e4dce0', borderRadius: '6px', padding: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!noindex}
                      onChange={(e) => {
                        setNoindex(!e.target.checked)
                        markAlterado()
                      }}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#30252a' }}>
                        Permitir indexação por buscadores (Google, Bing, etc.)
                      </div>
                      <small style={{ color: '#71636a', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                        Desmarque apenas quando houver razão editorial para não expor a página nas buscas públicas (aplica meta tag <code>noindex</code>).
                      </small>
                    </div>
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label style={labelStyle}>
                    Tags <span style={{ color: '#71636a', fontWeight: 400 }}>(tecle Enter ou vírgula para adicionar)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Ex.: acordo, edital, campanha…"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const t = tagInput.trim().toLowerCase().replace(/^#/, '')
                          if (t && !tags.includes(t)) {
                            setTags((prev) => [...prev, t])
                            markAlterado()
                          }
                          setTagInput('')
                        }
                      }}
                      style={{ ...inputStyle, width: '280px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const t = tagInput.trim().toLowerCase().replace(/^#/, '')
                        if (t && !tags.includes(t)) {
                          setTags((prev) => [...prev, t])
                          markAlterado()
                        }
                        setTagInput('')
                      }}
                      style={{ ...btnNeutro, padding: '8px 12px', fontSize: '12px' }}
                    >
                      Adicionar
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            background: '#f0e8ea',
                            color: '#65172a',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => {
                              setTags((prev) => prev.filter((item) => item !== t))
                              markAlterado()
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#65172a',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 700,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card Recolhível: Prévia de Compartilhamento */}
          <div style={cardStyle}>
            <div
              onClick={() => setOpenPrevia((v) => !v)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#30252a' }}>
                {openPrevia ? '▾' : '▸'} Prévia do link (WhatsApp e redes sociais)
              </div>
              <span style={{ fontSize: '12px', color: '#71636a' }}>
                {openPrevia ? 'Recolher' : 'Expandir'}
              </span>
            </div>

            {openPrevia && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#71636a' }}>
                  Aparência gerada automaticamente ao compartilhar o link da página:
                </p>

                <div
                  style={{
                    border: '1px solid #dce4e8',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    maxWidth: '440px',
                    background: '#f8fafb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {fotos[0]?.url ? (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                      <img
                        src={fotos[0].url}
                        alt="Prévia de capa"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `50% ${fotos[0].foco}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '120px',
                        background: '#65172a',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Sindicato dos Químicos de SJC e Região
                    </div>
                  )}

                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#71636a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      quimicosjc.org.br/paginas/{slug || 'nome-da-pagina'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#30252a', marginBottom: '4px', lineHeight: '1.3' }}>
                      {titulo.trim() || 'Título da página avulsa'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#71636a', lineHeight: '1.4' }}>
                      {subtitulo.trim() || stripHtml(corpo).slice(0, 110) || 'Conteúdo da página…'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral (Sidebar) */}
        <div>
          {/* Card: Situação Atual */}
          <div style={cardStyle}>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>Situação editorial</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <StatusBadge status={status} />
              <span style={{ fontSize: '12px', color: '#71636a' }}>
                {status === 'publicado'
                  ? 'No ar'
                  : status === 'programado'
                  ? 'Agendada'
                  : 'Rascunho interno'}
              </span>
            </div>

            {pagina?.atualizado_em && (
              <div style={{ fontSize: '12px', color: '#71636a', borderTop: '1px solid #f0eeef', paddingTop: '10px' }}>
                Última alteração: <strong>{new Date(pagina.atualizado_em).toLocaleString('pt-BR')}</strong>
              </div>
            )}
          </div>

          {/* Card: Endereço Público */}
          <div style={cardStyle}>
            <label style={labelStyle}>Endereço público</label>
            <div
              style={{
                background: '#f8fafb',
                border: '1px solid #e4dce0',
                borderRadius: '5px',
                padding: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#65172a',
                wordBreak: 'break-all',
              }}
            >
              /paginas/{slug || '...'}
            </div>
            {status === 'publicado' && slug && (
              <a
                href={`/paginas/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#861e32',
                  marginTop: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Abrir página no site ↗
              </a>
            )}
          </div>

          {/* Card: Programar Publicação */}
          {status !== 'publicado' && (
            <div style={cardStyle}>
              <label style={labelStyle}>Programar publicação</label>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#71636a' }}>
                Defina data e hora para publicação automática da página.
              </p>
              <input
                type="datetime-local"
                value={dataProgramada}
                onChange={(e) => {
                  setDataProgramada(e.target.value)
                  markAlterado()
                }}
                style={{ ...inputStyle, fontSize: '12px', padding: '8px' }}
              />
              <button
                type="button"
                onClick={handleConfirmarProgramacao}
                disabled={!dataProgramada}
                style={{
                  ...btnNeutro,
                  width: '100%',
                  marginTop: '10px',
                  fontSize: '12px',
                  opacity: !dataProgramada ? 0.5 : 1,
                }}
              >
                Salvar agendamento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Savebar Fixa na Base */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '252px',
          right: 0,
          background: 'white',
          borderTop: '1px solid #e4dce0',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/admin/avulsas"
            style={{
              color: '#71636a',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Páginas avulsas
          </a>
          <span style={{ color: '#c8b4bc' }}>|</span>
          <span style={{ fontSize: '13px', color: alterado ? '#825914' : '#71636a' }}>
            {saveStatus}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {paginaId && (
            <button
              type="button"
              onClick={() => setDialogLixeira(true)}
              style={btnPerigo}
              disabled={isPending}
            >
              Mover para lixeira
            </button>
          )}

          {status === 'publicado' ? (
            <>
              <button
                type="button"
                onClick={() => setDialogRetirar(true)}
                style={btnNeutro}
                disabled={isPending}
              >
                Retirar do ar
              </button>
              <button
                type="button"
                onClick={() => salvarDados('publicado')}
                style={btnPrimario}
                disabled={isPending}
              >
                {isPending ? 'Atualizando…' : 'Atualizar publicação'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => salvarDados('rascunho')}
                style={btnNeutro}
                disabled={isPending}
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={() => setDialogPublicar(true)}
                style={btnPrimario}
                disabled={isPending}
              >
                {isPending ? 'Publicando…' : 'Publicar agora'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dialog: Confirmar Publicação */}
      {dialogPublicar && (
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
          onClick={() => setDialogPublicar(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '19px', color: '#30252a' }}>
              Publicar esta página avulsa?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#71636a', lineHeight: '1.5' }}>
              A página <strong>&quot;{titulo}&quot;</strong> ficará disponível no endereço público{' '}
              <code>/paginas/{slug || '...'}</code>.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={btnNeutro} onClick={() => setDialogPublicar(false)}>
                Cancelar
              </button>
              <button type="button" style={btnPrimario} onClick={handlePublicarAgora}>
                Sim, publicar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Confirmar Retirar do Ar */}
      {dialogRetirar && (
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
          onClick={() => setDialogRetirar(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '19px', color: '#30252a' }}>
              Retirar página do ar?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#71636a', lineHeight: '1.5' }}>
              A página deixará de ser visível no site público e voltará ao estado de rascunho interno.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={btnNeutro} onClick={() => setDialogRetirar(false)}>
                Cancelar
              </button>
              <button type="button" style={btnPrimario} onClick={handleRetirarDoAr}>
                Retirar do ar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Confirmar Mover para Lixeira */}
      {dialogLixeira && (
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
          onClick={() => setDialogLixeira(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '19px', color: '#30252a' }}>
              Mover para a lixeira?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#71636a', lineHeight: '1.5' }}>
              Deseja mover a página <strong>&quot;{titulo}&quot;</strong> para a lixeira?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={btnNeutro} onClick={() => setDialogLixeira(false)}>
                Cancelar
              </button>
              <button type="button" style={btnPrimario} onClick={handleMoverLixeira}>
                Mover para lixeira
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Pós-Publicação */}
      {dialogPosPublicacao && (
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
          onClick={() => setDialogPosPublicacao(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '460px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#30252a' }}>
              Página publicada com sucesso!
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#71636a', lineHeight: '1.5' }}>
              A página avulsa <strong>&quot;{titulo}&quot;</strong> já está disponível no ar.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`/paginas/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnPrimario, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Ver no site ↗
              </a>
              <button
                type="button"
                style={btnNeutro}
                onClick={() => setDialogPosPublicacao(false)}
              >
                Continuar editando
              </button>
              <a
                href="/admin/avulsas/nova"
                style={{ ...btnNeutro, textDecoration: 'none' }}
              >
                Criar outra página
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
