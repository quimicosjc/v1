'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CONTAINER_STYLE } from '@/lib/design'

interface HeaderPublicoProps {
  slugAtivo?: string
}

interface MenuItem {
  titulo: string
  subtitulo: string
  href: string
  icone: React.ReactNode
}

interface MenuGrupo {
  nome: string
  items: MenuItem[]
}

export default function HeaderPublico({ slugAtivo }: HeaderPublicoProps) {
  const [dropdownAtivo, setDropdownAtivo] = useState<string | null>(null)
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false)
  const [mobileAcordeon, setMobileAcordeon] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fecha menus ao mudar rota ou redimensionar
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 960) {
        setMobileMenuAberto(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleMouseEnter(grupo: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setDropdownAtivo(grupo)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setDropdownAtivo(null)
    }, 180)
  }

  // Grupos e itens conforme o Organograma do projeto (Sentence case e 'e' conforme M11-G)
  const menus: MenuGrupo[] = [
    {
      nome: 'Sindicato',
      items: [
        {
          titulo: 'Nossa história',
          subtitulo: '',
          href: '/paginas/historia',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          ),
        },
        {
          titulo: 'Diretoria eleita',
          subtitulo: '',
          href: '/paginas/diretoria',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
        },
        {
          titulo: 'Filie-se ao sindicato',
          subtitulo: '',
          href: '/paginas/fique-socio',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          ),
        },
        {
          titulo: 'Sedes e atendimento',
          subtitulo: '',
          href: '/paginas/fale-conosco',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          ),
        },
        {
          titulo: 'Links úteis',
          subtitulo: '',
          href: '/paginas/links-uteis',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          ),
        },
        {
          titulo: 'Política de privacidade',
          subtitulo: '',
          href: '/paginas/privacidade',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          ),
        },
      ],
    },
    {
      nome: 'Serviços',
      items: [
        {
          titulo: 'Colônia de férias',
          subtitulo: '',
          href: '/paginas/colonia',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
          ),
        },
        {
          titulo: 'Guia de convênios',
          subtitulo: '',
          href: '/paginas/convenios',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          ),
        },
        {
          titulo: 'Carteirinha do associado',
          subtitulo: '',
          href: '/paginas/carteirinha',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <circle cx="8" cy="10" r="2"/>
              <line x1="14" y1="9" x2="18" y2="9"/>
              <line x1="14" y1="13" x2="18" y2="13"/>
              <line x1="6" y1="16" x2="18" y2="16"/>
            </svg>
          ),
        },
        {
          titulo: 'Atualização cadastral',
          subtitulo: '',
          href: '/paginas/atualizar-cadastro',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          ),
        },
      ],
    },
    {
      nome: 'Jurídico',
      items: [
        {
          titulo: 'Convenções coletivas (CCT)',
          subtitulo: '',
          href: '/paginas/cct',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          ),
        },
        {
          titulo: 'Atendimento e plantão',
          subtitulo: '',
          href: '/paginas/juridico',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
              <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
              <path d="M7 21h10"/>
              <path d="M12 3v18"/>
            </svg>
          ),
        },
        {
          titulo: 'Processos coletivos',
          subtitulo: '',
          href: '/paginas/processos',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          ),
        },
        {
          titulo: 'Homologações',
          subtitulo: '',
          href: '/paginas/homologacoes',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          ),
        },
        {
          titulo: 'Canal de denúncias',
          subtitulo: '',
          href: '/paginas/denuncia',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ),
        },
      ],
    },
    {
      nome: 'Imprensa',
      items: [
        {
          titulo: 'Notícias e coberturas',
          subtitulo: '',
          href: '/noticias',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
              <path d="M18 14h-8"/>
              <path d="M15 18h-5"/>
              <path d="M10 6h8v4h-8V6Z"/>
            </svg>
          ),
        },
        {
          titulo: 'Jornal Boca no Trombone',
          subtitulo: '',
          href: '/jornais',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          ),
        },
        {
          titulo: 'Boletim por e-mail',
          subtitulo: '',
          href: '/paginas/cadastro-noticias',
          icone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          ),
        },
      ],
    },
  ]

  // Verifica se o link é o ativo
  function isGrupoAtivo(grupo: MenuGrupo): boolean {
    if (!slugAtivo) return false
    return grupo.items.some((item) => {
      const cleanHref = item.href.replace('/paginas/', '').replace('/', '')
      return cleanHref === slugAtivo || slugAtivo.startsWith(cleanHref)
    })
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        {/* ── 1. CABEÇALHO PRINCIPAL DE NAVEGAÇÃO ── */}
        <div
          style={{
            background: '#65172A',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              ...CONTAINER_STYLE,
              paddingTop: '6px',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
            className="header-main-bar"
          >
            {/* Bloco de Logos: Sindicato + Centrais (CSP-Conlutas e Unidos pra Lutar) integrados no topo conforme M11-H */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  flexShrink: 0,
                }}
                title="Sindicato dos Químicos de São José dos Campos e Região"
              >
                <div style={{ height: '104px', display: 'flex', alignItems: 'center' }} className="header-logo-container">
                  <img
                    src="/logo-sindicato.svg"
                    alt="Sindicato dos Químicos de São José dos Campos e Região"
                    style={{
                      height: '104px',
                      width: 'auto',
                      display: 'block',
                    }}
                    className="header-logo-img"
                  />
                </div>
              </Link>
            </div>


          {/* Navegação Desktop */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '8px',
            }}
            className="header-desktop-nav"
          >
            {/* Link Início */}
            <Link
              href="/"
              style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: (!slugAtivo || slugAtivo === '/' || slugAtivo === 'home') ? 700 : 500,
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                background: (!slugAtivo || slugAtivo === '/' || slugAtivo === 'home') ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              Início
            </Link>

            {/* Menus Dropdown (Organograma: Sindicato, Serviços, Jurídico, Imprensa) */}
            {menus.map((grupo) => {
              const ativo = isGrupoAtivo(grupo)
              const aberto = dropdownAtivo === grupo.nome

              return (
                <div
                  key={grupo.nome}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => handleMouseEnter(grupo.nome)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setDropdownAtivo(aberto ? null : grupo.nome)}
                    style={{
                      background: aberto || ativo ? 'rgba(255,255,255,0.14)' : 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: ativo ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{grupo.nome}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu Flutuante */}
                  {aberto && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        paddingTop: '8px',
                        zIndex: 110,
                        minWidth: '320px',
                      }}
                    >
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '10px',
                          boxShadow: '0 16px 48px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.06)',
                          padding: '10px',
                          display: 'grid',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 10px 4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            color: '#861e32',
                            borderBottom: '1px solid #f0e8ea',
                            marginBottom: '4px',
                          }}
                        >
                          {grupo.nome}
                        </div>

                        {grupo.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropdownAtivo(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '9px 12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#30252a',
                              transition: 'background 0.15s ease',
                            }}
                            className="dropdown-item"
                          >
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                background: '#f8f2f4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {item.icone}
                            </div>
                            <div
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 600,
                                color: '#30252a',
                                lineHeight: 1.3,
                              }}
                            >
                              {item.titulo}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Botão de Destaque Filie-se */}
            <Link
              href="/paginas/fique-socio"
              style={{
                marginLeft: '8px',
                background: '#861e32',
                color: '#ffffff',
                padding: '9px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(134,30,50,0.25)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              className="btn-filie-se"
            >
              <span>Sindicalize-se</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </nav>

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuAberto(!mobileMenuAberto)}
            aria-label="Abrir menu de navegação"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '8px 10px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="header-mobile-toggle"
          >
            {mobileMenuAberto ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. SUB-BARRA COM AS CENTRAIS (ABAIXO DO MENU PRINCIPAL) ── */}
      <div
        style={{
          background: '#48101e',
          borderBottom: '3px solid #861e32',
          padding: '12px 0',
        }}
        className="header-sub-bar"
      >
        <div
          style={{
            ...CONTAINER_STYLE,
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
          className="header-sub-bar-container"
        >
          <a
            href="https://www.instagram.com/unidospralutar/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              opacity: 0.95,
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            title="Unidos pra Lutar"
            className="header-affiliation-link"
          >
            <img
              src="/logo-unidos-pra-lutar-horizontal.png?v=branco"
              alt="Unidos pra Lutar"
              style={{
                height: '32px',
                width: 'auto',
                display: 'block',
              }}
            />
          </a>

          <a
            href="https://cspconlutas.org.br/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              opacity: 0.95,
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            title="CSP-Conlutas — Central Sindical e Popular"
            className="header-affiliation-link"
          >
            <img
              src="/logo-csp-conlutas-limpo.png"
              alt="CSP-Conlutas"
              style={{
                height: '30px',
                width: 'auto',
                display: 'block',
                borderRadius: '3px',
              }}
            />
          </a>
        </div>
      </div>

      {/* ── 3. MENU MOBILE DRAWER ── */}
      {mobileMenuAberto && (
        <div
          style={{
            background: '#581424',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 20px 24px 20px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'grid', gap: '4px' }}>
            <Link
                href="/"
                onClick={() => setMobileMenuAberto(false)}
                style={{
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'block',
                  lineHeight: 1.2,
                }}
              >
                Início
              </Link>

              {menus.map((grupo) => {
                const aberto = mobileAcordeon === grupo.nome

                return (
                  <div key={grupo.nome} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => setMobileAcordeon(aberto ? null : grupo.nome)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        padding: '8px 12px',
                        fontSize: '14.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontFamily: 'inherit',
                        lineHeight: 1.2,
                      }}
                    >
                      <span>{grupo.nome}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {aberto && (
                      <div style={{ padding: '0 6px 8px 10px', display: 'grid', gap: '3px' }}>
                        {grupo.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuAberto(false)}
                            style={{
                              color: 'rgba(255,255,255,0.9)',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              fontSize: '13px',
                              lineHeight: 1.25,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span style={{ filter: 'brightness(2)' }}>{item.icone}</span>
                            <span>{item.titulo}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <Link
                href="/paginas/fique-socio"
                onClick={() => setMobileMenuAberto(false)}
                style={{
                  marginTop: '8px',
                  background: '#861e32',
                  color: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  display: 'block',
                  lineHeight: 1.25,
                }}
              >
                Sindicalize-se agora
              </Link>

              {/* Logos de filiação também acessíveis no rodapé do menu mobile */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                }}
              >
                <a
                  href="https://www.instagram.com/unidospralutar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Unidos pra Lutar"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <img
                    src="/logo-unidos-pra-lutar-horizontal.png?v=branco"
                    alt="Unidos pra Lutar"
                    style={{ height: '28px', width: 'auto', display: 'block' }}
                  />
                </a>
                <a
                  href="https://cspconlutas.org.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="CSP-Conlutas — Central Sindical e Popular"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <img
                    src="/logo-csp-conlutas-limpo.png"
                    alt="CSP-Conlutas"
                    style={{ height: '26px', width: 'auto', display: 'block', borderRadius: '3px' }}
                  />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Estilos CSS Responsivos */}
      <style>{`
        @media (min-width: 960px) {
          .header-desktop-nav {
            display: flex !important;
          }
          .header-mobile-toggle {
            display: none !important;
          }
          .header-logo-container {
            width: 225px !important;
            height: 104px !important;
            overflow: visible !important;
          }
          .header-logo-img {
            height: 104px !important;
            transform: scale(1.32) !important;
            transform-origin: left center !important;
          }
        }
        @media (max-width: 600px) {
          .header-main-bar {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
          .header-logo-container {
            height: 92px !important;
            overflow: visible !important;
          }
          .header-logo-img {
            height: 90px !important;
            transform: scale(1.35) !important;
            transform-origin: left center !important;
          }
          .header-mobile-toggle {
            flex-shrink: 0 !important;
          }
          .header-sub-bar-container {
            justify-content: center !important;
          }
        }
        .dropdown-item:hover {
          background: #f8f4f5 !important;
        }
        .btn-filie-se:hover {
          background: #9c243c !important;
          transform: translateY(-1px);
        }
        .header-affiliation-link:hover {
          opacity: 1 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  )
}
