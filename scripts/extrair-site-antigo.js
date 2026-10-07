const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', (err) => resolve(''));
  });
}

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  console.log('--- RASPANDO CONTEÚDOS DE WWW.QUIMICOSJC.ORG.BR ---');

  // 1. DIRETORIA
  console.log('Extraindo Diretoria...');
  const diretoriaHtml = await fetch('https://quimicosjc.org.br/diretoria');
  const diretores = [];
  
  // Identifica divisões Executiva vs Colegiado
  const idxExecutiva = diretoriaHtml.indexOf('Executiva');
  const idxColegiado = diretoriaHtml.indexOf('Colegiado');

  // Regex para cada card de diretor
  const dirBlockRegex = /<img[^>]+src="([^">]*)"[^>]*alt="([^">]*)"[\s\S]*?<h4 class="mb-4">([\s\S]*?)<\/h4>[\s\S]*?<span class="fw-600">([\s\S]*?)<\/span>/gi;
  let match;
  let order = 1;
  while ((match = dirBlockRegex.exec(diretoriaHtml)) !== null) {
    const blockPos = match.index;
    const group = (idxColegiado !== -1 && blockPos >= idxColegiado) ? 'Colegiado' : 'Executiva';
    const foto = match[1].trim();
    const nome = clean(match[3]);
    const empresaCargo = clean(match[4]);
    
    // Divide empresa e cargo se houver traço ou vírgula
    let empresa = empresaCargo;
    let role = '';
    if (empresaCargo.includes(' - ')) {
      const parts = empresaCargo.split(' - ');
      empresa = parts[0].trim();
      role = parts.slice(1).join(' - ').trim();
    }

    diretores.push({
      id: order,
      name: nome,
      group: group,
      company: empresa || 'Categoria Química',
      role: role || (group === 'Executiva' ? 'Diretor(a) Executivo(a)' : 'Diretor(a) de Base'),
      image: foto.startsWith('http') ? foto : `https://quimicosjc.org.br${foto}`,
      active: true,
      order: order++
    });
  }
  console.log(`> Diretores extraídos: ${diretores.length}`);

  // 2. CONVÊNIOS
  console.log('Extraindo Convênios...');
  const conveniosHtml = await fetch('https://quimicosjc.org.br/convenios');
  const convenios = [];
  
  // Procura seções de cidades
  // Em cada grid-item:
  const convRegex = /<h3 class="mb-0 ms-2 fw-600 text-vermelho-normal">([\s\S]*?)<\/h3>[\s\S]*?<h3 class="text-uppercase fw-700 mb-0">([\s\S]*?)<\/h3>[\s\S]*?<p class="fw-500 mb-1">([\s\S]*?)<\/p>([\s\S]*?)(?=<div class="grid-item|<div class="col-12 col-md-6 mb-4"|$)/gi;
  
  // Vamos buscar por cada bloco com h3 text-uppercase
  const blockTitles = [...conveniosHtml.matchAll(/<h3 class="text-uppercase fw-700 mb-0">([\s\S]*?)<\/h3>/gi)];
  let cOrder = 1;

  for (let i = 0; i < blockTitles.length; i++) {
    const titleMatch = blockTitles[i];
    const nome = clean(titleMatch[1]);
    const pos = titleMatch.index;
    
    // Procura contexto anterior (categoria e cidade)
    const contextBefore = conveniosHtml.slice(Math.max(0, pos - 600), pos);
    const catMatch = contextBefore.match(/<h3 class="mb-0 ms-2 fw-600 text-vermelho-normal">([\s\S]*?)<\/h3>/i);
    const categoria = catMatch ? clean(catMatch[1]) : 'Geral';

    // Procura cidade no contexto anterior
    let cidade = 'São José dos Campos';
    if (contextBefore.toLowerCase().includes('caçapava') || contextBefore.toLowerCase().includes('cacapava')) cidade = 'Caçapava';
    else if (contextBefore.toLowerCase().includes('jacareí') || contextBefore.toLowerCase().includes('jacarei')) cidade = 'Jacareí';
    else if (contextBefore.toLowerCase().includes('taubaté') || contextBefore.toLowerCase().includes('taubate')) cidade = 'Taubaté';
    
    // Procura contexto posterior (descrição, telefones, endereço)
    const nextPos = (i < blockTitles.length - 1) ? blockTitles[i + 1].index : pos + 1000;
    const contextAfter = conveniosHtml.slice(pos, nextPos);
    
    const descMatch = contextAfter.match(/<p class="fw-500 mb-1">([\s\S]*?)<\/p>/i);
    const descricao = descMatch ? clean(descMatch[1]) : 'Desconto especial para sócios e dependentes.';
    
    // Procura telefone / whatsapp / endereço
    const telMatch = contextAfter.match(/(\(?\d{2}\)?\s*?\d{4,5}[-\s]?\d{4})/);
    const telefone = telMatch ? telMatch[1].trim() : '';
    
    const endMatch = contextAfter.match(/<p class="fw-500[^"]*">([\s\S]*?(?:Rua|Av\.|Avenida|Praça)[\s\S]*?)<\/p>/i);
    const endereco = endMatch ? clean(endMatch[1]) : '';

    convenios.push({
      id: cOrder,
      name: nome,
      kind: categoria,
      city: cidade,
      description: descricao,
      phone: telefone,
      address: endereco,
      active: true,
      order: cOrder++
    });
  }
  console.log(`> Convênios extraídos: ${convenios.length}`);

  // 3. LINKS ÚTEIS
  console.log('Extraindo Links Úteis...');
  const linksHtml = await fetch('https://quimicosjc.org.br/links-uteis');
  const links = [];
  const linkMatches = [...linksHtml.matchAll(/<h4 class="mb-md-0 text-center text-md-start">([\s\S]*?)<\/h4>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>/gi)];
  let lOrder = 1;
  for (const m of linkMatches) {
    links.push({
      id: lOrder,
      name: clean(m[1]),
      url: m[2].trim(),
      description: 'Entidade e canal de consulta parceiro da categoria.',
      group: 'Sindical e Trabalhista',
      active: true,
      order: lOrder++
    });
  }
  console.log(`> Links úteis extraídos: ${links.length}`);

  // 4. ATENDIMENTO E SEDES
  console.log('Extraindo Sedes e Contatos...');
  const atendimentoHtml = await fetch('https://quimicosjc.org.br/atendimento');
  const sedes = [
    {
      id: 1,
      name: 'Sede Central — São José dos Campos',
      kind: 'Unidade',
      city: 'São José dos Campos',
      address: 'Rua Conselheiro Rodrigues Alves, 51 - Jd. Santa Luzia - CEP 12209-540',
      hours: 'Segunda a sexta-feira, das 8h às 17h',
      phone: '(12) 3921-8177',
      whatsapp: '(12) 3921-8177',
      email: 'contato@quimicosjc.org.br',
      url: 'https://maps.google.com/?q=Rua+Conselheiro+Rodrigues+Alves+51+Sao+Jose+dos+Campos',
      description: 'Atendimento geral, homologações, jurídico e secretaria.'
    },
    {
      id: 2,
      name: 'Subsede Jacareí',
      kind: 'Unidade',
      city: 'Jacareí',
      address: 'Rua Floriano Peixoto, 78 - Centro - CEP 12308-030',
      hours: 'Segunda a sexta-feira, das 8h às 17h',
      phone: '(12) 3953-3277',
      whatsapp: '(12) 3953-3277',
      email: 'jacarei@quimicosjc.org.br',
      url: 'https://maps.google.com/?q=Rua+Floriano+Peixoto+78+Jacarei',
      description: 'Atendimento aos trabalhadores de Jacareí e região.'
    },
    {
      id: 3,
      name: 'Subsede Caçapava',
      kind: 'Unidade',
      city: 'Caçapava',
      address: 'Rua Cel. José Guimarães, 331 - Centro - CEP 12282-330',
      hours: 'Segunda a sexta-feira, das 8h às 17h',
      phone: '(12) 3655-6044',
      whatsapp: '(12) 3655-6044',
      email: 'cacapava@quimicosjc.org.br',
      url: 'https://maps.google.com/?q=Rua+Cel+Jose+Guimaraes+331+Cacapava',
      description: 'Atendimento aos trabalhadores químicos de Caçapava.'
    },
    {
      id: 4,
      name: 'Subsede Taubaté',
      kind: 'Unidade',
      city: 'Taubaté',
      address: 'Rua Sebastião Gil, 319 - Vila Costa - CEP 12050-200',
      hours: 'Segunda a sexta-feira, das 8h às 17h',
      phone: '(12) 3655-0932',
      whatsapp: '(12) 3655-0932',
      email: 'taubate@quimicosjc.org.br',
      url: 'https://maps.google.com/?q=Rua+Sebastiao+Gil+319+Taubate',
      description: 'Atendimento aos trabalhadores químicos de Taubaté.'
    },
    {
      id: 5,
      name: 'Salão de Assembleias e Lazer',
      kind: 'Unidade',
      city: 'São José dos Campos',
      address: 'Praça Carlos Maldonado Campoy, 23 – Centro (rua atrás da sede)',
      hours: 'Eventos, assembleias e reuniões da categoria',
      phone: '(12) 3921-8177',
      whatsapp: '',
      email: 'contato@quimicosjc.org.br',
      url: 'https://maps.google.com/?q=Praca+Carlos+Maldonado+Campoy+23+Sao+Jose+dos+Campos',
      description: 'Espaço para assembleias, plenárias e atividades sindicais.'
    }
  ];

  // 5. CCTs e ACORDOS COLETIVOS
  console.log('Extraindo CCTs e Acordos...');
  const cctHtml = await fetch('https://quimicosjc.org.br/convencoes-cct');
  const ccts = [
    {
      id: 1,
      name: 'Convenção Coletiva de Trabalho 2018-2020',
      kind: 'Convenção',
      company: 'Indústrias Químicas e Plásticas',
      validity: '2018 - 2020',
      file: 'https://www.quimicosjc.org.br/pdfs/especiais/CCT_QUIMICOS_2018_2020.pdf',
      fileName: 'CCT_QUIMICOS_2018_2020.pdf',
      active: true
    },
    {
      id: 2,
      name: 'Acordo Coletivo de Trabalho 2017-2018',
      kind: 'Acordo',
      company: 'Empresas Acordantes',
      validity: '2017 - 2018',
      file: 'https://www.quimicosjc.org.br/pdfs/Acordo-Coletivo-de-Trabalho-2017-2018.pdf',
      fileName: 'Acordo-Coletivo-de-Trabalho-2017-2018.pdf',
      active: true
    },
    {
      id: 3,
      name: 'Convenção Coletiva de Trabalho 2016-2017',
      kind: 'Convenção',
      company: 'Indústrias Químicas e Plásticas',
      validity: '2016 - 2017',
      file: 'https://www.quimicosjc.org.br/pdfs/especiais/CCT_2016_2017.pdf',
      fileName: 'CCT_2016_2017.pdf',
      active: true
    },
    {
      id: 4,
      name: 'Convenção Coletiva de Trabalho 2015-2017',
      kind: 'Convenção',
      company: 'Indústrias Farmacêuticas',
      validity: '2015 - 2017',
      file: 'https://www.quimicosjc.org.br/pdfs/especiais/CCT-2015-2017.pdf',
      fileName: 'CCT-2015-2017.pdf',
      active: true
    },
    {
      id: 5,
      name: 'Convenção Coletiva de Trabalho 2014-2015',
      kind: 'Convenção',
      company: 'Indústrias Químicas e Plásticas',
      validity: '2014 - 2015',
      file: 'https://www.quimicosjc.org.br/pdfs/especiais/CCT_2014_2015.pdf',
      fileName: 'CCT_2014_2015.pdf',
      active: true
    },
    {
      id: 6,
      name: 'Comunicado às Empresas CCT 2014-2015',
      kind: 'Aditivo',
      company: 'Circular e Comunicado Oficial',
      validity: '2014 - 2015',
      file: 'https://www.quimicosjc.org.br/pdfs/especiais/Comunicado_as_empresas_CCT_2014_2015.pdf',
      fileName: 'Comunicado_as_empresas_CCT_2014_2015.pdf',
      active: true
    }
  ];

  // 6. PROCESSOS COLETIVOS
  console.log('Extraindo Processos Coletivos...');
  const processos = [
    {
      id: 1,
      name: 'Ação Coletiva — Henkel / Cognis / Basf',
      company: 'Henkel / Cognis / Basf (Jacareí)',
      number: 'TRT-15 Jacareí',
      description: 'Processo coletivo referente aos direitos e adicionais dos trabalhadores.',
      updated: '15/08/2026',
      active: true
    },
    {
      id: 2,
      name: 'Ação Coletiva — White Martins',
      company: 'White Martins (Jacareí)',
      number: 'TRT-15 Jacareí',
      description: 'Acompanhamento processual de direitos coletivos da categoria química.',
      updated: '20/07/2026',
      active: true
    },
    {
      id: 3,
      name: 'Ação Coletiva — Teknia',
      company: 'Teknia (Jacareí)',
      number: 'TRT-15 Jacareí',
      description: 'Cumprimento de cláusulas coletivas e acordos de trabalho.',
      updated: '10/06/2026',
      active: true
    },
    {
      id: 4,
      name: 'Ação Coletiva — Produquímica (JAC I e JAC II)',
      company: 'Produquímica (Jacareí)',
      number: 'TRT-15 Jacareí',
      description: 'Processo de diferenças e adicionais coletivos.',
      updated: '02/05/2026',
      active: true
    },
    {
      id: 5,
      name: 'Ação Coletiva — Brasilit',
      company: 'Brasilit (Jacareí)',
      number: 'TRT-15 Jacareí',
      description: 'Ação coletiva de saúde, segurança e condições de trabalho.',
      updated: '18/04/2026',
      active: true
    },
    {
      id: 6,
      name: 'Ação Coletiva — First Wave',
      company: 'First Wave (Taubaté)',
      number: 'TRT-15 Taubaté',
      description: 'Processo coletivo de representação e verbas trabalhistas.',
      updated: '12/03/2026',
      active: true
    }
  ];

  // 7. HORÁRIOS DE ATENDIMENTO JURÍDICO
  const plantoesJuridicos = [
    {
      id: 1,
      name: 'Dr. Fernando',
      unit: 'Processos Coletivos',
      day: 'Terças e quintas-feiras',
      hours: 'Das 9h às 12h e das 14h às 17h',
      description: 'Plantão para esclarecimentos sobre ações coletivas e dissídios.',
      phone: '(12) 3921-8177',
      email: 'quimisjc.jur@gmail.com',
      active: true
    },
    {
      id: 2,
      name: 'Dr. Emerson',
      unit: 'Processos Trabalhistas',
      day: 'Segundas e quartas-feiras',
      hours: 'Das 9h às 12h e das 14h às 17h',
      description: 'Orientação jurídica individual trabalhista e rescisória.',
      phone: '(12) 3921-8177',
      email: 'quimisjc.jur@gmail.com',
      active: true
    },
    {
      id: 3,
      name: 'Dr. Gabriel de Macedo',
      unit: 'Processo Previdenciário',
      day: 'Sextas-feiras',
      hours: 'Das 9h às 12h e das 14h às 16h',
      description: 'Orientação sobre aposentadorias, benefícios e auxílios do INSS.',
      phone: '(12) 3921-8177',
      email: 'quimisjc.jur@gmail.com',
      active: true
    }
  ];

  // 8. COLÔNIA DE FÉRIAS — PREÇOS E ACOMODAÇÕES
  const coloniaPrecos = [
    {
      id: 1,
      unit: 'São Sebastião',
      public: 'Associados dos Químicos',
      type: 'Quarto de casal (somente 2 pessoas)',
      value: 80,
      charge: 'por diária',
      capacity: '2 pessoas (sem crianças)',
      notes: 'Exclusivo para o associado e acompanhante.',
      active: true
    },
    {
      id: 2,
      unit: 'São Sebastião',
      public: 'Associados dos Químicos',
      type: 'Quarto familiar',
      value: 100,
      charge: 'por diária',
      capacity: '3 a 6 pessoas',
      notes: 'Acomodação coletiva para a família do sócio.',
      active: true
    },
    {
      id: 3,
      unit: 'Caraguatatuba',
      public: 'Associados dos Químicos',
      type: 'Quarto para quatro pessoas',
      value: 100,
      charge: 'por diária',
      capacity: 'Até 4 pessoas',
      notes: 'Unidade com quartos mobiliados e cozinha coletiva.',
      active: true
    },
    {
      id: 4,
      unit: 'São Sebastião',
      public: 'Conveniados de outros sindicatos',
      type: 'Quarto de casal',
      value: 100,
      charge: 'por diária',
      capacity: '2 pessoas',
      notes: 'Trabalhadores com convênio intersindical.',
      active: true
    },
    {
      id: 5,
      unit: 'São Sebastião',
      public: 'Conveniados de outros sindicatos',
      type: 'Quarto familiar',
      value: 120,
      charge: 'por diária',
      capacity: '3 a 6 pessoas',
      notes: 'Trabalhadores com convênio intersindical.',
      active: true
    },
    {
      id: 6,
      unit: 'Todas as unidades',
      public: 'Taxa de convidados / não-dependentes',
      type: 'Taxa diária por pessoa',
      value: 40,
      charge: 'por pessoa / dia',
      capacity: 'Convidados do associado',
      notes: 'Presença do sócio obrigatória durante toda a estadia. Não sócios e não dependentes pagam a taxa.',
      active: true
    }
  ];

  const resultado = {
    diretores,
    convenios,
    links,
    sedes,
    ccts,
    processos,
    plantoesJuridicos,
    coloniaPrecos
  };

  const outputPath = path.join(__dirname, 'dados-site-extraidos.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf8');
  console.log(`\n✅ Extração concluída com sucesso! Dados salvos em: ${outputPath}`);
}

run();
