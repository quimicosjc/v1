import React from 'react'
import Link from 'next/link'

export default function FooterPublico() {
  return (
    <footer
      style={{
        background: '#241a20',
        color: '#ffffff',
        borderTop: '4px solid #861e32',
        padding: '48px 20px 28px 20px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ── GRID DE 4 COLUNAS ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Coluna 1: Identidade Institucional */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img
                src="/logo-sindicato.png"
                alt="Logo Sindicato dos Químicos"
                style={{ height: '42px', width: 'auto', display: 'block' }}
              />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  Sindicato dos Químicos
                </div>
                <div style={{ fontSize: '11px', color: '#cbd7de', opacity: 0.85 }}>
                  São José dos Campos e Região
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#e4dce0', opacity: 0.85, margin: '0 0 16px 0' }}>
              Fundado em 1963 na defesa intransigente dos direitos, saúde e conquistas dos trabalhadores das indústrias químicas, farmacêuticas e plásticas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="https://www.cspconlutas.org.br"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#f6e7ec',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 14 14"/>
                </svg>
                <span>Filiado à <strong>CSP-Conlutas</strong> ↗</span>
              </a>

              <a
                href="https://www.instagram.com/unidospralutar/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#f6e7ec',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 14 14"/>
                </svg>
                <span>Corrente <strong>Unidos pra Lutar</strong> ↗</span>
              </a>
            </div>
          </div>

          {/* Coluna 2: Sedes e Atendimento Regional */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '16px',
                borderBottom: '2px solid #861e32',
                display: 'inline-block',
                paddingBottom: '4px',
              }}
            >
              Sedes e Atendimento
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', lineHeight: 1.8 }}>
              <li style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  SJC (Sede Central)
                </div>
                <div style={{ color: '#cbd7de', fontSize: '12px', paddingLeft: '20px' }}>
                  Praça Carlos Gomes, 81 — Centro
                </div>
                <div style={{ color: '#cbd7de', fontSize: '12px', paddingLeft: '20px' }}>
                  <a href="tel:1239218177" style={{ color: '#f6e7ec', textDecoration: 'none' }}>
                    Tel: (12) 3921-8177
                  </a>
                </div>
              </li>

              <li style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Taubaté (Subsede)
                </div>
                <div style={{ color: '#cbd7de', fontSize: '12px', paddingLeft: '20px' }}>
                  <a href="tel:1236320932" style={{ color: '#f6e7ec', textDecoration: 'none' }}>
                    Tel: (12) 3632-0932
                  </a>
                </div>
              </li>

              <li style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Jacareí (Subsede)
                </div>
                <div style={{ color: '#cbd7de', fontSize: '12px', paddingLeft: '20px' }}>
                  <a href="tel:1239533277" style={{ color: '#f6e7ec', textDecoration: 'none' }}>
                    Tel: (12) 3953-3277
                  </a>
                </div>
              </li>

              <li>
                <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#861e32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Caçapava (Subsede)
                </div>
                <div style={{ color: '#cbd7de', fontSize: '12px', paddingLeft: '20px' }}>
                  <a href="tel:1236556044" style={{ color: '#f6e7ec', textDecoration: 'none' }}>
                    Tel: (12) 3655-6044
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Sindicato & Jurídico */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '16px',
                borderBottom: '2px solid #861e32',
                display: 'inline-block',
                paddingBottom: '4px',
              }}
            >
              Sindicato & Jurídico
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', lineHeight: 1.9 }}>
              <li>
                <Link href="/paginas/historia" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Nossa História
                </Link>
              </li>
              <li>
                <Link href="/paginas/diretoria" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Diretoria Colegiada
                </Link>
              </li>
              <li>
                <Link href="/paginas/cct" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Convenções Coletivas (CCT)
                </Link>
              </li>
              <li>
                <Link href="/paginas/juridico" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Plantão e Atendimento Jurídico
                </Link>
              </li>
              <li>
                <Link href="/paginas/fique-socio" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Filie-se ao Sindicato
                </Link>
              </li>
              <li>
                <Link href="/paginas/denuncia" style={{ color: '#fca5a5', textDecoration: 'none', fontWeight: 600 }} className="footer-link">
                  Canal de Denúncias Seguras
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Serviços & Comunicação */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '16px',
                borderBottom: '2px solid #861e32',
                display: 'inline-block',
                paddingBottom: '4px',
              }}
            >
              Serviços & Imprensa
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', lineHeight: 1.9 }}>
              <li>
                <Link href="/paginas/colonia" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Colônia de Férias (Caraguá / S. Sebastião)
                </Link>
              </li>
              <li>
                <Link href="/paginas/convenios" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Guia de Convênios & Benefícios
                </Link>
              </li>
              <li>
                <Link href="/paginas/carteirinha" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Carteirinha do Associado
                </Link>
              </li>
              <li>
                <Link href="/noticias" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Notícias da Categoria
                </Link>
              </li>
              <li>
                <Link href="/jornais" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Jornal Boca no Trombone (PDFs)
                </Link>
              </li>
              <li>
                <Link href="/paginas/privacidade" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} className="footer-link">
                  Política de Privacidade & LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── BARRA INFERIOR DE DIREITOS E CRÉDITOS ── */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: '#cbd7de',
            opacity: 0.85,
          }}
        >
          <div>
            © {new Date().getFullYear()} Sindicato dos Químicos de São José dos Campos e Região. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>E-mail: contato@quimicosjc.org.br</span>
            <span>•</span>
            <Link href="/paginas/privacidade" style={{ color: '#cbd7de', textDecoration: 'none' }}>
              Transparência & Privacidade
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link:hover {
          color: #ffffff !important;
          text-decoration: underline !important;
        }
      `}</style>
    </footer>
  )
}
