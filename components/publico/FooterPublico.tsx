import React from 'react'
import Link from 'next/link'
import { CORES, CONTAINER_STYLE } from '@/lib/design'

interface FooterPublicoProps {
  textoRodape?: string | null
}

const TEXTO_PADRAO = `Sindicato dos Trabalhadores nas Indústrias Químicas, Plásticas e Farmacêuticas de São José dos Campos e Região
São José dos Campos: Praça Carlos Maldonado Campoy, 23 — Centro — (12) 3921-8177
Taubaté: Rua Dr. Pedro Costa, 155 — Centro — (12) 3632-0932 | Jacareí: (12) 3953-3277 | Caçapava: (12) 3655-6044
E-mail: contato@quimicosjc.org.br | Horário: Segunda a sexta, das 8h às 17h`

export default function FooterPublico({ textoRodape }: FooterPublicoProps) {
  const texto = textoRodape?.trim() || TEXTO_PADRAO
  const paragrafos = texto.split('\n').filter((p) => p.trim().length > 0)

  return (
    <footer
      style={{
        background: CORES.primary,
        color: '#FFFFFF',
        borderTop: `4px solid ${CORES.action}`,
        padding: '36px 0 24px 0',
        marginTop: 'auto',
      }}
    >
      <div style={CONTAINER_STYLE}>
        {/* Topo do rodapé com logo do Sindicato e filiação */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo-sindicato.svg"
              alt="Logo Sindicato dos Químicos SJC"
              style={{ height: '40px', width: 'auto', display: 'block' }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: '18px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.1,
                }}
              >
                Sindicato dos Químicos
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, letterSpacing: '0.3px' }}>
                São José dos Campos e Região • Desde 1963
              </div>
            </div>
          </div>

          {/* Logos de filiação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.65, fontWeight: 600 }}>
              Filiado à:
            </span>
            <a
              href="https://www.cspconlutas.org.br"
              target="_blank"
              rel="noopener noreferrer"
              title="CSP-Conlutas"
              style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.9 }}
            >
              <img
                src="/logo-csp-conlutas.png"
                alt="CSP-Conlutas"
                style={{ height: '22px', width: 'auto', display: 'block' }}
              />
            </a>
            <span style={{ opacity: 0.3 }}>•</span>
            <a
              href="https://www.instagram.com/unidospralutar/"
              target="_blank"
              rel="noopener noreferrer"
              title="Unidos pra Lutar"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', textDecoration: 'none', opacity: 0.9 }}
            >
              <img
                src="/logo-unidos-pra-lutar.png"
                alt="Unidos pra Lutar"
                style={{ height: '22px', width: 'auto', display: 'block' }}
              />
              <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Unidos pra Lutar</span>
            </a>
          </div>
        </div>

        {/* Texto institucional do painel (§13.7: coluna única, line-height 1.4, margem 4px entre parágrafos) */}
        <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#f6e7ec', opacity: 0.92, marginBottom: '24px' }}>
          {paragrafos.map((p, idx) => (
            <p key={idx} style={{ margin: '0 0 4px 0' }}>
              {p}
            </p>
          ))}
        </div>

        {/* Linha final com LGPD, Privacidade e Copyright */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '11.5px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <div>
            © {new Date().getFullYear()} Sindicato dos Químicos de São José dos Campos e Região. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/paginas/privacidade"
              style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            >
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link
              href="/paginas/fale-conosco"
              style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            >
              Atendimento e Sedes
            </Link>
            <span>•</span>
            <Link
              href="/admin"
              style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            >
              Acesso Restrito
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
