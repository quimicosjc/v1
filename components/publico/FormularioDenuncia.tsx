'use client'

import React, { useState } from 'react'
import { submeterDenuncia } from '@/app/formularios/actions'

export default function FormularioDenuncia() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [sigilo, setSigilo] = useState<'anonimo' | 'identificado'>('anonimo')
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const res = await submeterDenuncia(formData)
    setEnviando(false)

    if (!res.ok) {
      setErro(res.erro || 'Erro ao registrar denúncia. Verifique os campos e tente novamente.')
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
          background: '#fff9f9',
          border: '1px solid #e08e9b',
          borderRadius: '8px',
          padding: '36px 30px',
          textAlign: 'center',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#861e32',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#861e32', margin: '0 0 12px 0' }}>
          Denúncia Registrada com Sucesso!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 20px auto' }}>
          Sua manifestação foi recebida pelo departamento responsável do Sindicato. Ela será apurada com total sigilo e discrição pelo nosso departamento jurídico e fiscalização.
        </p>

        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #861e32',
            borderRadius: '6px',
            padding: '20px 24px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#71636a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Protocolo de Segurança Sigiloso
          </span>
          <span style={{ fontSize: '26px', fontWeight: 900, color: '#861e32', letterSpacing: '1px' }}>
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
              display: 'inline-flex',
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

        <p style={{ fontSize: '13px', color: '#71636a', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto' }}>
          Guarde este protocolo com você. Nenhum dado que permita a sua identificação será divulgado à empresa.
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
        padding: '30px 34px',
        marginTop: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '10px', marginBottom: '22px' }}>
        <div style={{ display: 'inline-block', background: '#fff0f2', color: '#861e32', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Canal Sigiloso e Confidencial
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Denúncia Trabalhista
        </h3>
        <p style={{ fontSize: '13px', color: '#71636a', margin: '4px 0 0 0' }}>
          Denuncie abusos, condições insalubres, descumprimento de direitos ou assédio. Sua segurança e sigilo são garantidos.
        </p>
      </div>

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

      {/* OPÇÃO DE SIGILO */}
      <div style={{ background: '#f8fafb', border: '1px solid #cbd7de', borderRadius: '6px', padding: '16px 18px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#30252a', marginBottom: '10px' }}>
          Modo de Identificação:
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="sigilo"
              value="anonimo"
              checked={sigilo === 'anonimo'}
              onChange={() => setSigilo('anonimo')}
            />
            <strong>Denúncia 100% Anônima</strong> (Recomendado)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="sigilo"
              value="identificado"
              checked={sigilo === 'identificado'}
              onChange={() => setSigilo('identificado')}
            />
            Quero me identificar (sigilo garantido pelo Sindicato)
          </label>
        </div>
      </div>

      {sigilo === 'identificado' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px', background: '#fff', border: '1px solid #e4dce0', padding: '16px', borderRadius: '6px' }}>
          <div>
            <label style={labelStyle}>Seu Nome</label>
            <input type="text" name="nome" placeholder="Seu nome" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Seu Contato (Telefone ou E-mail)</label>
            <input type="text" name="contato" placeholder="Para contato sigiloso pelo sindicato" style={inputStyle} />
          </div>
        </div>
      )}

      {/* DADOS DA IRREGULARIDADE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div>
          <label style={labelStyle}>Empresa Denunciada <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="empresa" required placeholder="Nome ou razão social da empresa" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Tipo de Irregularidade <span style={{ color: '#861e32' }}>*</span></label>
          <select name="tipo_infracao" style={inputStyle}>
            <option value="Descumprimento da CCT">Descumprimento da Convenção Coletiva (CCT)</option>
            <option value="Saúde, Segurança e EPI">Condições de Saúde, Segurança e Falta de EPI</option>
            <option value="Assédio Moral ou Sexual">Assédio Moral ou Assédio Sexual</option>
            <option value="Jornada Excessiva / Horas Extras">Jornada Abusiva / Horas Extras Não Pagas</option>
            <option value="Atraso de Salário / Benefícios">Atraso de Salário ou Benefícios</option>
            <option value="Demissão Coletiva / Perseguição">Perseguição Sindical / Demissão Irregular</option>
            <option value="Outro">Outra irregularidade</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Relato detalhado dos fatos <span style={{ color: '#861e32' }}>*</span></label>
          <textarea
            name="relato"
            required
            rows={5}
            placeholder="Descreva o que está acontecendo: setor, turno, datas, chefias envolvidas e detalhes que facilitem a fiscalização pelo Sindicato."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <small style={{ color: '#71636a', fontSize: '12px' }}>Mínimo de 20 caracteres.</small>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Provas ou documentos comprobatórios (fotos, escalas, mensagens, etc.)</label>
          <input
            type="file"
            name="arquivos"
            multiple
            accept="image/*,.pdf,.docx"
            style={{ ...inputStyle, padding: '8px' }}
          />
          <small style={{ color: '#71636a', fontSize: '12px' }}>
            Até 5 arquivos (máx 20MB cada). Formatos aceitos: fotos (JPG, PNG), PDF e DOCX.
          </small>
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
            padding: '13px 28px',
            fontSize: '15px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{enviando ? 'Enviando com Sigilo...' : 'Enviar Denúncia Sigilosa'}</span>
        </button>
      </div>
    </form>
  )
}
