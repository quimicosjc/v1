'use client'

import { useState, useTransition } from 'react'
import type { UsuarioAdmin } from '@/app/admin/usuarios/actions'
import {
  criarUsuario,
  atualizarUsuario,
  redefinirSenha,
  excluirUsuario,
} from '@/app/admin/usuarios/actions'

interface Props {
  usuariosIniciais: UsuarioAdmin[]
  usuarioLogado: { id: string; nome: string; papel: string }
}

const AREAS = [
  { id: 'noticias',    label: 'Notícias' },
  { id: 'jornais',     label: 'Jornais (Boca no Trombone)' },
  { id: 'paginas',     label: 'Páginas do site' },
  { id: 'solicitacoes', label: 'Solicitações (Sindicalizações, Carteirinhas)' },
  { id: 'inscricoes',  label: 'Cadastro para notícias' },
]

const ACOES = [
  { id: 'consultar', label: 'Consultar' },
  { id: 'criar',     label: 'Criar' },
  { id: 'editar',    label: 'Editar' },
  { id: 'publicar',  label: 'Publicar' },
  { id: 'excluir',   label: 'Excluir' },
]

export default function UsuariosGerenciador({ usuariosIniciais, usuarioLogado }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>(usuariosIniciais)
  const [selecionadoId, setSelecionadoId] = useState<string>(
    usuariosIniciais[0]?.id || ''
  )
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  // Modais
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSenhaModal, setShowSenhaModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Estado do formulário de novo usuário
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoPapel, setNovoPapel] = useState<'operador' | 'gestor' | 'admin_ti'>('operador')
  const [novoPodeDenuncias, setNovoPodeDenuncias] = useState(false)

  // Estado de redefinição de senha
  const [senhaRedefinir, setSenhaRedefinir] = useState('')

  const usuarioSelecionado = usuarios.find((u) => u.id === selecionadoId) || usuarios[0]

  // Parse das permissões do usuário selecionado
  const [permissoesLocais, setPermissoesLocais] = useState<Record<string, string[]>>(() => {
    if (usuarioSelecionado?.permissoes_json) {
      try {
        return JSON.parse(usuarioSelecionado.permissoes_json)
      } catch {
        return {}
      }
    }
    return {}
  })

  const [ativoLocal, setAtivoLocal] = useState<boolean>(usuarioSelecionado?.ativo ?? true)
  const [papelLocal, setPapelLocal] = useState<'operador' | 'gestor' | 'admin_ti'>(
    usuarioSelecionado?.papel ?? 'operador'
  )
  const [podeDenunciasLocal, setPodeDenunciasLocal] = useState<boolean>(
    usuarioSelecionado?.pode_denuncias ?? false
  )

  function selecionarUsuario(u: UsuarioAdmin) {
    setSelecionadoId(u.id)
    setAtivoLocal(u.ativo)
    setPapelLocal(u.papel)
    setPodeDenunciasLocal(u.pode_denuncias)
    if (u.permissoes_json) {
      try {
        setPermissoesLocais(JSON.parse(u.permissoes_json))
      } catch {
        setPermissoesLocais({})
      }
    } else {
      setPermissoesLocais({})
    }
  }

  function showFeedback(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  function togglePermissao(area: string, acao: string) {
    setPermissoesLocais((prev) => {
      const atuais = prev[area] || []
      const existe = atuais.includes(acao)
      const novoArray = existe ? atuais.filter((a) => a !== acao) : [...atuais, acao]
      return { ...prev, [area]: novoArray }
    })
  }

  // Ações de formulário
  function handleSalvarAlteracoes() {
    if (!usuarioSelecionado) return
    startTransition(async () => {
      const res = await atualizarUsuario(usuarioSelecionado.id, {
        ativo: ativoLocal,
        papel: papelLocal,
        pode_denuncias: podeDenunciasLocal,
        permissoes_json: JSON.stringify(permissoesLocais),
      })

      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioSelecionado.id
              ? {
                  ...u,
                  ativo: ativoLocal,
                  papel: papelLocal,
                  pode_denuncias: podeDenunciasLocal,
                  permissoes_json: JSON.stringify(permissoesLocais),
                }
              : u
          )
        )
        showFeedback('Permissões e dados do usuário atualizados com sucesso!')
      }
    })
  }

  function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await criarUsuario({
        nome: novoNome,
        email: novoEmail,
        senha: novaSenha,
        papel: novoPapel,
        pode_denuncias: novoPodeDenuncias,
        permissoes: {
          noticias: ['consultar', 'criar', 'editar'],
          jornais: ['consultar'],
        },
      })

      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        showFeedback(`Usuário ${novoNome} cadastrado com sucesso!`)
        setShowAddModal(false)
        setNovoNome('')
        setNovoEmail('')
        setNovaSenha('')
        setNovoPapel('operador')
        setNovoPodeDenuncias(false)

        if (res.id) {
          const novoUser: UsuarioAdmin = {
            id: res.id,
            auth_user_id: res.id,
            nome: novoNome,
            email: novoEmail.trim().toLowerCase(),
            papel: novoPapel,
            ativo: true,
            e_principal: false,
            pode_denuncias: novoPodeDenuncias,
            permissoes_json: JSON.stringify({
              noticias: ['consultar', 'criar', 'editar'],
              jornais: ['consultar'],
            }),
            criado_em: new Date().toISOString(),
          }
          setUsuarios((prev) => [...prev, novoUser])
          selecionarUsuario(novoUser)
        }
      }
    })
  }

  function handleRedefinirSenha() {
    if (!usuarioSelecionado || !senhaRedefinir) return
    startTransition(async () => {
      const res = await redefinirSenha(usuarioSelecionado.id, senhaRedefinir)
      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        const isSelf = usuarioSelecionado.e_principal || usuarioSelecionado.id === usuarioLogado.id
        showFeedback(isSelf ? 'Sua senha foi alterada com sucesso!' : 'Senha alterada com sucesso!')
        setShowSenhaModal(false)
        setSenhaRedefinir('')
      }
    })
  }

  function handleExcluirUsuario() {
    if (!usuarioSelecionado) return
    startTransition(async () => {
      const res = await excluirUsuario(usuarioSelecionado.id)
      if ('error' in res) {
        showFeedback(res.error, 'erro')
      } else {
        showFeedback(`Usuário ${usuarioSelecionado.nome} excluído.`)
        setShowDeleteModal(false)
        const restantes = usuarios.filter((u) => u.id !== usuarioSelecionado.id)
        setUsuarios(restantes)
        if (restantes[0]) selecionarUsuario(restantes[0])
      }
    })
  }

  // Estilos padronizados (Protótipo v9)
  const cardStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e4dce0',
    borderRadius: '8px',
    padding: '24px',
  }

  const btnPrimario: React.CSSProperties = {
    background: '#861e32',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const btnNeutro: React.CSSProperties = {
    border: '1px solid #ced9df',
    background: 'white',
    color: '#30252a',
    borderRadius: '5px',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #cbd7de',
    borderRadius: '5px',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#30252a',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#30252a',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── Topo do módulo ──────────────────────────────────────────────── */}
      <div
        className="usuarios-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#861e32',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Configurações do Sistema
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
            Usuários e permissões
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#71636a' }}>
            Acesso por área e ação, com proteção especial para o administrador principal.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} style={btnPrimario}>
          ＋ Adicionar usuário
        </button>
      </div>

      {/* ── Grid Principal: 2 Colunas ───────────────────────────────────── */}
      <div className="usuarios-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Coluna Esquerda: Lista de Usuários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#71636a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Usuários cadastrados ({usuarios.length})
          </div>

          {usuarios.map((u) => {
            const isSelected = u.id === usuarioSelecionado?.id
            return (
              <div
                key={u.id}
                onClick={() => selecionarUsuario(u)}
                style={{
                  background: isSelected ? '#ffffff' : '#fcfbfa',
                  border: isSelected ? '2px solid #861e32' : '1px solid #e4dce0',
                  borderRadius: '8px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(134,30,50,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#30252a' }}>
                    {u.nome}
                  </div>
                  {u.e_principal ? (
                    <span
                      style={{
                        background: '#fff2df',
                        color: '#825914',
                        border: '1px solid #f6deb3',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      ★ Principal
                    </span>
                  ) : u.ativo ? (
                    <span
                      style={{
                        background: '#e9f3ef',
                        color: '#23634e',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      Ativo
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#f0f0f0',
                        color: '#777',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      Inativo
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: '#71636a', marginBottom: '8px' }}>
                  {u.email}
                </div>

                <div style={{ fontSize: '12px', color: '#861e32', fontWeight: 600 }}>
                  {u.papel === 'admin_ti' ? 'Administrador' : u.papel === 'gestor' ? 'Gestor' : 'Operador'}
                  {u.pode_denuncias && ' • Acesso a denúncias'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Coluna Direita: Detalhes e Matriz de Permissões */}
        {usuarioSelecionado ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Cartão de Identificação do Usuário */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#30252a', margin: '0 0 4px 0' }}>
                    {usuarioSelecionado.nome}
                  </h2>
                  <div style={{ fontSize: '14px', color: '#71636a' }}>
                    {usuarioSelecionado.email}
                  </div>
                </div>

                {usuarioSelecionado.e_principal ? (
                  <button
                    type="button"
                    onClick={() => setShowSenhaModal(true)}
                    style={btnPrimario}
                  >
                    🔑 Alterar minha senha
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowSenhaModal(true)}
                      style={btnNeutro}
                    >
                      Redefinir senha
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      style={{ ...btnNeutro, color: '#861e32', borderColor: '#e8c8ce' }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>

              {usuarioSelecionado.e_principal ? (
                <div
                  style={{
                    marginTop: '20px',
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                    borderTop: '1px solid #e4dce0',
                    paddingTop: '16px',
                    fontSize: '13px',
                    color: '#71636a',
                  }}
                >
                  <div><strong>Nível:</strong> Administrador Geral</div>
                  <div><strong>Situação:</strong> Ativo</div>
                  <div><strong>Denúncias:</strong> Acesso total liberado</div>
                </div>
              ) : (
                /* Configurações da Conta Normal */
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e4dce0', paddingTop: '20px' }}>
                  
                  {/* Status da Conta */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ativoLocal}
                      onChange={(e) => setAtivoLocal(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#861e32' }}
                    />
                    <span>Conta ativa (permite fazer login no painel)</span>
                  </label>

                  {/* Nível / Papel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Nível de acesso (Papel)</label>
                      <select
                        value={papelLocal}
                        onChange={(e) => setPapelLocal(e.target.value as 'operador' | 'gestor' | 'admin_ti')}
                        style={inputStyle}
                      >
                        <option value="operador">Operador (Acesso restrito às áreas permitidas)</option>
                        <option value="gestor">Gestor (Pode delegar acessos dentro do seu escopo)</option>
                        <option value="admin_ti">Administrador (Controle completo do sistema)</option>
                      </select>
                    </div>

                    {/* Acesso a Denúncias */}
                    <div>
                      <label style={labelStyle}>Denúncias (Sigilo Estrito)</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#30252a', height: '42px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={podeDenunciasLocal}
                          onChange={(e) => setPodeDenunciasLocal(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#861e32' }}
                        />
                        <span>Autorizar visualização de denúncias e anexos</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Matriz de Permissões por Seção */}
            {!usuarioSelecionado.e_principal && papelLocal !== 'admin_ti' && (
              <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#30252a', margin: '0 0 4px 0' }}>
                    Permissões por Área e Ação
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#71636a' }}>
                    Marque as ações que este usuário tem autorização para realizar.
                  </p>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e4dce0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f8fafb', borderBottom: '1px solid #e4dce0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#71636a' }}>
                          ÁREA DO PAINEL
                        </th>
                        {ACOES.map((acao) => (
                          <th
                            key={acao.id}
                            style={{
                              padding: '12px 12px',
                              fontWeight: 600,
                              color: acao.id === 'excluir' ? '#861e32' : '#71636a',
                            }}
                          >
                            <div>{acao.label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {AREAS.map((area, idx) => (
                        <tr
                          key={area.id}
                          style={{
                            borderBottom: idx === AREAS.length - 1 ? 'none' : '1px solid #e8eef1',
                            background: idx % 2 === 0 ? 'white' : '#fafbfc',
                          }}
                        >
                          <td style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#30252a' }}>
                            {area.label}
                          </td>
                          {ACOES.map((acao) => {
                            const isChecked = (permissoesLocais[area.id] || []).includes(acao.id)
                            return (
                              <td key={acao.id} style={{ padding: '14px 12px' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermissao(area.id, acao.id)}
                                  aria-label={`${acao.label} em ${area.label}`}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: '#861e32',
                                    cursor: 'pointer',
                                  }}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Botão de Salvar Permissões */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSalvarAlteracoes}
                    disabled={isPending}
                    style={{ ...btnPrimario, opacity: isPending ? 0.6 : 1 }}
                  >
                    {isPending ? 'Salvando…' : 'Salvar permissões'}
                  </button>
                </div>
              </div>
            )}

            {/* Salvar para quando o papel for alterado (ex: promovido para Admin) */}
            {!usuarioSelecionado.e_principal && papelLocal === 'admin_ti' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSalvarAlteracoes}
                  disabled={isPending}
                  style={{ ...btnPrimario, opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', color: '#71636a' }}>
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>

      {/* ── Modal: Adicionar Usuário ─────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
              Adicionar novo usuário
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#71636a' }}>
              Cadastre um membro da equipe para conceder acesso ao painel administrativo.
            </p>

            <form onSubmit={handleCriarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>E-mail de acesso *</label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="usuario@sindicato.org.br"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Senha inicial * (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Nível de acesso inicial</label>
                <select
                  value={novoPapel}
                  onChange={(e) => setNovoPapel(e.target.value as 'operador' | 'gestor' | 'admin_ti')}
                  style={inputStyle}
                >
                  <option value="operador">Operador (Acesso apenas às tarefas permitidas)</option>
                  <option value="gestor">Gestor (Pode delegar acessos)</option>
                  <option value="admin_ti">Administrador (Acesso total)</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={novoPodeDenuncias}
                  onChange={(e) => setNovoPodeDenuncias(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#861e32' }}
                />
                <span>Autorizar visualização de denúncias recebidas</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={btnNeutro}>
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} style={btnPrimario}>
                  {isPending ? 'Criando…' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Redefinir / Alterar Senha ─────────────────────────────── */}
      {showSenhaModal && usuarioSelecionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowSenhaModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '26px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#30252a', margin: '0 0 6px 0' }}>
              {usuarioSelecionado.e_principal || usuarioSelecionado.id === usuarioLogado.id
                ? 'Alterar minha senha de acesso'
                : `Redefinir senha de ${usuarioSelecionado.nome}`}
            </h2>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#71636a', lineHeight: 1.5 }}>
              {usuarioSelecionado.e_principal || usuarioSelecionado.id === usuarioLogado.id
                ? 'Digite sua nova senha de acesso ao painel. Ela terá validade imediata para os seus próximos acessos.'
                : 'Digite uma nova senha para este usuário. Ele utilizará essa senha no próximo login.'}
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Nova senha (mínimo 6 caracteres)</label>
              <input
                type="password"
                minLength={6}
                value={senhaRedefinir}
                onChange={(e) => setSenhaRedefinir(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowSenhaModal(false)} style={btnNeutro}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRedefinirSenha}
                disabled={isPending || senhaRedefinir.length < 6}
                style={{ ...btnPrimario, opacity: isPending || senhaRedefinir.length < 6 ? 0.6 : 1 }}
              >
                {isPending
                  ? 'Salvando…'
                  : usuarioSelecionado.e_principal || usuarioSelecionado.id === usuarioLogado.id
                  ? 'Salvar minha nova senha'
                  : 'Salvar nova senha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Excluir Usuário ───────────────────────────────────────── */}
      {showDeleteModal && usuarioSelecionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#861e32', margin: '0 0 8px 0' }}>
              Excluir conta de usuário?
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#30252a', lineHeight: 1.5 }}>
              Tem certeza de que deseja excluir o acesso de <strong>{usuarioSelecionado.nome}</strong> ({usuarioSelecionado.email})?
            </p>
            <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#71636a' }}>
              Esta ação revoga imediatamente todos os acessos do usuário ao painel.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} style={btnNeutro}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirUsuario}
                disabled={isPending}
                style={{ background: '#861e32', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast de Feedback ────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.tipo === 'erro' ? '#861e32' : '#183b4b',
            color: 'white',
            padding: '13px 23px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── ESTILOS RESPONSIVOS MOBILE DE USUÁRIOS ── */}
      <style>{`
        @media (max-width: 860px) {
          .usuarios-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .usuarios-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .usuarios-header button {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            min-height: 44px !important;
          }
          input, select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
