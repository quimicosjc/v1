import { Metadata } from 'next'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'

export const metadata: Metadata = {
  title: 'Painel de Controle — Sindicato dos Químicos SJC',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const usuario = await getUsuarioLogado()

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb="Início"
      activeHref="/admin"
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

      {/* Cards de acesso rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '40px' }}>
        {[
          { label: 'Publicar notícia',  desc: 'Escreva e publique uma nova notícia no portal',  href: '/admin/noticias/nova' },
          { label: 'Ver solicitações',  desc: 'Mensagens, denúncias e contatos recebidos',      href: '/admin/solicitacoes' },
          { label: 'Upload de jornal',  desc: 'Adicione uma nova edição do jornal O Químico',   href: '/admin/jornais' },
        ].map((item) => (
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
        <strong>Módulo de Notícias disponível.</strong> Acesse o menu lateral para criar e gerenciar notícias. Os demais módulos (Jornais, Formulários, Usuários) serão ativados progressivamente.
      </div>
    </AdminLayout>
  )
}
