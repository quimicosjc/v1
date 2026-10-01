import Image from 'next/image'
import { logoutAction } from '@/app/admin/login/actions'

const papelLabel: Record<string, string> = {
  admin_ti: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
}

const menuItems = [
  { href: '/admin',                   label: 'Início' },
  { href: '/admin/noticias',          label: 'Notícias' },
  { href: '/admin/jornais',           label: 'Jornais' },
  { href: '/admin/paginas',           label: 'Páginas do site' },
  { href: '/admin/solicitacoes',      label: 'Solicitações' },
  { href: '/admin/inscricoes',        label: 'Cadastro para notícias' },
  { href: '/admin/usuarios',          label: 'Usuários e permissões' },
]

interface AdminLayoutProps {
  usuario: { nome: string; papel: string }
  breadcrumb: string
  activeHref?: string
  children: React.ReactNode
}

export default function AdminLayout({ usuario, breadcrumb, activeHref, children }: AdminLayoutProps) {
  const iniciais = usuario.nome
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#30252a',
        background: '#f7f5f6',
        minHeight: '100vh',
      }}
    >
      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        style={{
          position: 'fixed',
          width: '252px',
          height: '100vh',
          background: '#65172a',
          color: '#f6e7ec',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            background: '#65172a',
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '110px',
          }}
        >
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
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '1.5px',
            color: '#eed2dc',
            margin: '0 12px 15px',
            paddingTop: '8px',
          }}
        >
          PAINEL DE CONTROLE
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {menuItems.map((item) => {
            const isActive = activeHref
              ? item.href === activeHref
              : item.href === '/admin'
            return (
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
                  background: isActive ? '#8c2b40' : 'transparent',
                  boxShadow: isActive ? 'inset 3px 0 #ffc4cc' : 'none',
                }}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Rodapé da sidebar */}
        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid #a45569',
            padding: '18px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#9b4055',
              padding: '8px 10px',
              borderRadius: '50%',
              fontSize: '13px',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {iniciais}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href="/admin/usuarios"
              title="Gerenciar perfil e alterar senha"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {usuario.nome}
            </a>
            <small style={{ fontSize: '11px', color: '#eed2dc' }}>
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
        <header
          style={{
            height: '74px',
            background: 'white',
            borderBottom: '1px solid #e4dce0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            fontSize: '14px',
            color: '#71636a',
          }}
        >
          <span>
            Painel editorial{' '}
            <span style={{ color: '#c8b4bc', margin: '0 12px' }}>/</span>
            <span style={{ color: '#30252a', fontWeight: 600 }}>{breadcrumb}</span>
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
        <main style={{ maxWidth: '1400px', margin: 'auto', padding: '38px 40px 80px' }}>
          {children}
        </main>

        <footer
          style={{
            maxWidth: '1400px',
            margin: 'auto',
            padding: '10px 40px 25px',
            color: '#71636a',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px',
          }}
        >
          <span>Químicos · Painel de administração</span>
          <span>Versão 1.0</span>
        </footer>
      </div>
    </div>
  )
}
