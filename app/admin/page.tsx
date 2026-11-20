import { Metadata } from 'next'
import {
  getUsuarioLogado,
  temPermissao,
  podeAcessarAlgumaSolicitacao,
} from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import { obterContagemPendentes } from '@/app/admin/solicitacoes/actions'

export const metadata: Metadata = {
  title: 'Painel de Controle — Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const [usuario, pendentesCount] = await Promise.all([
    getUsuarioLogado(),
    obterContagemPendentes(),
  ])

  const atalhos = [
    {
      label: 'Publicar notícia',
      desc: 'Escreva e publique uma nova notícia no portal',
      href: '/admin/noticias/nova',
      visivel: temPermissao(usuario, 'noticias', 'criar'),
    },
    {
      label: 'Gerenciar notícias',
      desc: 'Edite matérias e organize os destaques da homepage',
      href: '/admin/noticias',
      visivel: temPermissao(usuario, 'noticias', 'consultar') && !temPermissao(usuario, 'noticias', 'criar'),
    },
    {
      label: 'Páginas do site',
      desc: 'Gerencie História, Diretoria, Convênios e Jurídico',
      href: '/admin/paginas',
      visivel: temPermissao(usuario, 'paginas', 'consultar'),
    },
    {
      label: 'Páginas avulsas',
      desc: 'Crie comunicados e páginas com endereço próprio',
      href: '/admin/avulsas',
      visivel: temPermissao(usuario, 'paginas', 'consultar'),
    },
    {
      label: 'Ver solicitações',
      desc: 'Acompanhe os pedidos e formulários autorizados para sua conta',
      href: '/admin/solicitacoes',
      visivel: podeAcessarAlgumaSolicitacao(usuario),
    },
    {
      label: 'Upload de jornal',
      desc: 'Adicione novas edições do Boca no Trombone e outros jornais',
      href: '/admin/jornais',
      visivel: temPermissao(usuario, 'jornais', 'consultar'),
    },
    {
      label: 'Homepage e banners',
      desc: 'Organize blocos, atalhos e tempo dos banners rotativos',
      href: '/admin/homepage',
      visivel: temPermissao(usuario, 'homepage', 'consultar'),
    },
  ].filter((item) => item.visivel)

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Início"
      activeHref="/admin"
      pendentesCount={pendentesCount}
    >
      <p style={{ fontSize: '12px', letterSpacing: '1.7px', color: '#861e32', fontWeight: 700, margin: '6px 0 8px' }}>
        INÍCIO
      </p>
      <h1 style={{ fontSize: '30px', lineHeight: '1.2', letterSpacing: '-0.8px', margin: '0 0 8px', color: '#30252a' }}>
        Olá, {usuario.nome.split(' ')[0]}!
      </h1>
      <p style={{ color: '#71636a', margin: '0 0 30px', fontSize: '15px' }}>
        Bem-vindo ao painel de controle editorial do Sindicato dos Químicos de SJC e Região.
      </p>

      {/* Cards de acesso rápido filtrados conforme permissões do usuário */}
      {atalhos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '40px' }}>
          {atalhos.map((item) => (
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
      ) : (
        <div
          style={{
            padding: '18px 22px',
            border: '1px solid #e4dce0',
            background: 'white',
            borderRadius: '6px',
            marginBottom: '28px',
            color: '#554950',
            fontSize: '14px',
          }}
        >
          Sua conta ainda não possui módulos liberados. Solicite ao administrador a configuração das permissões de acesso.
        </div>
      )}

      <div
        style={{
          padding: '16px 20px',
          borderLeft: '3px solid #861e32',
          background: '#fff0f3',
          fontSize: '14px',
          color: '#65172a',
          borderRadius: '0 4px 4px 0',
        }}
      >
        <strong>Painel ativo e protegido.</strong> Utilize o menu lateral para acessar os módulos liberados para o seu perfil.
      </div>
    </AdminLayout>
  )
}
