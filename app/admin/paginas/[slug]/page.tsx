import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUsuarioLogado } from '@/lib/supabase/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import { obterPaginaInstitucional } from '../actions'
import EditorTextoInstitucional from '@/components/admin/paginas/EditorTextoInstitucional'
import EditorDiretoria from '@/components/admin/paginas/EditorDiretoria'
import EditorConvenios from '@/components/admin/paginas/EditorConvenios'
import EditorContatos from '@/components/admin/paginas/EditorContatos'
import EditorLinksUteis from '@/components/admin/paginas/EditorLinksUteis'
import EditorJuridicoCCT from '@/components/admin/paginas/EditorJuridicoCCT'
import EditorColoniaPrecos from '@/components/admin/paginas/EditorColoniaPrecos'
import EditorPaginaVinculada from '@/components/admin/paginas/EditorPaginaVinculada'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagina = await obterPaginaInstitucional(slug)
  return {
    title: `${pagina?.titulo || 'Editar Página'} — Painel de Controle · Sindicato dos Químicos SJC`,
    robots: { index: false, follow: false },
  }
}

export default async function EditarPaginaInstitucionalPage({ params }: Props) {
  const { slug } = await params
  const usuario = await getUsuarioLogado()
  const pagina = await obterPaginaInstitucional(slug)

  if (!pagina) {
    notFound()
  }

  // Define o editor apropriado
  function renderEditor() {
    if (!pagina) return null

    if (slug === 'diretoria') {
      return <EditorDiretoria pagina={pagina} />
    }

    if (slug === 'convenios') {
      return <EditorConvenios pagina={pagina} />
    }

    if (slug === 'fale-conosco' || slug === 'colonia-reservas') {
      return <EditorContatos pagina={pagina} />
    }

    if (slug === 'links-uteis') {
      return <EditorLinksUteis pagina={pagina} />
    }

    if (slug === 'cct' || slug === 'processos' || slug === 'juridico') {
      return <EditorJuridicoCCT pagina={pagina} />
    }

    if (slug === 'colonia-valores') {
      return <EditorColoniaPrecos pagina={pagina} />
    }

    // Formulários e módulos vinculados
    if (slug === 'fique-socio') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Solicitações de Sindicalização',
            href: '/admin/solicitacoes?tipo=sindicalizacao',
            descricao: 'As pessoas que preenchem este formulário no site têm seus dados enviados diretamente para a central de Solicitações.',
            botaoLabel: 'Ver solicitações recebidas',
          }}
        />
      )
    }

    if (slug === 'carteirinha') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Solicitações de Carteirinha',
            href: '/admin/solicitacoes?tipo=carteirinha',
            descricao: 'Pedidos de emissão e 2ª via de carteirinhas de sócios e dependentes são gerenciados na central de Solicitações.',
            botaoLabel: 'Ver pedidos de carteirinha',
          }}
        />
      )
    }

    if (slug === 'atualizar-cadastro') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Atualização Cadastral',
            href: '/admin/solicitacoes?tipo=atualizacao',
            descricao: 'Atualizações de dados enviadas pelos sócios chegam organizadas para validação da secretaria.',
            botaoLabel: 'Ver atualizações de sócios',
          }}
        />
      )
    }

    if (slug === 'denuncia') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Canal Seguro de Denúncias',
            href: '/admin/solicitacoes?tipo=denuncia',
            descricao: 'Denúncias anônimas e identificadas de fábricas e locais de trabalho são recebidas com protocolo protegido.',
            botaoLabel: 'Ver denúncias anônimas',
          }}
        />
      )
    }

    if (slug === 'cadastro-noticias') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Cadastro para Notícias',
            href: '/admin/inscricoes',
            descricao: 'Lista de trabalhadores inscritos para receber notícias, informativos e convocações no e-mail ou WhatsApp.',
            botaoLabel: 'Ver inscritos cadastrados',
          }}
        />
      )
    }

    if (slug === 'lista-noticias') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Módulo Editorial de Notícias',
            href: '/admin/noticias',
            descricao: 'Gerencie todas as matérias, fotos com enquadramento 3:2, destaques e publicações do portal.',
            botaoLabel: 'Gerenciar notícias',
          }}
        />
      )
    }

    if (slug === 'boca-no-trombone' || slug === 'outros-jornais') {
      return (
        <EditorPaginaVinculada
          pagina={pagina}
          moduloDestino={{
            nome: 'Publicações e Jornais',
            href: '/admin/jornais',
            descricao: 'Cadastre edições em PDF, capas e datas do jornal Boca no Trombone e informativos sindicais.',
            botaoLabel: 'Gerenciar jornais',
          }}
        />
      )
    }

    // Padrão: Editor de texto rico (História, Homologações, Política de Privacidade, Colônia Início, Regulamento, Como chegar, Fotos)
    return <EditorTextoInstitucional pagina={pagina} />
  }

  const breadcrumbText = slug.startsWith('colonia-')
    ? `Páginas do site > Colônia de Férias > ${pagina.titulo}`
    : `Páginas do site > ${pagina.chapeu || 'Institucional'} > ${pagina.titulo}`

  return (
    <AdminLayout
      usuario={usuario}
      breadcrumb={breadcrumbText}
      activeHref="/admin/paginas"
    >
      {renderEditor()}
    </AdminLayout>
  )
}
