'use client'

import React, { useState } from 'react'
import { submeterFaleConosco } from '@/app/formularios/actions'
import { formatarTelefone } from '@/lib/masks-viacep'

export default function FormularioFaleConosco() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [opcaoContato, setOpcaoContato] = useState('Dúvidas Gerais e Processos')
  const [telefone, setTelefone] = useState('')

  const isDenuncia = opcaoContato === 'Denúncia'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterFaleConosco(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Erro ao enviar mensagem. Tente novamente.')
    } else {
      setProtocolo(res.protocolo || 'PROT-OK')
    }
  }

  function copiarProtocolo() {
    if (protocolo) {
      navigator.clipboard.writeText(protocolo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  if (protocolo) {
    return (
      <div
        style={{
          background: '#e9f3ef',
          border: '1px solid #7cb39b',
          borderRadius: '8px',
          padding: '32px 28px',
          textAlign: 'center',
          marginTop: '32px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#23634e',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#23634e', margin: '0 0 10px 0' }}>
          Mensagem Enviada com Sucesso!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px auto' }}>
          Sua mensagem foi encaminhada diretamente à equipe do Sindicato dos Químicos.
        </p>

        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #7cb39b',
            borderRadius: '6px',
            padding: '16px 20px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#71636a', textTransform: 'uppercase' }}>
            Número de Protocolo
          </span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#861e32' }}>
            {protocolo}
          </span>
          <button
            type="button"
            onClick={copiarProtocolo}
            style={{
              background: '#f8fafb',
              border: '1px solid #cbd7de',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#30252a',
              cursor: 'pointer',
            }}
          >
            {copiado ? 'Protocolo copiado!' : 'Copiar protocolo'}
          </button>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    fontSize: '15px',
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
        marginTop: '36px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '10px', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Envie sua Mensagem — Fale Conosco
        </h3>
        <p style={{ fontSize: '13.5px', color: '#71636a', margin: '4px 0 0 0' }}>
          Preencha os campos abaixo corretamente para falar com o Sindicato.
        </p>
      </div>

      <div
        style={{
          background: '#fff9ea',
          border: '1px solid #f3d489',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13.5px',
          color: '#66450c',
          lineHeight: 1.5,
        }}
      >
        <strong>Atenção:</strong> Em caso de denúncia não há necessidade de informar seu nome e e-mail verdadeiro, basta deixar o campo em branco.
      </div>

      <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />

      {erro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fdf2f2', border: '1px solid #f0a8a8', color: '#991b1b', padding: '12px 16px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>
          <span>{erro}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Escolha a opção de contato <span style={{ color: '#861e32' }}>*</span></label>
          <select
            name="opcao_contato"
            value={opcaoContato}
            onChange={(e) => setOpcaoContato(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="Dúvidas Gerais e Processos">Dúvidas Gerais e Processos</option>
            <option value="Denúncia">Denúncia</option>
            <option value="Quero receber o Boca no Trombone em meu e-mail">Quero receber o Boca no Trombone em meu e-mail</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Seu nome completo (Sem abreviação) {!isDenuncia && <span style={{ color: '#861e32' }}>*</span>}
            {isDenuncia && <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional para denúncia)</span>}
          </label>
          <input
            type="text"
            name="nome"
            required={!isDenuncia}
            placeholder="Seu nome completo (Sem abreviação)"
            maxLength={70}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Fábrica onde trabalha <span style={{ color: '#861e32' }}>*</span></label>
          <input
            type="text"
            name="empresa"
            required
            placeholder="Fábrica onde trabalha"
            maxLength={70}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Cidade <span style={{ color: '#861e32' }}>*</span></label>
          <input
            type="text"
            name="cidade"
            required
            placeholder="Cidade"
            maxLength={120}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>E-mail {isDenuncia && <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span>}</label>
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Telefone / WhatsApp <span style={{ color: '#71636a', fontWeight: 400 }}>(opcional)</span></label>
          <input
            type="tel"
            name="telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(12) 99999-9999"
            maxLength={15}
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Mensagem <span style={{ color: '#861e32' }}>*</span></label>
          <textarea
            name="mensagem"
            required
            rows={6}
            maxLength={1200}
            placeholder="Escreva seu texto"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
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
            padding: '12px 26px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar mensagem →'}
        </button>
      </div>
    </form>
  )
}
