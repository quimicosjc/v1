'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import { Node } from '@tiptap/core'

const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: '0',
      },
      allowfullscreen: {
        default: 'true',
      },
      allow: {
        default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      },
      title: {
        default: 'Vídeo / Conteúdo Incorporado',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'iframe-wrapper' },
      ['iframe', HTMLAttributes],
    ]
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  onUploadImage?: (file: File) => Promise<string>
}

interface LinkDialogState {
  open: boolean
  url: string
  text: string
}

interface EmbedDialogState {
  open: boolean
  code: string
}

// ── Iframe sanitizer ──────────────────────────────────────────────────────────

const ALLOWED_IFRAME_DOMAINS = [
  'youtube.com/embed',
  'youtube-nocookie.com/embed',
  'instagram.com',
  'player.vimeo.com/video',
  'google.com/maps/embed',
]

function sanitizeIframe(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // 1. YouTube direct URLs (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch) {
    const videoId = ytMatch[1]
    return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" width="100%" height="360" title="Vídeo do YouTube" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
  }

  // 2. Vimeo direct URLs (vimeo.com/123456789 or player.vimeo.com/video/123456789)
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="360" title="Vídeo do Vimeo" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>`
  }

  // 3. Instagram direct URLs (instagram.com/p/ID or instagram.com/reel/ID)
  const instaMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/i)
  if (instaMatch) {
    const postId = instaMatch[1]
    return `<iframe src="https://www.instagram.com/p/${postId}/embed/" width="100%" height="480" title="Publicação do Instagram" frameborder="0" allowfullscreen></iframe>`
  }

  // 4. Existing <iframe> code
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcMatch) {
    const src = srcMatch[1]
    const isAllowed = ALLOWED_IFRAME_DOMAINS.some((domain) => src.includes(domain))
    if (!isAllowed) return null

    const titleMatch = trimmed.match(/title=["']([^"']+)["']/i)
    const title = titleMatch ? titleMatch[1] : 'Conteúdo Incorporado'
    return `<iframe src="${src}" width="100%" height="360" title="${title}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
  }

  // 5. Google Maps embed URL pasted directly
  if (trimmed.includes('google.com/maps/embed')) {
    return `<iframe src="${trimmed}" width="100%" height="360" title="Mapa do Google" frameborder="0" allowfullscreen loading="lazy"></iframe>`
  }

  return null
}

// ── Styles ────────────────────────────────────────────────────────────────────

const editorContainerStyle: React.CSSProperties = {
  border: '1px solid #cbd7de',
  borderRadius: '5px',
  background: 'white',
  position: 'relative',
}

const toolbarStyle: React.CSSProperties = {
  borderBottom: '1px solid #e4dce0',
  padding: '8px 12px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2px',
  background: '#f8fafb',
  borderTopLeftRadius: '5px',
  borderTopRightRadius: '5px',
}

const tableActionBtn: React.CSSProperties = {
  border: '1px solid #d4a373',
  background: 'white',
  color: '#825914',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const editorAreaStyle: React.CSSProperties = {
  padding: '16px',
  minHeight: '280px',
  outline: 'none',
  fontSize: '15px',
  lineHeight: '1.7',
  color: '#30252a',
  background: 'white',
  borderRadius: '0 0 5px 5px',
}

const sepStyle: React.CSSProperties = {
  width: '1px',
  height: '20px',
  background: '#e4dce0',
  margin: '0 4px',
  alignSelf: 'center',
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  border: 'none',
  borderRadius: '4px',
  padding: '5px 8px',
  fontSize: '13px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  background: active ? '#861e32' : 'transparent',
  color: active ? 'white' : '#30252a',
  fontWeight: active ? 600 : 400,
  transition: 'background 0.1s',
})

const dialogOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(30,20,25,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const dialogBoxStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '440px',
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
}

const dialogInputStyle: React.CSSProperties = {
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
  marginBottom: '12px',
}

const dialogLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#30252a',
  marginBottom: '6px',
}

