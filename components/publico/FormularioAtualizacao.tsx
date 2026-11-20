'use client'

import React, { useState } from 'react'
import { submeterAtualizacaoCadastral } from '@/app/formularios/actions'
import {
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  buscarEnderecoPorCEP,
} from '@/lib/masks-viacep'

export default function FormularioAtualizacao() {
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
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#23634e', margin: '0 0 10px 0' }}>
          Atualização Cadastral Recebida!
        </h2>
        <p style={{ fontSize: '15px', color: '#30252a', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px auto' }}>
          Seus dados atualizados foram registrados em nosso sistema. Obrigado por manter seu cadastro de sócio em dia!
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
          Atualizar Cadastro de Sócio
        </h3>
        <p style={{ fontSize: '13.5px', color: '#71636a', margin: '4px 0 0 0' }}>
          Preencha os campos abaixo corretamente para atualizar seus dados junto ao Sindicato.
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

      {/* BLOCO 1: DADOS PESSOAIS */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        1. Dados Pessoais
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nome completo <span style={{ color: '#861e32' }}>*</span></label>
          <input type="text" name="nome" required placeholder="Nome completo" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Conhecido por (Apelido se houver)</label>
          <input type="text" name="apelido" placeholder="Apelido se houver" style={inputStyle} />
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
          <label style={labelStyle}>R.G. (Com dígito se houver)</label>
          <input type="text" name="rg" placeholder="R.G (Com dígito se houver)" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Nº da Carteira de Trabalho (CTPS - Nº, Série e Estado)</label>
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
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #e4dce0', paddingTop: '18px' }}>
        2. Endereço Residencial {buscandoCep && <span style={{ fontSize: '12px', color: '#861e32' }}>(Buscando CEP...)</span>}
        {!buscandoCep && cepAutomatico && <span style={{ fontSize: '12px', color: '#23634e' }}>(✓ Preenchido via CEP)</span>}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div>
          <label style={labelStyle}>CEP</label>
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
          <label style={labelStyle}>Endereço Residencial</label>
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
      </div>

      {/* BLOCO 3: DADOS PROFISSIONAIS E SITUAÇÃO */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#30252a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #e4dce0', paddingTop: '18px' }}>
        3. Dados da Empresa e Situação do Associado
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Empresa que trabalha</label>
          <input type="text" name="empresa" placeholder="Empresa onde trabalha atualmente" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Setor ou Área</label>
          <input type="text" name="setor" placeholder="Setor ou Área" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Cargo</label>
          <input type="text" name="cargo" placeholder="Cargo" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Crachá / Chapa / Matrícula</label>
          <input type="text" name="matricula_empresa" placeholder="Crachá / Chapa" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Data de Admissão</label>
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
          <label style={labelStyle}>Ramal do seu setor</label>
          <input type="text" name="ramal" placeholder="Ramal" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Aposentado?</label>
          <select name="aposentado" style={inputStyle}>
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Já possui carteirinha?</label>
          <select name="possui_carteirinha" style={inputStyle}>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Outras informações ou observações</label>
          <textarea name="alteracoes" rows={2} placeholder="Descreva observações adicionais se necessário" style={{ ...inputStyle, resize: 'vertical' }} />
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
          {enviando ? 'Enviando...' : 'Enviar dados para atualização →'}
        </button>
      </div>
    </form>
  )
}
