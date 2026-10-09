'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { logoutAction } from '@/app/admin/login/actions'

const papelLabel: Record<string, string> = {
  admin_ti: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
}

const menuItems = [
  { href: '/admin',                   label: 'Início',                  icon: '🏠' },
  { href: '/admin/noticias',          label: 'Notícias',                icon: '📰' },
  { href: '/admin/jornais',           label: 'Jornais',                 icon: '📑' },
  { href: '/admin/homepage',          label: 'Homepage',                icon: '🏛️' },
  { href: '/admin/paginas',           label: 'Páginas do site',         icon: '📄' },
  { href: '/admin/solicitacoes',      label: 'Solicitações',            icon: '📥' },
  { href: '/admin/inscricoes',        label: 'Cadastro para notícias',  icon: '✉️' },
  { href: '/admin/avulsas',           label: 'Páginas avulsas',         icon: '🔗' },
  { href: '/admin/usuarios',          label: 'Usuários e permissões',   icon: '👥' },
]

interface AdminLayoutProps {
  usuario: { nome: string; papel: string }
  breadcrumb: string
  activeHref?: string
  pendentesCount?: number
  children: React.ReactNode
}

export default function AdminLayout({ usuario, breadcrumb, activeHref, pendentesCount, children }: AdminLayoutProps) {
  const [drawerAberto, setDrawerAberto] = useState(false)

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
      {/* ── BACKDROP ESCURO PARA O DRAWER MOBILE ───────────────────── */}
      {drawerAberto && (
        <div
          onClick={() => setDrawerAberto(false)}
          className="admin-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            zIndex: 998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── SIDEBAR (DESKTOP E DRAWER MOBILE) ─────────────────────── */}
      <aside
        className={`admin-sidebar ${drawerAberto ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '252px',
          height: '100vh',
          background: '#65172a',
          color: '#f6e7ec',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          zIndex: 999,
        }}
      >
        {/* Logo e Botão Fechar no Mobile */}
        <div style={{ position: 'relative' }}>
          <a
            href="/admin"
            title="Ir para o Início do Painel"
            style={{
              background: '#65172a',
              padding: '20px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '110px',
              textDecoration: 'none',
              cursor: 'pointer',
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
          </a>

          {/* Botão fechar drawer mobile */}
          <button
            type="button"
            onClick={() => setDrawerAberto(false)}
            className="admin-close-drawer-btn"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar menu"
          >
            ✕
          </button>
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
                onClick={() => setDrawerAberto(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.href === '/admin/solicitacoes' && pendentesCount && pendentesCount > 0 ? (
                  <span
                    style={{
                      background: '#ffc4cc',
                      color: '#65172a',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                    }}
                  >
                    {pendentesCount}
                  </span>
                ) : null}
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
      <div className="admin-shell" style={{ marginLeft: '252px' }}>
        {/* Barra de topo */}
        <header
          className="admin-header"
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
          {/* Botão Hambúrguer Mobile + Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setDrawerAberto(!drawerAberto)}
              className="admin-mobile-toggle"
              style={{
                background: '#f8fafb',
                border: '1px solid #cbd7de',
                borderRadius: '5px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#65172a',
                lineHeight: 1,
              }}
              title="Abrir menu"
            >
              ☰
            </button>

            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className="admin-breadcrumb-prefix">Painel editorial </span>
              <span style={{ color: '#c8b4bc', margin: '0 8px' }} className="admin-breadcrumb-sep">/</span>
              <span style={{ color: '#30252a', fontWeight: 600 }}>{breadcrumb}</span>
            </span>
          </div>

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
              fontSize: '13.5px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            Ver site ↗
          </a>
        </header>

        {/* Conteúdo */}
        <main className="admin-main" style={{ maxWidth: '1400px', margin: 'auto', padding: '38px 40px 80px' }}>
          {children}
        </main>

        <footer
          className="admin-footer"
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

      {/* ── BARRA INFERIOR DE POLEGAR (EXCLUSIVA MOBILE) ─────────── */}
      <nav
        className="admin-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: '#ffffff',
          borderTop: '1px solid #e4dce0',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 900,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <Link
          href="/admin/noticias"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: activeHref?.startsWith('/admin/noticias') && activeHref !== '/admin/noticias/nova' ? '#861e32' : '#71636a',
            fontSize: '11px',
            fontWeight: 600,
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '18px' }}>📰</span>
          <span>Notícias</span>
        </Link>

        <Link
          href="/admin/noticias/nova"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#861e32',
            fontSize: '11px',
            fontWeight: 700,
            gap: '2px',
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              background: '#861e32',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginTop: '-14px',
              boxShadow: '0 2px 8px rgba(134,30,50,0.3)',
            }}
          >
            ＋
          </span>
          <span>Criar</span>
        </Link>

        <Link
          href="/admin/homepage"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: activeHref === '/admin/homepage' ? '#861e32' : '#71636a',
            fontSize: '11px',
            fontWeight: 600,
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🏛️</span>
          <span>Home</span>
        </Link>

        <Link
          href="/admin/jornais"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: activeHref === '/admin/jornais' ? '#861e32' : '#71636a',
            fontSize: '11px',
            fontWeight: 600,
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '18px' }}>📑</span>
          <span>Jornais</span>
        </Link>

        <button
          type="button"
          onClick={() => setDrawerAberto(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: '#71636a',
            fontSize: '11px',
            fontWeight: 600,
            gap: '2px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span style={{ fontSize: '18px' }}>☰</span>
          <span>Menu</span>
        </button>
      </nav>

      {/* ── ESTILOS RESPONSIVOS SCOPED PARA O PAINEL ─────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            box-shadow: none;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.45) !important;
          }
          .admin-close-drawer-btn {
            display: inline-flex !important;
          }
          .admin-shell {
            margin-left: 0 !important;
          }
          .admin-header {
            padding: 0 16px !important;
            height: 60px !important;
          }
          .admin-breadcrumb-prefix, .admin-breadcrumb-sep {
            display: none !important;
          }
          .admin-main {
            padding: 20px 14px 90px !important;
          }
          .admin-footer {
            padding: 10px 14px 90px !important;
            flex-direction: column !important;
            gap: 4px !important;
          }
          .admin-mobile-toggle {
            display: inline-flex !important;
          }
          .admin-bottom-nav {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .admin-mobile-toggle {
            display: none !important;
          }
          .admin-bottom-nav {
            display: none !important;
          }
          .admin-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