const btnPrimario: React.CSSProperties = {
  background: '#861e32',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  padding: '9px 16px',
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
  padding: '9px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RichEditor({
  content,
  onChange,
  placeholder,
  onUploadImage,
}: RichEditorProps) {
  // ── Dialogs ─────────────────────────────────────────────────────────────────
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({ open: false, url: '', text: '' })
  const [embedDialog, setEmbedDialog] = useState<EmbedDialogState>({ open: false, code: '' })
  const [embedError, setEmbedError] = useState('')
  const [tableDialog, setTableDialog] = useState({ open: false, rows: 3, cols: 3 })
  const imgInputRef = useRef<HTMLInputElement>(null)

  // ── Editor ──────────────────────────────────────────────────────────────────
  const [, setSelectionTick] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: placeholder ?? 'Escreva o conteúdo completo da notícia aqui…',
      }),
      Iframe,
    ],
    content,
    onSelectionUpdate() {
      setSelectionTick((t) => t + 1)
    },
    onTransaction() {
      setSelectionTick((t) => t + 1)
    },
    onUpdate({ editor: ed }) {
      const html = ed.getHTML()
      // Atualizar ref ANTES de chamar onChange — evita que useEffect reponha
      // o conteúdo e apague o histórico a cada tecla (bug do desfazer/refazer)
      lastHtmlRef.current = html
      onChange(html)
    },
    editorProps: {
      attributes: { style: Object.entries(editorAreaStyle).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';') },
      // §3.3: Colar sem formatação — remove fontes, cores, negritos, links do Word/Google Docs.
      // Preserva o conteúdo e as separações entre parágrafos.
      handlePaste(_view, event) {
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false
        event.preventDefault()
        // Blocos separados por linha em branco → parágrafos distintos
        // Linhas simples dentro do mesmo bloco → <br> dentro do parágrafo
        const html = text
          .split(/\n{2,}/)
          .map((block) =>
            `<p>${block
              .split(/\n/)
              .map((line) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
              .join('<br>')
            }</p>`
          )
          .join('')
        editor?.commands.insertContent(html)
        return true
      },
    },
  })

  // Sync external content changes (e.g. draft recovery) without causing loops
  const lastHtmlRef = useRef(content)
  useEffect(() => {
    if (!editor) return
    if (content !== lastHtmlRef.current) {
      lastHtmlRef.current = content
      // Only update if editor HTML genuinely differs (avoid cursor reset on each keystroke)
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content, { emitUpdate: false })
      }
    }
  }, [content, editor])

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return
      if (onUploadImage) {
        try {
          const url = await onUploadImage(file)
          editor.chain().focus().setImage({ src: url, alt: '' }).run()
        } catch {
          // silently ignore upload error – caller handles toast
        }
      } else {
        // Fallback: base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const src = e.target?.result as string
          editor.chain().focus().setImage({ src, alt: '' }).run()
        }
        reader.readAsDataURL(file)
      }
    },
    [editor, onUploadImage],
  )

  // ── Link dialog handlers ─────────────────────────────────────────────────────
  function openLinkDialog() {
    if (!editor) return
    const existing = editor.getAttributes('link').href as string | undefined
    const selectedText = editor.state.selection.empty ? '' : editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
    )
    setLinkDialog({ open: true, url: existing ?? '', text: selectedText })
  }

  function removeLink() {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setLinkDialog({ open: false, url: '', text: '' })
  }

  function confirmLink() {
    if (!editor) return
    const { url, text } = linkDialog
    if (!url) { setLinkDialog((s) => ({ ...s, open: false })); return }

    if (editor.state.selection.empty && text) {
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
    setLinkDialog({ open: false, url: '', text: '' })
  }

  // ── Embed dialog handlers ────────────────────────────────────────────────────
  function confirmEmbed() {
    if (!editor) return
    const sanitized = sanitizeIframe(embedDialog.code)
    if (!sanitized) {
      setEmbedError('Conteúdo inválido. Use um link ou iframe do YouTube, Vimeo, Instagram ou Google Maps.')
      return
    }
    editor.commands.insertContent(sanitized)
    setEmbedDialog({ open: false, code: '' })
    setEmbedError('')
  }

  if (!editor) return null

  return (
    <>
      {/* ── Inline styles for ProseMirror ── */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #a0a0a0;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror:focus { outline: none; }
        .ProseMirror img { max-width: 100%; height: auto; display: block; border-radius: 4px; margin: 16px auto; }
        .ProseMirror iframe { width: 100%; aspect-ratio: 16 / 9; border: none; border-radius: 4px; margin: 16px 0; display: block; }
        .ProseMirror .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 16px 0; border-radius: 4px; overflow: hidden; background: #000; }
        .ProseMirror .iframe-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; margin: 0; }
        .ProseMirror table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 16px 0; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #cbd7de; padding: 10px 12px; text-align: left; vertical-align: top; min-width: 80px; }
        .ProseMirror th { background: #f8fafb; font-weight: 600; color: #30252a; }
        .ProseMirror blockquote { border-left: 3px solid #861e32; margin: 0 0 12px; padding-left: 16px; color: #71636a; font-style: italic; }
        .ProseMirror h2 { font-size: 20px; font-weight: 700; color: #30252a; margin: 20px 0 8px; }
        .ProseMirror h3 { font-size: 17px; font-weight: 600; color: #30252a; margin: 16px 0 6px; }
        .ProseMirror ul { padding-left: 20px; }
        .ProseMirror ol { padding-left: 20px; }
        .ProseMirror a { color: #791c30; text-decoration: underline; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror li { margin-bottom: 4px; }
      `}</style>

      {/* ── Editor container ── */}
      <div style={editorContainerStyle}>
        {/* ── Header fixo (Toolbar + Sub-barras contextuais) ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafb', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }}>
          {/* Toolbar Principal */}
          <div style={toolbarStyle} role="toolbar" aria-label="Barra de formatação">

            {/* Grupo 1: Formatação */}
            <button
              type="button"
              title="Negrito"
              style={btnStyle(editor.isActive('bold'))}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <b>N</b>
            </button>
            <button
              type="button"
              title="Itálico"
              style={btnStyle(editor.isActive('italic'))}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              title="Sublinhado"
              style={btnStyle(editor.isActive('underline'))}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <u>S</u>
            </button>
            <button
              type="button"
              title="Tachado"
              style={btnStyle(editor.isActive('strike'))}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <s>T</s>
            </button>

            <div style={sepStyle} />

            {/* Grupo 2: Estrutura */}
            <button
              type="button"
              title="Subtítulo"
              style={btnStyle(editor.isActive('heading', { level: 2 }))}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </button>
            <button
              type="button"
              title="Subtítulo menor"
              style={btnStyle(editor.isActive('heading', { level: 3 }))}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </button>
            <button
              type="button"
              title="Citação em bloco"
              style={btnStyle(editor.isActive('blockquote'))}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              ❝
            </button>

            <div style={sepStyle} />

            {/* Grupo 3: Listas */}
            <button
              type="button"
              title="Lista com marcadores"
              style={btnStyle(editor.isActive('bulletList'))}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • Lista
            </button>
            <button
              type="button"
              title="Lista numerada"
              style={btnStyle(editor.isActive('orderedList'))}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. Lista
            </button>
            <button
              type="button"
              title="Aumentar recuo"
              style={btnStyle(false)}
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            >
              →
            </button>
            <button
              type="button"
              title="Reduzir recuo"
              style={btnStyle(false)}
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            >
              ←
            </button>

            <div style={sepStyle} />

            {/* Grupo 4: Links e mídia */}
            <button
              type="button"
              title="Inserir ou editar link"
              style={btnStyle(editor.isActive('link'))}
              onClick={openLinkDialog}
            >
              🔗 Link
            </button>
            <button
              type="button"
              title="Inserir imagem"
              style={btnStyle(false)}
              onClick={() => imgInputRef.current?.click()}
            >
              🖼 Imagem
            </button>
            <button
              type="button"
              title="Inserir tabela"
              style={btnStyle(editor.isActive('table'))}
              onClick={() => setTableDialog({ open: true, rows: 3, cols: 3 })}
            >
              ⊞ Tabela
            </button>
            <button
              type="button"
              title="Incorporar vídeo ou mapa"
              style={btnStyle(false)}
              onClick={() => setEmbedDialog({ open: true, code: '' })}
            >
              {'</>'} Incorporar
            </button>

            <div style={sepStyle} />

            {/* Grupo 5: Histórico */}
            <button
              type="button"
              title="Desfazer"
              style={btnStyle(false)}
              onClick={() => editor.chain().focus().undo().run()}
            >
              ↩ Desfazer
            </button>
            <button
              type="button"
              title="Refazer"
              style={btnStyle(false)}
              onClick={() => editor.chain().focus().redo().run()}
            >
              ↪ Refazer
            </button>
          </div>

          {/* Sub-barra contextual para manipulação de tabela */}
          {editor.isActive('table') && (
            <div
              style={{
                background: '#fff2df',
                borderBottom: '1px solid #ebd3b0',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#825914',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 700, marginRight: '4px' }}>⊞ Tabela ativa:</span>
              <button
                type="button"
                style={tableActionBtn}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Adicionar linha abaixo da atual"
              >
                + Linha abaixo
              </button>
              <button
                type="button"
                style={tableActionBtn}
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Excluir linha atual"
              >
                - Linha
              </button>
              <button
                type="button"
                style={tableActionBtn}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Adicionar coluna à direita da atual"
              >
                + Coluna à direita
              </button>
              <button
                type="button"
                style={tableActionBtn}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Excluir coluna atual"
              >
                - Coluna
              </button>
              <button
                type="button"
                style={tableActionBtn}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                title="Alternar linha de cabeçalho"
              >
                Cabeçalho
              </button>
              <button
                type="button"
                style={{
                  ...tableActionBtn,
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderColor: '#fca5a5',
                  marginLeft: 'auto',
                }}
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Excluir toda a tabela"
              >
                ✕ Excluir Tabela
              </button>
            </div>
          )}
        </div>

        {/* ── Content area (com rolagem horizontal para tabelas em telas menores) ── */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <EditorContent editor={editor} />
        </div>

        {/* Hidden file input for image upload */}
        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleImageFile(file)
            }
            e.target.value = ''
          }}
        />
      </div>

      {/* ── Dialog: Link ── */}
      {linkDialog.open && (
        <div style={dialogOverlayStyle} onClick={() => setLinkDialog((s) => ({ ...s, open: false }))}>
          <div style={dialogBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#30252a' }}>
              {editor.isActive('link') ? 'Editar link' : 'Inserir link'}
            </h3>
            <label style={dialogLabelStyle}>URL</label>
            <input
              type="url"
              placeholder="https://…"
              value={linkDialog.url}
              onChange={(e) => setLinkDialog((s) => ({ ...s, url: e.target.value }))}
              style={dialogInputStyle}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') confirmLink() }}
            />
            <label style={dialogLabelStyle}>Texto do link <span style={{ fontWeight: 400, color: '#71636a' }}>(opcional — usa a seleção atual)</span></label>
            <input
              type="text"
              placeholder="Texto exibido…"
              value={linkDialog.text}
              onChange={(e) => setLinkDialog((s) => ({ ...s, text: e.target.value }))}
              style={dialogInputStyle}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmLink() }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              {editor.isActive('link') ? (
                <button
                  type="button"
                  style={{ ...btnNeutro, color: '#861e32', borderColor: '#eed2dc' }}
                  onClick={removeLink}
                  title="Remover este link do texto"
                >
                  Remover link
                </button>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={btnNeutro}
                  onClick={() => setLinkDialog({ open: false, url: '', text: '' })}
                >
                  Cancelar
                </button>
                <button type="button" style={btnPrimario} onClick={confirmLink}>
                  {editor.isActive('link') ? 'Atualizar link' : 'Inserir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Incorporar ── */}
      {embedDialog.open && (
        <div style={dialogOverlayStyle} onClick={() => { setEmbedDialog({ open: false, code: '' }); setEmbedError('') }}>
          <div style={dialogBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#30252a' }}>Incorporar conteúdo</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#71636a', lineHeight: '1.5' }}>
              Cole o link do YouTube (ex: <code>https://youtube.com/watch?v=...</code>), Vimeo, Instagram ou código iframe do Google Maps.
            </p>
            <label style={dialogLabelStyle}>Link ou código de incorporação</label>
            <textarea
              rows={4}
              placeholder={'https://www.youtube.com/watch?v=... ou <iframe src="..."></iframe>'}
              value={embedDialog.code}
              onChange={(e) => { setEmbedDialog((s) => ({ ...s, code: e.target.value })); setEmbedError('') }}
              style={{ ...dialogInputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
              autoFocus
            />
            {embedError && (
              <p style={{ margin: '-8px 0 12px', fontSize: '13px', color: '#861e32' }}>{embedError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={btnNeutro}
                onClick={() => { setEmbedDialog({ open: false, code: '' }); setEmbedError('') }}
              >
                Cancelar
              </button>
              <button type="button" style={btnPrimario} onClick={confirmEmbed}>
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {tableDialog.open && (
        <div style={dialogOverlayStyle} onClick={() => setTableDialog(s => ({ ...s, open: false }))}>
          <div style={dialogBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#30252a' }}>Inserir Tabela</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={dialogLabelStyle}>Colunas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableDialog.cols}
                  onChange={(e) => setTableDialog(s => ({ ...s, cols: parseInt(e.target.value) || 1 }))}
                  style={dialogInputStyle}
                  autoFocus
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={dialogLabelStyle}>Linhas</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableDialog.rows}
                  onChange={(e) => setTableDialog(s => ({ ...s, rows: parseInt(e.target.value) || 1 }))}
                  style={dialogInputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={btnNeutro} onClick={() => setTableDialog(s => ({ ...s, open: false }))}>
                Cancelar
              </button>
              <button
                type="button"
                style={btnPrimario}
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().insertTable({ rows: tableDialog.rows, cols: tableDialog.cols, withHeaderRow: true }).run()
                  }
                  setTableDialog(s => ({ ...s, open: false }))
                }}
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
