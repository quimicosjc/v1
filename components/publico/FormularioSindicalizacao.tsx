'use client'

import React, { useState } from 'react'
import { submeterSindicalizacao } from '@/app/formularios/actions'

export default function FormularioSindicalizacao() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterSindicalizacao(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Ocorreu um erro ao enviar sua ficha. Tente novamente.')
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
          Ficha de Sindicalização Enviada com Sucesso!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px auto' }}>
          Seu pedido de filiação foi recebido pela nossa secretaria. Em breve nossa equipe entrará em contato para concluir a validação.
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
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#71636a', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Número de Protocolo
          </span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#861e32', letterSpacing: '1px' }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copiado ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Protocolo copiado!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Copiar protocolo</span>
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#71636a', margin: 0 }}>
          Dúvidas? Entre em contato pelo telefone <strong>(12) 3921-8177</strong> ou WhatsApp.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    fontSize: '16px',
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '8px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Preencha sua Ficha de Filiação
        </h3>
        <p style={{ fontSize: '13px', color: '#71636a', margin: '4px 0 0 0' }}>
          Junte-se à luta da categoria química. Os campos com <span style={{ color: '#861e32' }}>*</span> são obrigatórios.
        </p>
      </div>

      {/* Honeypot invisível contra bots */}
      <input type="text" name="website_extra" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />

      {erro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fdf2f2', border: '1px solid #f0a8a8', color: '#991b1b', padding: '12px 16px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {/* BLOCO 1: DADOS PESSOAIS */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        1. Dados Pessoais
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Seu nome completo" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>CPF <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="cpf" required placeholder="000.000.000-00" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>RG</label>
          <input type="text" name="rg" placeholder="Número do RG" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Data de Nascimento</label>
          <input type="date" name="data_nascimento" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Estado Civil</label>
          <select name="estado_civil" style={inputStyle}>
            <option value="solteiro">Solteiro(a)</option>
            <option value="casado">Casado(a) / União Estável</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viuvo">Viúvo(a)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Telefone / Celular (WhatsApp) <span style={{ color: '#861e32' }}>*</span></label>
          <input type="tel" name="telefone" required placeholder="(12) 99999-9999" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>E-mail</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" style={inputStyle} />
        </div>
      </div>

      {/* BLOCO 2: ENDEREÇO */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #e4dce0', paddingTop: '18px' }}>
        2. Endereço Residencial
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Endereço (Rua, Av, Número, Compl.)</label>
          <input type="text" name="endereco" placeholder="Ex: Rua das Flores, 123, Apto 4" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bairro</label>
          <input type="text" name="bairro" placeholder="Bairro" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Cidade</label>
          <input type="text" name="cidade" placeholder="São José dos Campos" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>CEP</label>
          <input type="text" name="cep" placeholder="12200-000" style={inputStyle} />
        </div>
      </div>

      {/* BLOCO 3: DADOS PROFISSIONAIS */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #e4dce0', paddingTop: '18px' }}>
        3. Dados da Empresa
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={labelStyle}>Empresa em que trabalha <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="empresa" required placeholder="Nome da empresa química ou farmacêutica" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Função / Cargo</label>
          <input type="text" name="funcao" placeholder="Ex: Operador de Produção" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Data de Admissão na Empresa</label>
          <input type="date" name="data_admissao" style={inputStyle} />
        </div>
      </div>

      {/* BLOCO 4: AUTORIZAÇÃO */}
      <div style={{ background: '#f8fafb', border: '1px solid #cbd7de', borderRadius: '6px', padding: '16px 18px', marginBottom: '26px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', fontSize: '13px', lineHeight: 1.5, color: '#30252a' }}>
          <input type="checkbox" name="autorizacao" value="true" required style={{ marginTop: '3px', width: '16px', height: '16px' }} />
          <span>
            <strong>Autorização de Filiação Sindical:</strong> Proponho minha filiação ao Sindicato dos Químicos de São José dos Campos e Região e autorizo o desconto mensal da mensalidade associativa em folha de pagamento, conforme previsto em Estatuto e legislação vigente. <span style={{ color: '#861e32' }}>*</span>
          </span>
        </label>
      </div>

      {/* BOTÃO DE ENVIO */}
      <div style={{ textAlign: 'right' }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            background: enviando ? '#a25969' : '#861e32',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            padding: '13px 28px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {enviando ? 'Enviando Ficha...' : 'Enviar Ficha de Filiação →'}
        </button>
      </div>
    </form>
  )
}
