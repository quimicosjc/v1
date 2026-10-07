import React from 'react'
import Link from 'next/link'

export default function FooterPublico() {
  return (
    <footer
      style={{
        background: '#30252a',
        color: '#ffffff',
        borderTop: '4px solid #861e32',
        padding: '38px 20px 24px 20px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '28px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Sindicato dos Químicos
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.82, margin: 0 }}>
              Sindicato dos Trabalhadores nas Indústrias Químicas e Farmacêuticas de São José dos Campos e Região.
            </p>
            <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
              Filiado à CSP-Conlutas
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>
              Sedes e Atendimento
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', lineHeight: 1.7, opacity: 0.88 }}>
              <li>📍 <strong>SJC (Sede Central):</strong> Praça Carlos Gomes, 81 — (12) 3921-8177</li>
              <li>📍 <strong>Taubaté:</strong> (12) 3632-0932</li>
              <li>📍 <strong>Jacareí:</strong> (12) 3953-3277</li>
              <li>📍 <strong>Caçapava:</strong> (12) 3655-6044</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>
              Acesso Rápido
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', lineHeight: 1.7 }}>
              <li>
                <Link href="/paginas/historia" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Nossa História
                </Link>
              </li>
              <li>
                <Link href="/paginas/diretoria" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Diretoria Eleita
                </Link>
              </li>
              <li>
                <Link href="/paginas/cct" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Convenções Coletivas (CCT)
                </Link>
              </li>
              <li>
                <Link href="/paginas/fique-socio" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Filie-se ao Sindicato
                </Link>
              </li>
              <li>
                <Link href="/paginas/denuncia" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Canal de Denúncias
                </Link>
              </li>
              <li>
                <Link href="/paginas/privacidade" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '12px',
            opacity: 0.72,
          }}
        >
          <div>
            © {new Date().getFullYear()} Sindicato dos Químicos de SJC e Região. Todos os direitos reservados.
          </div>
          <div>
            E-mail: contato@quimicosjc.org.br
          </div>
        </div>
      </div>
    </footer>
  )
}
