'use client'

import React, { useState } from 'react'
import { submeterCadastroNoticias } from '@/app/formularios/actions'

export default function FormularioCadastroNoticias() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterCadastroNoticias(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Erro ao realizar cadastro.')
    } else {
      setProtocolo(res.protocolo || 'PROT-OK')
    }
  }

  if (protocolo) {
    return (
      <div
        style={{
          background: '#e9f3ef',
          border: '1px solid #7cb39b',
          borderRadius: '8px',
          padding: '28px 24px',
          textAlign: 'center',
          marginTop: '24px',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📬</div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#23634e', margin: '0 0 8px 0' }}>
          Cadastro Realizado com Sucesso!
        </h3>
        <p style={{ fontSize: '14px', color: '#30252a', margin: 0 }}>
          Você receberá informativos, comunicados de assembleias e notícias da categoria diretamente em seus canais.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    fontSize: '14px',
    color: '#30252a',
    background: '#ffffff',
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
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#ffffff',
        border: '1px solid #e4dce0',
        borderRadius: '8px',
        padding: '28px 32px',
        marginTop: '28px',
      }}
    >
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '8px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Receba Notícias no seu WhatsApp e E-mail
        </h3>
        <p style={{ fontSize: '13px', color: '#71636a', margin: '4px 0 0 0' }}>
          Fique por dentro das lutas, campanhas salariais e benefícios do Sindicato.
        </p>
      </div>

      <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />

      {erro && (
        <div style={{ background: '#fdf2f2', border: '1px solid #f0a8a8', color: '#991b1b', padding: '10px 14px', borderRadius: '5px', marginBottom: '16px', fontSize: '14px' }}>
          ⚠️ {erro}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Seu Nome <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Como prefere ser chamado" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Seu WhatsApp / Celular</label>
          <input type="tel" name="telefone" placeholder="(12) 99999-9999" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Seu E-mail</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" style={inputStyle} />
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            background: enviando ? '#a25969' : '#861e32',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            padding: '11px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Cadastrando...' : 'Quero Receber Notícias →'}
        </button>
      </div>
    </form>
  )
}
