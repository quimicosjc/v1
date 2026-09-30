import { Metadata } from 'next'
import Image from 'next/image'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import { logoutAction } from '@/app/admin/login/actions'

export const metadata: Metadata = {
  title: 'Painel de Controle — Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

const papelLabel: Record<string, string> = {
  admin_ti: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
}

const menuItems = [
  { href: '#inicio',      label: 'Início' },
  { href: '#noticias',    label: 'Notícias' },
  { href: '#jornais',     label: 'Jornais' },
  { href: '#paginas',     label: 'Páginas do site' },
  { href: '#solicitacoes',label: 'Solicitações' },
  { href: '#inscricoes',  label: 'Cadastro para notícias' },
  { href: '#usuarios',    label: 'Usuários e permissões' },
]

export default async function AdminPage() {
  const usuario = await getUsuarioLogado()
  const iniciais = usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#30252a' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{
        position: 'fixed',
        width: '252px',
        height: '100vh',
        background: '#65172a',
        color: '#f6e7ec',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          background: '#65172a',
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '110px',
        }}>
          <Image
            src="/logo-sindicato.png"
            alt="Sindicato dos Químicos de São José dos Campos e Região"
            width={200}
            height={90}
            style={{ objectFit: 'contain', width: '100%', maxHeight: '90px' }}
            priority
          />
        </div>

        {/* Rótulo */}
        <div style={{
          fontSize: '12px',
          letterSpacing: '1.5px',
          color: '#eed2dc',
          margin: '0 12px 15px',
          paddingTop: '8px',
        }}>
          PAINEL DE CONTROLE
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {menuItems.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                gap: '15px',
                padding: '10px 13px',
                color: '#f6e7ec',
                borderRadius: '6px',
                margin: '3px 0',
                textDecoration: 'none',
                fontSize: '14px',
                background: i === 0 ? '#8c2b40' : 'transparent',
                boxShadow: i === 0 ? 'inset 3px 0 #ffc4cc' : 'none',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Rodapé da sidebar */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid #a45569',
          padding: '18px 16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          <div style={{
            background: '#9b4055',
            padding: '8px 10px',
            borderRadius: '50%',
            fontSize: '13px',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {iniciais}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario.nome}
            </div>
            <small style={{ fontSize: '11px', color: '#9bb2bf' }}>
              {papelLabel[usuario.papel] ?? usuario.papel}
            </small>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sair do painel"
              style={{
                border: '1px solid #a45569',
                background: 'transparent',
                color: '#eed2dc',
                borderRadius: '5px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── SHELL (conteúdo principal) ───────────────────────────── */}
      <div style={{ marginLeft: '252px' }}>

        {/* Barra de topo */}
        <header style={{
          height: '74px',
          background: 'white',
          borderBottom: '1px solid #e4dce0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          fontSize: '14px',
          color: '#71636a',
        }}>
          <span>
            Painel editorial <span style={{ color: '#c8b4bc', margin: '0 12px' }}>/</span>
            <span style={{ color: '#30252a', fontWeight: 600 }}>Início</span>
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: '1px solid #dce4e8',
              background: 'white',
              color: '#30252a',
              borderRadius: '5px',
              padding: '8px 14px',
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Ver site ↗
          </a>
        </header>

        {/* Conteúdo */}
        <main style={{ maxWidth: '1400px', margin: 'auto', padding: '38px 40px 55px' }}>

          <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '6px 0 8px' }}>
            INÍCIO
          </p>
          <h1 style={{ fontSize: '30px', lineHeight: '1.2', letterSpacing: '-0.8px', margin: '0 0 8px', color: '#30252a' }}>
            Olá, {usuario.nome.split(' ')[0]}!
          </h1>
          <p style={{ color: '#71636a', margin: '0 0 30px', fontSize: '15px' }}>
            Bem-vindo ao painel de controle editorial do Sindicato dos Químicos de SJC e Região.
          </p>

          {/* Cards de acesso rápido */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '40px' }}>
            {[
              { label: 'Publicar notícia', desc: 'Escreva e publique uma nova notícia no portal', href: '#noticias' },
              { label: 'Ver solicitações', desc: 'Mensagens, denúncias e contatos recebidos', href: '#solicitacoes' },
              { label: 'Upload de jornal', desc: 'Adicione uma nova edição do jornal O Químico', href: '#jornais' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '18px',
                  border: '1px solid #e4dce0',
                  background: 'white',
                  borderRadius: '6px',
                  color: '#30252a',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>{item.label}</strong>
                <small style={{ fontSize: '13px', color: '#71636a' }}>{item.desc}</small>
              </a>
            ))}
          </div>

          {/* Aviso de módulos em construção */}
          <div style={{
            padding: '16px 20px',
            borderLeft: '3px solid #861e32',
            background: '#fff0f3',
            fontSize: '14px',
            color: '#65172a',
            borderRadius: '0 4px 4px 0',
          }}>
            <strong>Painel em estruturação.</strong> Os módulos de Notícias, Jornais, Formulários e Usuários serão ativados progressivamente nas próximas etapas do desenvolvimento.
          </div>
        </main>

        <footer style={{
          maxWidth: '1400px',
          margin: 'auto',
          padding: '10px 40px 25px',
          color: '#71636a',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '15px',
        }}>
          <span>Químicos · Painel de administração</span>
          <span>Versão 1.0</span>
        </footer>
      </div>
    </div>
  )
}
