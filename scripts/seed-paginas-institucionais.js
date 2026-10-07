const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Lê .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Credenciais do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Carrega dados extraídos do site antigo
const dadosPath = path.join(__dirname, 'dados-site-extraidos.json');
let extraidos = {};
if (fs.existsSync(dadosPath)) {
  extraidos = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));
}

async function runSeed() {
  console.log('--- INICIANDO SEED DE PÁGINAS INSTITUCIONAIS NO SUPABASE ---');

  const paginas = [
    // ── GRUPO SINDICATO ──────────────────────────────────────────────────────────
    {
      tipo: 'institucional',
      slug: 'historia',
      titulo: 'História',
      chapeu: 'Sindicato',
      subtitulo: 'Sindicato é pra lutar! A história de lutas e conquistas da categoria química.',
      corpo: `<h2>Sindicato é pra lutar! A história de luta da categoria!</h2>
<p>O Sindicato dos Trabalhadores nas Indústrias Químicas, Plásticas e Farmacêuticas de São José dos Campos e Região tem uma história construída na base, nas portas de fábrica e nas assembleias soberanas da classe trabalhadora.</p>
<h3>1963 · Fundação e início da representação</h3>
<p>Início do sindicato dos químicos de São José dos Campos, congregando trabalhadores das primeiras indústrias instaladas no Vale do Paraíba.</p>
<h3>1980 · Primeiras greves históricas da categoria química</h3>
<p>Embate contra o capital e a exploração dos patrões e governos militares, abrindo caminho para a redemocratização e conquistas salariais marcantes.</p>
<h3>1992 · Luta contra as privatizações</h3>
<p>Resistência ativa nas ruas do Vale do Paraíba em defesa do patrimônio público nacional e dos direitos dos trabalhadores do complexo petroquímico e químico.</p>
<h3>1997-1998 · Campanhas salariais unificadas e resistência</h3>
<p>Mesmo com ataques severos da patronal e intimidações, a categoria unificou as lutas em São José, Jacareí, Caçapava e Taubaté.</p>
<h3>2008-2011 · As greves na Johnson & Johnson e enfrentamentos</h3>
<p>Paralisações históricas de advertência e enfrentamento direto à truculência policial para garantir aumento real de salário, redução de jornada e adicionais justos.</p>
<h3>2023 · 60 anos de Sindicato Independente</h3>
<p>Seis décadas de organização classista, independente de governos e patrões, mantendo o sindicato como instrumento de luta real para os trabalhadores.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'text', grupo: 'Sindicato' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'diretoria',
      titulo: 'Diretoria',
      chapeu: 'Sindicato',
      subtitulo: 'Conheça os dirigentes das lutas da categoria química.',
      corpo: `<p>A diretoria do Sindicato dos Químicos de São José dos Campos e Região é eleita democraticamente pelos trabalhadores químicos para organizar as lutas diárias, conduzir as negociações coletivas e representar a categoria nos locais de trabalho.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'directors', grupo: 'Sindicato', records: extraidos.diretores || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'fique-socio',
      titulo: 'Fique sócio',
      chapeu: 'Sindicato',
      subtitulo: 'Sindicalize-se e fortaleça a luta dos trabalhadores químicos.',
      corpo: `<p>A sindicalização é a maior força dos trabalhadores para garantir salário digno, saúde nas fábricas e respeito aos direitos coletivos. Trabalhador sindicalizado fortalece a si mesmo e a toda a categoria.</p><p>Como sócio dos Químicos, você tem acesso à assessoria jurídica especializada, estadias na Colônia de Férias no Litoral Norte e a uma ampla rede de convênios com descontos exclusivos.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'form:Sindicalização', grupo: 'Sindicato', form: 'Sindicalização', path: '/admin/solicitacoes?tipo=sindicalizacao' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'fale-conosco',
      titulo: 'Fale conosco',
      chapeu: 'Sindicato',
      subtitulo: 'Entre em contato com nossa sede e subsedes.',
      corpo: `<p>O Sindicato dos Químicos de São José dos Campos e Região está estruturado com sedes e subsedes próximas das principais concentrações industriais da categoria. Escolha a unidade mais próxima de você para atendimento, dúvidas ou homologações.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'contacts', grupo: 'Sindicato', records: extraidos.sedes || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'links-uteis',
      titulo: 'Links úteis',
      chapeu: 'Sindicato',
      subtitulo: 'Canais, sindicatos parceiros e fontes de informação da luta dos trabalhadores.',
      corpo: `<p>Consulte entidades representativas, federações e canais informativos com os quais o Sindicato mantém diálogo e articulação na defesa dos trabalhadores.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'links', grupo: 'Sindicato', records: extraidos.links || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'privacidade',
      titulo: 'Política de privacidade',
      chapeu: 'Sindicato',
      subtitulo: 'Tratamento de dados pessoais e termos de uso do portal institucional.',
      corpo: `<p>O Sindicato dos Trabalhadores nas Indústrias Químicas, Plásticas e Farmacêuticas de São José dos Campos e Região respeita a sua privacidade e zela pela proteção dos seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).</p>
<h2>1. Dados coletados e sua finalidade</h2>
<p>Os dados pessoais fornecidos nos formulários (como sindicalização, denúncias, solicitação de carteirinhas ou recebimento de notícias) são utilizados unicamente para viabilizar as atividades institucionais, estatutárias e de representação sindical.</p>
<h2>2. Sigilo das denúncias</h2>
<p>As denúncias de irregularidades trabalhistas têm tratamento estritamente sigiloso e confidencial. Seus dados nunca serão compartilhados com empresas ou terceiros.</p>
<h2>3. Direitos dos titulares e contato</h2>
<p>Para atualizar seus dados ou tirar dúvidas sobre o tratamento de informações pessoais, entre em contato pelo e-mail <strong>contato@quimicosjc.org.br</strong>.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'text', grupo: 'Sindicato' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },

    // ── GRUPO SERVIÇOS ──────────────────────────────────────────────────────────
    {
      tipo: 'institucional',
      slug: 'convenios',
      titulo: 'Convênios',
      chapeu: 'Serviços',
      subtitulo: 'Relação de convênios para os trabalhadores sindicalizados.',
      corpo: `<p>O Sindicato dos Químicos mantém parcerias com dezenas de estabelecimentos nas áreas de saúde, educação, lazer, esportes e serviços para garantir descontos reais no orçamento do associado e de sua família.</p><p>Para utilizar os benefícios, basta apresentar a carteirinha de sócio do sindicato ou declaração da secretaria.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'partners', grupo: 'Serviços', records: extraidos.convenios || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia',
      titulo: 'Colônia de Férias',
      chapeu: 'Serviços',
      subtitulo: 'Lazer e descanso para os sócios e seus familiares em Caraguatatuba e São Sebastião.',
      corpo: `<p>A Colônia de Férias do Sindicato oferece momentos de descanso e lazer à beira-mar nas praias de São Sebastião e Caraguatatuba. Estrutura com quartos mobiliados, cozinhas coletivas e localização privilegiada no Litoral Norte paulista.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'colony', grupo: 'Serviços' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-inicio',
      titulo: 'Colônia de Férias — Início',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Conheça as unidades de Caraguatatuba e São Sebastião.',
      corpo: `<p>A colônia de férias do Sindicato em São Sebastião e Caraguatatuba já está à disposição da categoria. Nossos sócios e conveniados podem desfrutar do lazer ideal com conforto e segurança para toda a família.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'text', grupo: 'Colônia de Férias' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-valores',
      titulo: 'Valores e detalhes',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Tabela de diárias e acomodações por unidade e perfil.',
      corpo: `<p>Confira a tabela oficial de diárias da Colônia de Férias. Os valores são diferenciados para associados dos Químicos e conveniados de sindicatos parceiros.</p><p><strong>Períodos especiais:</strong> Fim de ano (Natal e Réveillon) e Carnaval possuem valores específicos e sorteio prévio de vagas realizado pela secretaria do Sindicato.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'prices', grupo: 'Colônia de Férias', records: extraidos.coloniaPrecos || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-regulamento',
      titulo: 'Regulamento interno',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Normas de convivência e conservação da Colônia de Férias.',
      corpo: `<p>Leia atentamente o Regulamento Interno da Colônia de Férias antes de solicitar sua reserva, garantindo total tranquilidade em seu descanso e diversão.</p>
<ul>
  <li><strong>Animais:</strong> Não é permitido levar animais para as dependências da Colônia de Férias em nenhuma das unidades.</li>
  <li><strong>Horário de silêncio:</strong> Das 22h às 8h da manhã, respeitando o descanso das famílias hóspedes.</li>
  <li><strong>Cozinhas coletivas:</strong> O hóspede deve trazer seus utensílios individuais e manter o espaço devidamente limpo após o uso.</li>
  <li><strong>Presença do sócio:</strong> É indispensável a presença do associado titular ou dependente legal durante toda a hospedagem.</li>
</ul>`,
      tags_json: JSON.stringify({ tipoPagina: 'documents', grupo: 'Colônia de Férias' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-reservas',
      titulo: 'Reservas',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Orientações e canais para solicitação de reservas.',
      corpo: `<p>As reservas da Colônia de Férias devem ser realizadas diretamente com a secretaria do Sindicato.</p>
<p><strong>Atenção:</strong> Não realizamos confirmações de reserva por e-mail ou mensagens instantâneas sem agendamento prévio na sede ou subsedes.</p>
<p>Entre em contato pelo telefone <strong>(12) 3921-8177</strong> para verificar a disponibilidade de datas e obter a guia de autorização de hospedagem.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'contacts', grupo: 'Colônia de Férias' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-como-chegar',
      titulo: 'Como chegar',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Localização e rotas de acesso para Caraguatatuba e São Sebastião.',
      corpo: `<p>Veja a localização e orientações de trânsito para chegar com tranquilidade às unidades da Colônia de Férias no Litoral Norte paulista.</p>`,
      tags_json: JSON.stringify({
        tipoPagina: 'locations',
        grupo: 'Colônia de Férias',
        records: [
          {
            name: 'Unidade São Sebastião',
            address: 'Av. Guarda Mor Lobo Viana, Centro - São Sebastião/SP',
            url: 'https://maps.google.com/?q=Sao+Sebastiao+SP',
            description: 'Próxima ao centro histórico e travessia da balsa para Ilhabela.'
          },
          {
            name: 'Unidade Caraguatatuba',
            address: 'Caraguatatuba/SP',
            url: 'https://maps.google.com/?q=Caraguatatuba+SP',
            description: 'Fácil acesso pela Rodovia dos Tamoios e praias da região central.'
          }
        ]
      }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'colonia-fotos',
      titulo: 'Fotos da Colônia',
      chapeu: 'Colônia de Férias',
      subtitulo: 'Galeria de fotos das acomodações e áreas de lazer.',
      corpo: `<p>Conheça os quartos, áreas de convivência e arredores das nossas unidades no litoral.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'gallery', grupo: 'Colônia de Férias', records: [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'cadastro-noticias',
      titulo: 'Cadastro para notícias',
      chapeu: 'Serviços',
      subtitulo: 'Receba notícias e comunicados do Sindicato no seu e-mail e WhatsApp.',
      corpo: `<p>Cadastre-se para receber as principais notícias, convocatórias de assembleias e boletins informativos do Sindicato dos Químicos diretamente no seu e-mail e celular.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'subscription', grupo: 'Serviços', path: '/admin/inscricoes' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'carteirinha',
      titulo: 'Solicitar carteirinha',
      chapeu: 'Serviços',
      subtitulo: 'Emissão e segunda via da carteirinha de sócio do sindicato.',
      corpo: `<p>A carteirinha do Sindicato garante sua identificação e o acesso a todos os benefícios, convênios de saúde e educação, além da Colônia de Férias.</p><p>Preencha os dados no formulário para solicitar a emissão ou 2ª via da sua carteirinha e de seus dependentes.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'form:Carteirinha', grupo: 'Serviços', form: 'Carteirinha', path: '/admin/solicitacoes?tipo=carteirinha' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'atualizar-cadastro',
      titulo: 'Atualizar cadastro',
      chapeu: 'Serviços',
      subtitulo: 'Mantenha seus dados e de seus dependentes sempre atualizados.',
      corpo: `<p>Mudou de empresa, endereço ou telefone? Mantenha seu cadastro sempre em dia para não perder comunicados importantes sobre negociações coletivas e benefícios sindicais.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'form:Atualização cadastral', grupo: 'Serviços', form: 'Atualização cadastral', path: '/admin/solicitacoes?tipo=atualizacao' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },

    // ── GRUPO JURÍDICO ──────────────────────────────────────────────────────────
    {
      tipo: 'institucional',
      slug: 'juridico',
      titulo: 'Horário de atendimento jurídico',
      chapeu: 'Jurídico',
      subtitulo: 'Atendimento jurídico para a categoria química nas áreas trabalhista, previdenciária e coletiva.',
      corpo: `<p>O Departamento Jurídico do Sindicato dos Químicos atua incansavelmente para defender os direitos dos trabalhadores da categoria, tanto em ações individuais quanto em processos coletivos.</p><p>Consulte a escala dos advogados e agende seu atendimento pelo telefone <strong>(12) 3921-8177</strong> ou pelo e-mail <strong>quimisjc.jur@gmail.com</strong>.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'hours', grupo: 'Jurídico', records: extraidos.plantoesJuridicos || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'processos',
      titulo: 'Lista de processos coletivos',
      chapeu: 'Jurídico',
      subtitulo: 'Processos abertos pelo sindicato e numeração para consulta no TRT-15.',
      corpo: `<p>Abaixo seguem os processos coletivos ajuizados pelo Sindicato dos Químicos para consulta pública no Tribunal Regional do Trabalho da 15ª Região (TRT-15). As ações tratam de adicionais de insalubridade, periculosidade, horas extras e cumprimento de cláusulas coletivas.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'processes', grupo: 'Jurídico', records: extraidos.processos || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'cct',
      titulo: 'Acordos e convenções coletivas',
      chapeu: 'Jurídico',
      subtitulo: 'Documentos normativos, convenções e acordos coletivos de trabalho.',
      corpo: `<p>Acesse o acervo de Convenções Coletivas de Trabalho (CCT) e Acordos Coletivos (ACT) da categoria química, farmacêutica e plástica.</p>
<p><strong>Aviso importante:</strong> As convenções a partir da CCT 2019 devem ser solicitadas diretamente ao setor jurídico pelo telefone <strong>(12) 3921-8177</strong> ou pelo e-mail <strong>quimisjc.jur@gmail.com</strong>.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'documents', grupo: 'Jurídico', records: extraidos.ccts || [] }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'homologacoes',
      titulo: 'Homologações',
      chapeu: 'Jurídico',
      subtitulo: 'Homologação segura e correta da rescisão do contrato de trabalho.',
      corpo: `<p>A homologação da rescisão contratual no Sindicato garante que todas as verbas rescisórias devidas ao trabalhador sejam rigorosamente apuradas e pagas de acordo com a Convenção Coletiva de Trabalho e a legislação vigente.</p>
<h2>Documentos de responsabilidade do trabalhador</h2>
<ul>
  <li>Carteira de Trabalho e Previdência Social (CTPS) atualizada;</li>
  <li>Documento oficial de identidade com foto (RG ou CNH) e CPF;</li>
  <li>Comprovante de residência atualizado;</li>
  <li>Extrato analítico da conta vinculada do FGTS atualizado.</li>
</ul>
<h2>Documentos de responsabilidade da empresa</h2>
<ul>
  <li>Termo de Rescisão do Contrato de Trabalho (TRCT) em 5 vias;</li>
  <li>Termo de Homologação em 5 vias;</li>
  <li>Guia de Recolhimento Rescisório do FGTS (GRRF) com o devido comprovante de quitação bancária;</li>
  <li>Demonstrativo do trabalhador de recolhimento FGTS rescisório;</li>
  <li>Atestado de Saúde Ocupacional (ASO) Demissional;</li>
  <li>Chave de identificação da Caixa Econômica Federal;</li>
  <li>Comprovante do aviso prévio (trabalhado ou indenizado);</li>
  <li>Carta de Preposto quando o responsável não for sócio da empresa.</li>
</ul>
<p>Os agendamentos devem ser solicitados com antecedência junto à secretaria da sede ou subsedes.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'text', grupo: 'Jurídico' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },

    // ── GRUPO IMPRENSA ──────────────────────────────────────────────────────────
    {
      tipo: 'institucional',
      slug: 'lista-noticias',
      titulo: 'Notícias',
      chapeu: 'Imprensa',
      subtitulo: 'Acompanhe as notícias e coberturas das lutas da categoria.',
      corpo: `<p>Índice completo das notícias, matérias e comunicados publicados pelo Sindicato dos Químicos de São José dos Campos e Região.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'news', grupo: 'Imprensa', path: '/admin/noticias' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'boca-no-trombone',
      titulo: 'Boca no Trombone',
      chapeu: 'Imprensa',
      subtitulo: 'Jornal oficial do Sindicato dos Químicos de São José dos Campos e Região.',
      corpo: `<p>O Boca no Trombone é o jornal de circulação contínua nas fábricas da nossa base territorial, trazendo análises políticas, informes das comissões sindicais e denúncias da classe trabalhadora.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'journals', grupo: 'Imprensa', publication: 'Boca no Trombone', path: '/admin/jornais' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'outros-jornais',
      titulo: 'Outros jornais e publicações',
      chapeu: 'Imprensa',
      subtitulo: 'Informativos setoriais, panfletos e boletins das lutas sindicais.',
      corpo: `<p>Edições especiais de jornais, boletins de fábrica e cartilhas temáticas produzidas pelo Sindicato dos Químicos.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'journals', grupo: 'Imprensa', path: '/admin/jornais' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    },
    {
      tipo: 'institucional',
      slug: 'denuncia',
      titulo: 'Enviar denúncia',
      chapeu: 'Imprensa',
      subtitulo: 'Canal seguro e confidencial para denúncias de irregularidades trabalhistas.',
      corpo: `<p>O canal de denúncias do Sindicato dos Químicos é um instrumento direto de defesa da saúde, segurança e dignidade do trabalhador dentro das empresas. As informações enviadas são tratadas com sigilo absoluto e geram um protocolo de acompanhamento.</p>`,
      tags_json: JSON.stringify({ tipoPagina: 'form:Denúncia', grupo: 'Imprensa', form: 'Denúncia', path: '/admin/solicitacoes?tipo=denuncia' }),
      status: 'publicado',
      destaque: false,
      noindex: false
    }
  ];

  console.log(`Total de páginas institucionais a semear: ${paginas.length}`);

  let inseridos = 0;
  let atualizados = 0;

  for (const pag of paginas) {
    // Verifica se já existe pelo slug e tipo
    const { data: existente } = await supabase
      .from('conteudos')
      .select('id')
      .eq('slug', pag.slug)
      .eq('tipo', 'institucional')
      .maybeSingle();

    if (existente) {
      const { error: errUp } = await supabase
        .from('conteudos')
        .update({
          titulo: pag.titulo,
          chapeu: pag.chapeu,
          subtitulo: pag.subtitulo,
          corpo: pag.corpo,
          tags_json: pag.tags_json,
          status: pag.status,
          destaque: pag.destaque,
          noindex: pag.noindex,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', existente.id);

      if (errUp) {
        console.error(`Erro ao atualizar ${pag.slug}:`, errUp);
      } else {
        atualizados++;
      }
    } else {
      const { error: errIn } = await supabase
        .from('conteudos')
        .insert({
          tipo: 'institucional',
          slug: pag.slug,
          titulo: pag.titulo,
          chapeu: pag.chapeu,
          subtitulo: pag.subtitulo,
          corpo: pag.corpo,
          tags_json: pag.tags_json,
          status: pag.status,
          destaque: pag.destaque,
          noindex: pag.noindex,
          imagem_y: 50,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
          publicado_em: new Date().toISOString()
        });

      if (errIn) {
        console.error(`Erro ao inserir ${pag.slug}:`, errIn);
      } else {
        inseridos++;
      }
    }
  }

  console.log(`\n🎉 SEED CONCLUÍDO COM SUCESSO!`);
  console.log(`- Inseridos: ${inseridos}`);
  console.log(`- Atualizados: ${atualizados}`);
  console.log(`- Total de páginas institucionais ativas no Supabase: ${inseridos + atualizados}`);
}

runSeed();
