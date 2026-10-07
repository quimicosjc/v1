'use client'

import React, { useState } from 'react'
import { submeterAtualizacaoCadastral } from '@/app/formularios/actions'

export default function FormularioAtualizacao() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterAtualizacaoCadastral(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Erro ao enviar atualização cadastral.')
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
          marginTop: '24px',
        }}
      >
        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔄</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#23634e', margin: '0 0 10px 0' }}>
          Atualização Cadastral Recebida!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px auto' }}>
          Seus dados atualizados foram registrados em nosso sistema. Obrigado por manter seu cadastro em dia!
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
            marginBottom: '20px',
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
            {copiado ? '✓ Copiado!' : '📋 Copiar protocolo'}
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
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '8px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Atualizar Cadastro de Associado
        </h3>
        <p style={{ fontSize: '13px', color: '#71636a', margin: '4px 0 0 0' }}>
          Mudou de endereço, telefone ou empresa? Atualize seus dados para manter seus benefícios ativos.
        </p>
      </div>

      <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />

      {erro && (
        <div style={{ background: '#fdf2f2', border: '1px solid #f0a8a8', color: '#991b1b', padding: '12px 16px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>
          ⚠️ {erro}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Seu nome" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>CPF</label>
          <input type="text" name="cpf" placeholder="000.000.000-00" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Matrícula de Sócio</label>
          <input type="text" name="matricula_socio" placeholder="Nº da matrícula" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Telefone atual / WhatsApp <span style={{ color: '#861e32' }}>*</span></label>
          <input type="tel" name="telefone" required placeholder="(12) 99999-9999" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>E-mail atual</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Empresa Atual</label>
          <input type="text" name="empresa" placeholder="Empresa onde trabalha atualmente" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Novo Endereço Residencial</label>
          <input type="text" name="endereco" placeholder="Rua, número, bairro, cidade, CEP" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Outras informações a alterar</label>
          <textarea name="alteracoes" rows={3} placeholder="Descreva quais dados mudaram (ex: dependentes, telefone antigo, etc.)" style={{ ...inputStyle, resize: 'vertical' }} />
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
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Enviando...' : 'Salvar Atualização Cadastral →'}
        </button>
      </div>
    </form>
  )
}
