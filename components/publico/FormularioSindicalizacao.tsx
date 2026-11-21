'use client'

import React, { useState } from 'react'
import { submeterSindicalizacao } from '@/app/formularios/actions'
import {
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  buscarEnderecoPorCEP,
} from '@/lib/masks-viacep'

export default function FormularioSindicalizacao() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [telefoneResidencial, setTelefoneResidencial] = useState('')
  const [telefoneEmpresa, setTelefoneEmpresa] = useState('')
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
        <h2 style={{ fontFamily: 'var(--font-condensed), sans-serif', fontSize: '26px', fontWeight: 800, color: '#23634e', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
          Ficha de Sindicalização Enviada!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 16px auto' }}>
          Após o envio desse formulário você deverá aguardar até ser enviada a sua carteirinha pelo WhatsApp que você indicou. Caso não receba a sua carteirinha em até <strong>5 dias úteis</strong>, pedimos a gentileza de entrar em contato no telefone/WhatsApp:{' '}
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
            {copiado ? 'Protocolo copiado!' : 'Copiar protocolo'}
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#71636a', margin: 0 }}>
          Setor de Carteirinhas: <strong>(12) 99726-0926</strong> • Sede Central: <strong>(12) 3921-8177</strong>
        </p>
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
        borderTop: '4px solid #861e32',
        borderRadius: '8px',
        padding: '28px 32px',
        marginTop: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
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
      <h4 style={{ fontFamily: 'var(--font-condensed), sans-serif', fontSize: '18px', fontWeight: 800, color: '#65172A', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        1. Dados Pessoais
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ gridColumn: 'span 2' }} className="form-sind-col-span-2">
          <label style={labelStyle}>Nome completo (sem abreviação) <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Seu nome completo (Sem abreviação)" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Conhecido por (Apelido se houver)</label>
          <input type="text" name="apelido" placeholder="Apelido na fábrica (se houver)" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>CPF <span style={{ color: '#861e32' }}>*</span></label>
          <input
            type="text"
            name="cpf"
            required
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>R.G. (Com dígito se houver)</label>
          <input type="text" name="rg" placeholder="Número do RG" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Nº da Carteira de Trabalho (CTPS - Nº, Série e UF)</label>
          <input type="text" name="ctps" placeholder="Ex: 123456 / Série 001 / SP" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Data de Nascimento</label>
          <input type="date" name="data_nascimento" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Estado Civil</label>
          <select name="estado_civil" style={inputStyle}>
            <option value="Solteiro(a)">Solteiro(a)</option>
            <option value="Casado(a)">Casado(a)</option>
            <option value="Separado(a)">Separado(a)</option>
            <option value="Divorciado(a)">Divorciado(a)</option>
            <option value="Viúvo(a)">Viúvo(a)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Nº de dependentes (Filhos até 18 anos)</label>
          <select name="numero_dependentes" style={inputStyle}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={String(n)}>
                Tenho ({n}) Filho(s) até os 18 anos
              </option>
            ))}
          </select>
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
      </div>

      {/* BLOCO 2: ENDEREÇO RESIDENCIAL (COM VIACEP AUTOMÁTICO) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid #e4dce0', paddingTop: '18px', marginBottom: '14px' }}>
        <h4 style={{ fontFamily: 'var(--font-condensed), sans-serif', fontSize: '18px', fontWeight: 800, color: '#65172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          2. Endereço Residencial
        </h4>
        {buscandoCep && (
          <span style={{ fontSize: '12px', color: '#861e32', fontWeight: 600 }}>
            Buscando endereço pelo CEP...
          </span>
        )}
        {!buscandoCep && cepAutomatico && (
          <span style={{ fontSize: '12px', color: '#23634e', fontWeight: 600 }}>
            ✓ Endereço preenchido automaticamente via CEP
          </span>
        )}
      </div>
      <div className="form-sind-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div>
          <label style={labelStyle}>CEP (preenche endereço)</label>
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
        <div className="form-sind-col-span-2" style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Endereço Residencial (Rua / Av.)</label>
          <input
            type="text"
            name="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Ex: Rua das Flores"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Nº do Endereço / Compl.</label>
          <input type="text" name="numero_endereco" placeholder="Ex: 123, Apto 4" style={inputStyle} />
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
            placeholder="São José dos Campos"
            style={inputStyle}
          />
        </div>
      </div>

      {/* BLOCO 3: DADOS PROFISSIONAIS */}
      <h4 style={{ fontFamily: 'var(--font-condensed), sans-serif', fontSize: '18px', fontWeight: 800, color: '#65172A', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.4px', borderTop: '1px solid #e4dce0', paddingTop: '18px' }}>
        3. Dados da Empresa
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={labelStyle}>Empresa que trabalha <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="empresa" required placeholder="Nome da empresa química, plástica ou farmacêutica" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Setor atual</label>
          <input type="text" name="setor" placeholder="Setor ou área onde trabalha" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Função / Cargo</label>
          <input type="text" name="funcao" placeholder="Ex: Operador de Produção" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Crachá, Chapa, WWID ou Nº de Registro</label>
          <input type="text" name="matricula_empresa" placeholder="Registro na empresa" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Data de Admissão na Empresa</label>
          <input type="date" name="data_admissao" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Selecione o turno que trabalha</label>
          <select name="turno" style={inputStyle}>
            <option value="1º Turno">1º Turno</option>
            <option value="2º Turno">2º Turno</option>
            <option value="3º Turno">3º Turno</option>
            <option value="Administrativo">Administrativo</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Telefone da Empresa</label>
          <input
            type="tel"
            name="telefone_empresa"
            value={telefoneEmpresa}
            onChange={(e) => setTelefoneEmpresa(formatarTelefone(e.target.value))}
            placeholder="(12) 3900-0000"
            maxLength={15}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Ramal do setor onde trabalha</label>
          <input type="text" name="ramal" placeholder="Ramal (se houver)" style={inputStyle} />
        </div>
      </div>

      {/* BLOCO 4: AUTORIZAÇÃO E AVISO OFICIAL DA CARTEIRINHA */}
      <div style={{ background: '#f8fafb', border: '1px solid #cbd7de', borderRadius: '6px', padding: '16px 18px', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', fontSize: '13.5px', lineHeight: 1.5, color: '#30252a' }}>
          <input type="checkbox" name="autorizacao" value="true" required style={{ marginTop: '3px', width: '17px', height: '17px', flexShrink: 0 }} />
          <span>
            <strong>Autorizo meu cadastro como sócio e concordo com a Contribuição mensal de 1% conforme Art. 545 da CLT</strong> <span style={{ color: '#861e32' }}>*</span>
          </span>
        </label>
      </div>

      <div
        style={{
          background: '#fff9ea',
          border: '1px solid #f3d489',
          borderRadius: '6px',
          padding: '14px 18px',
          marginBottom: '24px',
          fontSize: '13.5px',
          color: '#5a3d0a',
          lineHeight: 1.55,
        }}
      >
        <strong>Importante:</strong> A Contribuição Sindical mensal para sócio é de <strong>1% do Salário</strong>. Após o envio desse formulário você deverá aguardar até ser enviada a sua carteirinha pelo WhatsApp que você indicou. Caso não receba a sua carteirinha em até <strong>5 dias úteis</strong>, pedimos a gentileza de entrar em contato no telefone/WhatsApp:{' '}
        <a
          href="https://wa.me/5512997260926"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#861e32', fontWeight: 800, textDecoration: 'underline' }}
        >
          (12) 99726-0926
        </a>.
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
            borderRadius: '6px',
            padding: '13px 28px',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            cursor: enviando ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar Sindicalização →'}
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .form-sind-grid {
            grid-template-columns: 1fr !important;
          }
          .form-sind-col-span-2 {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </form>
  )
}
