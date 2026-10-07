'use client'

import React, { useState } from 'react'
import { submeterCarteirinha } from '@/app/formularios/actions'

export default function FormularioCarteirinha() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterCarteirinha(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Erro ao solicitar carteirinha. Tente novamente.')
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
        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🪪</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#23634e', margin: '0 0 10px 0' }}>
          Solicitação de Carteirinha Registrada!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px auto' }}>
          Seu pedido foi encaminhado para emissão. Avisaremos quando sua carteirinha física ou digital estiver disponível para retirada.
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
          Solicitar Carteirinha de Associado
        </h3>
        <p style={{ fontSize: '13px', color: '#71636a', margin: '4px 0 0 0' }}>
          Para sócios titulares e dependentes. Apresente seus dados abaixo.
        </p>
      </div>

      <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />

      {erro && (
        <div style={{ background: '#fdf2f2', border: '1px solid #f0a8a8', color: '#991b1b', padding: '12px 16px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>
          ⚠️ {erro}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Tipo de solicitação <span style={{ color: '#861e32' }}>*</span></label>
          <select name="tipo_via" style={inputStyle}>
            <option value="primeira_via">1ª Via (Novo Sócio)</option>
            <option value="segunda_via">2ª Via (Perda / Danificada)</option>
            <option value="renovacao">Renovação / Atualização</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Nº da Matrícula de Sócio (se souber)</label>
          <input type="text" name="matricula_socio" placeholder="Ex: 12345" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo do sócio titular <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Nome completo" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>CPF</label>
          <input type="text" name="cpf" placeholder="000.000.000-00" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Empresa em que trabalha</label>
          <input type="text" name="empresa" placeholder="Empresa química" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Telefone / WhatsApp <span style={{ color: '#861e32' }}>*</span></label>
          <input type="tel" name="telefone" required placeholder="(12) 99999-9999" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>E-mail</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Foto 3x4 para a carteirinha (opcional, máx 5MB)</label>
          <input type="file" name="foto" accept="image/*" style={{ ...inputStyle, padding: '8px' }} />
          <small style={{ color: '#71636a', fontSize: '12px' }}>Foto nítida de rosto com fundo neutro.</small>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Observações ou nomes de dependentes</label>
          <textarea name="observacoes" rows={3} placeholder="Escreva observações adicionais ou nomes de dependentes" style={{ ...inputStyle, resize: 'vertical' }} />
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
          {enviando ? 'Enviando...' : 'Solicitar Carteirinha →'}
        </button>
      </div>
    </form>
  )
}
