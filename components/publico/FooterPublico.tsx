import React from 'react'
import Link from 'next/link'
import { CORES, CONTAINER_STYLE } from '@/lib/design'
import { createClient } from '@/lib/supabase/server'

interface FooterPublicoProps {
  textoRodape?: string | null
}

const TEXTO_PADRAO = `Sindicato dos Trabalhadores nas Indústrias Químicas, Plásticas e Farmacêuticas de São José dos Campos e Região
São José dos Campos: (12) 3921-8177 | Taubaté: (12) 3632-0932 | Jacareí: (12) 3953-3277 | Caçapava: (12) 3655-6044
E-mail: contato@quimicosjc.org.br | Horário: Segunda a sexta, das 8h às 17h`

export default async function FooterPublico({ textoRodape }: FooterPublicoProps) {
  let textoFinal = textoRodape

  if (!textoFinal) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('site_config')
        .select('valor')
        .eq('chave', 'homepage')
        .maybeSingle()

      if (typeof data?.valor?.footer === 'string' && data.valor.footer.trim()) {
        textoFinal = data.valor.footer
      }
    } catch {}
  }

  const texto = textoFinal?.trim() || TEXTO_PADRAO
  const paragrafos = texto.split('\n').filter((p) => p.trim().length > 0)

  return (
    <footer
      style={{
        background: CORES.primary,
        color: '#FFFFFF',
        borderTop: `4px solid ${CORES.action}`,
        padding: '28px 0 18px 0',
        marginTop: 'auto',
      }}
    >
      <div style={CONTAINER_STYLE}>
        {/* Opção A: Logo à esquerda e texto à direita na mesma faixa horizontal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '36px',
          }}
          className="rodape-corpo-row"
        >
          {/* Logo do Sindicato com a mesma dimensão do cabeçalho (104px desktop / 76px mobile) */}
          <div style={{ flexShrink: 0 }}>
            <Link
              href="/"
              title="Sindicato dos Químicos de São José dos Campos e Região"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <img
                src="/logo-sindicato.svg"
                alt="Sindicato dos Químicos de São José dos Campos e Região"
                style={{ height: '104px', width: 'auto', display: 'block' }}
                className="logo-rodape-img"
              />
            </Link>
          </div>

          {/* Texto institucional (§13.7: alinhado à direita no desktop, com cidades e telefones) */}
          <div
            style={{
              flex: 1,
              maxWidth: '720px',
              fontSize: '13px',
              lineHeight: 1.45,
              color: '#f6e7ec',
              opacity: 0.94,
            }}
            className="rodape-texto-bloco"
          >
            {paragrafos.map((p, idx) => (
              <p
                key={idx}
                style={{
                  margin: '0 0 5px 0',
                  fontWeight: idx === 0 ? 700 : 400,
                  color: idx === 0 ? '#FFFFFF' : '#f6e7ec',
                }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Linha final com LGPD, Privacidade e Atendimento */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
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
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .rodape-corpo-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .logo-rodape-img {
            height: 76px !important;
          }
          .rodape-texto-bloco {
            max-width: 100% !important;
          }
        }
      `}</style>
    </footer>
  )
}
