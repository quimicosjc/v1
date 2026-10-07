'use client'

import React, { useState, useEffect } from 'react'

interface BarraCompartilhamentoProps {
  titulo: string
  modo?: 'topo' | 'rodape'
}

export default function BarraCompartilhamento({
  titulo,
  modo = 'topo',
}: BarraCompartilhamentoProps) {
  const [copiado, setCopiado] = useState(false)
  const [urlCompleta, setUrlCompleta] = useState('')
  const [tamanhoFonte, setTamanhoFonte] = useState<number>(18)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlCompleta(window.location.href)
    }
  }, [])

  function copiarLink() {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(urlCompleta || window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  function alterarFonte(delta: number) {
    const novoTamanho = Math.max(15, Math.min(24, tamanhoFonte + delta))
    setTamanhoFonte(novoTamanho)
    const corpo = document.querySelector('.noticia-corpo') as HTMLElement | null
    if (corpo) {
      corpo.style.fontSize = `${novoTamanho}px`
    }
  }

  function resetarFonte() {
    setTamanhoFonte(18)
    const corpo = document.querySelector('.noticia-corpo') as HTMLElement | null
    if (corpo) {
      corpo.style.fontSize = '18px'
    }
  }

  const shareText = encodeURIComponent(`${titulo} — Sindicato dos Químicos SJC\n`)
  const shareUrl = encodeURIComponent(urlCompleta)
  const linkWhatsApp = `https://api.whatsapp.com/send?text=${shareText}${shareUrl}`
  const linkFacebook = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: modo === 'topo' ? '12px 0 18px 0' : '20px 0',
        borderBottom: modo === 'topo' ? '1px solid #ebdbe0' : 'none',
        borderTop: modo === 'rodape' ? '1px solid #ebdbe0' : 'none',
        marginBottom: modo === 'topo' ? '28px' : '0',
        marginTop: modo === 'rodape' ? '36px' : '0',
      }}
    >
      {/* Botões de Redes e Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: '#71636a',
            marginRight: '4px',
          }}
        >
          {modo === 'topo' ? 'Compartilhar:' : 'Compartilhe esta matéria:'}
        </span>

        {/* WhatsApp */}
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartilhar no WhatsApp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#25D366',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          className="btn-share-zap"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 17.92c-1.49 0-2.94-.4-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a7.92 7.92 0 0 1-1.22-4.15c0-4.41 3.59-8 8-8 2.14 0 4.14.83 5.65 2.35a7.924 7.924 0 0 1 2.35 5.65c0 4.41-3.59 8.01-8 8.01zm4.39-6.01c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Facebook */}
        <a
          href={linkFacebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartilhar no Facebook"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1877F2',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </a>

        {/* Copiar Link */}
        <button
          onClick={copiarLink}
          type="button"
          title="Copiar link da notícia"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: copiado ? '#e9f3ef' : '#ffffff',
            color: copiado ? '#23634e' : '#30252a',
            border: copiado ? '1px solid #23634e' : '1px solid #cbd7de',
            padding: '6px 12px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copiado ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#23634e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Link copiado!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71636a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copiar link</span>
            </>
          )}
        </button>
      </div>

      {/* Acessibilidade de Tamanho da Fonte (apenas no modo topo) */}
      {modo === 'topo' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#71636a', marginRight: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
            Texto:
          </span>
          <button
            type="button"
            onClick={() => alterarFonte(-2)}
            title="Diminuir tamanho da letra"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#30252a',
              cursor: 'pointer',
            }}
          >
            A-
          </button>
          <button
            type="button"
            onClick={resetarFonte}
            title="Tamanho padrão de leitura"
            style={{
              background: tamanhoFonte === 18 ? '#faf2f4' : '#ffffff',
              border: tamanhoFonte === 18 ? '1px solid #861e32' : '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: tamanhoFonte === 18 ? '#861e32' : '#30252a',
              cursor: 'pointer',
            }}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => alterarFonte(2)}
            title="Aumentar tamanho da letra"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#30252a',
              cursor: 'pointer',
            }}
          >
            A+
          </button>
        </div>
      )}
    </div>
  )
}
