'use client'

import { useEffect, useId, useRef } from 'react'

export interface ImagemLightboxDados {
  url: string
  titulo?: string
  subtitulo?: string
}

interface ImagemLightboxModalProps {
  imagem: ImagemLightboxDados | null
  onClose: () => void
}

/**
 * Lightbox acessível baseado em `<dialog>` nativo para ampliar pré-visualizações
 * no painel administrativo sem distorcer proporções nem alterar o arquivo original.
 */
export default function ImagemLightboxModal({ imagem, onClose }: ImagemLightboxModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (imagem) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  }, [imagem])

  // Fallback de light-dismiss para navegadores sem suporte a <dialog closedby="any"> (ex.: Safari)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !imagem) return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const estaFora = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }

    let iniciouFora = false
    const onPointerDown = (e: PointerEvent) => {
      iniciouFora = estaFora(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (iniciouFora && estaFora(e)) {
        dialog.close()
      }
      iniciouFora = false
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [imagem])

  if (!imagem) return null

  return (
    <>
      <dialog
        ref={dialogRef}
        className="admin-lightbox-dialog"
        aria-labelledby={titleId}
        onClose={() => {
          if (dialogRef.current) {
            dialogRef.current.returnValue = ''
          }
          onClose()
        }}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="admin-lightbox-box">
          <div className="admin-lightbox-header">
            <div style={{ minWidth: 0 }}>
              <h2 id={titleId} className="admin-lightbox-title">
                {imagem.titulo || 'Visualização ampliada da imagem'}
              </h2>
              {imagem.subtitulo && (
                <p className="admin-lightbox-subtitle">{imagem.subtitulo}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <a
                href={imagem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-lightbox-link"
              >
                Abrir original ↗
              </a>
              <button
                type="button"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                aria-label="Fechar visualização ampliada"
                className="admin-lightbox-close"
              >
                Fechar ✕
              </button>
            </div>
          </div>

          <div className="admin-lightbox-stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagem.url}
              alt={imagem.titulo || 'Pré-visualização ampliada'}
              className="admin-lightbox-img"
            />
          </div>
        </div>
      </dialog>

      <style>{`
        dialog.admin-lightbox-dialog {
          border: none;
          border-radius: 10px;
          padding: 0;
          max-width: 92vw;
          max-height: 92vh;
          background: #1b1518;
          color: #ffffff;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        dialog.admin-lightbox-dialog[open] {
          display: flex;
          flex-direction: column;
        }
        dialog.admin-lightbox-dialog:modal {
          overscroll-behavior: contain;
        }
        dialog.admin-lightbox-dialog::backdrop {
          background: rgba(18, 12, 15, 0.78);
          backdrop-filter: blur(3px);
          overflow: hidden;
          overscroll-behavior: contain;
        }
        .admin-lightbox-box {
          display: flex;
          flex-direction: column;
          max-width: 92vw;
          max-height: 92vh;
        }
        .admin-lightbox-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          background: #281e23;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .admin-lightbox-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-lightbox-subtitle {
          margin: 2px 0 0;
          font-size: 12px;
          color: #d8ccd1;
        }
        .admin-lightbox-link {
          color: #f6e7ec;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 10px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 5px;
        }
        .admin-lightbox-link:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .admin-lightbox-close {
          background: #861e32;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .admin-lightbox-close:hover {
          background: #a0253d;
        }
        .admin-lightbox-close:focus-visible,
        .admin-lightbox-link:focus-visible {
          outline: 2px solid #ffc4cc;
          outline-offset: 2px;
        }
        .admin-lightbox-stage {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: #140f12;
        }
        .admin-lightbox-img {
          max-width: 86vw;
          max-height: 76vh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 4px;
          display: block;
        }
      `}</style>
    </>
  )
}
