'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { PaginaInstitucional } from '@/app/admin/paginas/actions'
import { salvarPaginaInstitucional } from '@/app/admin/paginas/actions'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px', background: '#ffffff', border: '1px solid #cbd7de', borderRadius: '5px' }} />
})

interface EditorPaginaVinculadaProps {
  pagina: PaginaInstitucional
  moduloDestino: {
    nome: string
    href: string
    descricao: string
    botaoLabel: string
  }
}

export default function EditorPaginaVinculada({ pagina, moduloDestino }: EditorPaginaVinculadaProps) {
  const [titulo, setTitulo] = useState(pagina.titulo || '')
  const [subtitulo, setSubtitulo] = useState(pagina.subtitulo || '')
  const [chapeu, setChapeu] = useState(pagina.chapeu || '')
  const [corpo, setCorpo] = useState(pagina.corpo || '')
  const [status, setStatus] = useState<'rascunho' | 'publicado'>(pagina.status === 'rascunho' ? 'rascunho' : 'publicado')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)

  function showToast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 4000)
  }

  async function handleSalvar() {
    setSalvando(true)
    const res = await salvarPaginaInstitucional(pagina.slug, {
      titulo,
      subtitulo: subtitulo || null,
      chapeu: chapeu || null,
      corpo,
      status,
    })
    setSalvando(false)

    if ('error' in res) {
      showToast(res.error, 'erro')
    } else {
      setAlterado(false)
      showToast('Página atualizada com sucesso!')
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '0 0 4px' }}>
          PÁGINAS DO SITE / {pagina.chapeu?.toUpperCase() || 'SERVIÇOS'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              {pagina.titulo}
            </h1>
            <p style={{ color: '#71636a', margin: 0, fontSize: '14px' }}>
              Página integrada com formulário público e central administrativa.
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

      {/* Card de Conexão com Módulo Central */}
      <div
        style={{
          background: '#fde8ed',
          borderRadius: '8px',
          border: '1px solid #f4c4d0',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#861e32', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            MÓDULO VINCULADO
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#65172a', margin: '4px 0 6px' }}>
            {moduloDestino.nome}
          </h2>
          <p style={{ fontSize: '13px', color: '#4a3f45', margin: 0, maxWidth: '640px', lineHeight: '1.4' }}>
            {moduloDestino.descricao}
          </p>
        </div>

        <Link
          href={moduloDestino.href}
          style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            background: '#861e32',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(134,30,50,0.25)',
          }}
        >
          {moduloDestino.botaoLabel} →
        </Link>
      </div>

      {/* Formulário Editorial da Página */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#30252a', marginBottom: '6px' }}>
              Título público da página *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setAlterado(true) }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '15px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#30252a', marginBottom: '6px' }}>
              Subtítulo orientativo (opcional)
            </label>
            <textarea
              rows={2}
              value={subtitulo}
              onChange={(e) => { setSubtitulo(e.target.value); setAlterado(true) }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4dce0', borderRadius: '8px', padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#30252a', marginBottom: '8px' }}>
            Texto de apresentação e instruções
          </label>
          <RichEditor
            content={corpo}
            onChange={(html) => { setCorpo(html); setAlterado(true) }}
            placeholder="Escreva as instruções exibidas ao trabalhador antes do formulário ou listagem..."
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
        <span style={{ fontSize: '13px', color: '#71636a' }}>
          {alterado ? 'Há alterações não salvas' : 'Textos sincronizados'}
        </span>

        <button
          type="button"
          disabled={salvando}
          onClick={handleSalvar}
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
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
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
