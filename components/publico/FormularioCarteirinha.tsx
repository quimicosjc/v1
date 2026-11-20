'use client'

import React, { useState } from 'react'
import { submeterCarteirinha } from '@/app/formularios/actions'
import {
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  buscarEnderecoPorCEP,
} from '@/lib/masks-viacep'

export default function FormularioCarteirinha() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [telefoneResidencial, setTelefoneResidencial] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [cepAutomatico, setCepAutomatico] = useState(false)

  async function handleCepChange(valor: string) {
    const formatado = formatarCEP(valor)
    setCep(formatado)
    const digitos = formatado.replace(/\D/g, '')
    if (digitos.length === 8) {
      setBuscandoCep(true)
      const dados = await buscarEnderecoPorCEP(digitos)
      setBuscandoCep(false)
      if (dados) {
        if (dados.logradouro) setEndereco(dados.logradouro)
        if (dados.bairro) setBairro(dados.bairro)
        if (dados.localidade) setCidade(dados.localidade)
        setCepAutomatico(true)
      }
    } else {
      setCepAutomatico(false)
    }
  }

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
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <circle cx="8" cy="10" r="2"/>
            <line x1="14" y1="9" x2="18" y2="9"/>
            <line x1="14" y1="13" x2="18" y2="13"/>
            <line x1="6" y1="16" x2="18" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#23634e', margin: '0 0 10px 0' }}>
          Solicitação de Carteirinha Registrada!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 20px auto' }}>
          Seu pedido foi encaminhado para emissão. Caso não receba sua carteirinha pelo WhatsApp em até <strong>5 dias úteis</strong>, entre em contato com o setor de carteirinhas pelo telefone/WhatsApp:{' '}
          <a
            href="https://wa.me/5512997260926"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#23634e', fontWeight: 800, textDecoration: 'underline' }}
          >
            (12) 99726-0926
          </a>.
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
        marginTop: '28px',
      }}
    >
      <div style={{ borderBottom: '2px solid #861e32', paddingBottom: '10px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#861e32', margin: 0 }}>
          Solicitação de Carteirinha de Associado
        </h3>
        <p style={{ fontSize: '13.5px', color: '#71636a', margin: '4px 0 0 0' }}>
          Preencha os campos abaixo corretamente para emissão da 1ª ou 2ª via da carteirinha do Sindicato.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Nome completo" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Conhecido por (Apelido)</label>
          <input type="text" name="apelido" placeholder="Conhecido por" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>CPF</label>
          <input
            type="text"
            name="cpf"
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Nº da Matrícula de Sócio (se souber)</label>
          <input type="text" name="matricula_socio" placeholder="Ex: 12345" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Telefone Celular / WhatsApp <span style={{ color: '#861e32' }}>*</span></label>
          <input
            type="tel"
            name="telefone"
            required
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(12) 99999-9999"
            maxLength={15}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Telefone Residencial</label>
          <input
            type="tel"
            name="telefone_residencial"
            value={telefoneResidencial}
            onChange={(e) => setTelefoneResidencial(formatarTelefone(e.target.value))}
            placeholder="(12) 3921-0000"
            maxLength={15}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>E-mail</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" style={inputStyle} />
        </div>

        {/* ENDEREÇO COM VIACEP */}
        <div>
          <label style={labelStyle}>
            CEP {buscandoCep && <span style={{ color: '#861e32' }}>(buscando...)</span>}
            {!buscandoCep && cepAutomatico && <span style={{ color: '#23634e' }}>(✓ preenchido)</span>}
          </label>
          <input
            type="text"
            name="cep"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="12200-000"
            maxLength={9}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Endereço</label>
          <input
            type="text"
            name="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua / Avenida"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Nº Endereço</label>
          <input type="text" name="numero_endereco" placeholder="Número e compl." style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Bairro</label>
          <input
            type="text"
            name="bairro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Cidade</label>
          <input
            type="text"
            name="cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            style={inputStyle}
          />
        </div>

        {/* DADOS DA EMPRESA E TURNO */}
        <div>
          <label style={labelStyle}>Empresa que trabalha</label>
          <input type="text" name="empresa" placeholder="Empresa que trabalha" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Cargo</label>
          <input type="text" name="cargo" placeholder="Cargo" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Setor ou Área</label>
          <input type="text" name="setor" placeholder="Setor ou Área" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Selecione o turno</label>
          <select name="turno" style={inputStyle}>
            <option value="1º Turno">1º Turno</option>
            <option value="2º Turno">2º Turno</option>
            <option value="3º Turno">3º Turno</option>
            <option value="Administrativo">Administrativo</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Telefone da empresa ou Ramal</label>
          <input type="text" name="telefone_empresa" placeholder="Telefone da empresa ou Ramal" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Número de dependentes até 18 anos</label>
          <select name="numero_dependentes" style={inputStyle}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Essa seria a 2ª via de sua carteirinha? <span style={{ color: '#861e32' }}>*</span></label>
          <select name="tipo_via" style={inputStyle}>
            <option value="primeira_via">Não (1ª Via)</option>
            <option value="segunda_via">Sim (2ª Via)</option>
            <option value="renovacao">Renovação / Atualização</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Foto 3x4 para a carteirinha (opcional, máx 5MB — JPG, PNG ou WebP)</label>
          <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" style={{ ...inputStyle, padding: '8px' }} />
          <small style={{ color: '#71636a', fontSize: '12px' }}>Foto nítida de rosto com fundo neutro.</small>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Observações ou nomes de dependentes</label>
          <textarea name="observacoes" rows={3} placeholder="Escreva observações adicionais ou nomes dos dependentes" style={{ ...inputStyle, resize: 'vertical' }} />
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
