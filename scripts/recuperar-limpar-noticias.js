const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// 1. Carrega variáveis de ambiente de .env.local
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

function fetchHtml(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function limparHtmlLegado(htmlBruto) {
  if (!htmlBruto || typeof htmlBruto !== 'string') return '';
  let s = htmlBruto;

  // 1. Remove foto principal antiga do Bootstrap duplicada no corpo
  s = s.replace(/<img[^>]*class=["\'][^"\']*card-img-top[^"\']*["\'][^>]*>/gi, '');

  // 2. Remove bloco de data/hora legado (h2 com icone_datahora ou tags img soltas)
  s = s.replace(/<h2[^>]*>[\s\S]*?icone_datahora[\s\S]*?<\/h2>/gi, '');
  s = s.replace(/<img[^>]*icone_datahora[^>]*>/gi, '');

  // 3. Remove blocos inteiros de rodapé antigo (Contato e Menu)
  s = s.replace(/<ul[^>]*site-contatos-rodape[^>]*>[\s\S]*?<\/ul>/gi, '');
  s = s.replace(/<ul[^>]*site-menu-rodape[^>]*>[\s\S]*?<\/ul>/gi, '');
  s = s.replace(/<h2[^>]*>\s*Contato\s*<\/h2>/gi, '');
  s = s.replace(/<h2[^>]*>\s*Menu\s*<\/h2>/gi, '');

  // 4. Remove blocos soltos de cidades e telefones de rodapé legado
  s = s.replace(/<h3 class=["\']text-vermelho-normal fw-700["\']>(São José dos Campos|Jacareí|Taubaté|Caçapava)<\/h3>/gi, '');
  s = s.replace(/<img[^>]*icone_whatsapp\.svg[^>]*>/gi, '');
  s = s.replace(/<p class=["\']text-white fw-400[^"\']*["\']>[\s\S]*?<\/p>/gi, '');

  // 5. Remove logos de rodapé antigo
  s = s.replace(/<img[^>]*logo_sindicato\.png[^>]*>/gi, '');
  s = s.replace(/<img[^>]*logo_conlutas\.png[^>]*>/gi, '');
  s = s.replace(/<img[^>]*logo_unidosparalutar\.png[^>]*>/gi, '');

  // 6. Remove bloco "Siga-nos em nossas redes sociais" e lista de logos de rodapé
  s = s.replace(/<p[^>]*>Siga-nos em nossas redes sociais<\/p>/gi, '');
  s = s.replace(/<h4[^>]*>Acompanhe mais notícias como essa nas nossas redes sociais:<\/h4>/gi, '');
  s = s.replace(/<ul[^>]*list-inline[^>]*>[\s\S]*?logo_(youtube|instagram|facebook)[\s\S]*?<\/ul>/gi, '');
  s = s.replace(/<img[^>]*logo_(youtube|instagram|facebook)\.png[^>]*>/gi, '');

  // 7. Remove tags vazias remanescentes
  s = s.replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, '');
  s = s.replace(/<div>\s*<\/div>/gi, '');

  return s.trim();
}

function gerarResumo300(corpo, titulo) {
  // Extrai texto puro
  let texto = (corpo || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Se o texto for vazio ou contiver resquícios de telefone de rodapé, usa o título
  if (!texto || texto.includes('3921-8177') || texto.length < 15) {
    texto = titulo || 'Notícia publicada pelo Sindicato dos Químicos de São José dos Campos e Região.';
  }

  if (texto.length <= 300) {
    return texto;
  }

  // Corta nos 300 caracteres respeitando limite de palavra
  let corte = texto.slice(0, 300);
  const ultimoEspaco = corte.lastIndexOf(' ');
  if (ultimoEspaco > 220) {
    corte = corte.slice(0, ultimoEspaco);
  }
  return corte + '...';
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`=== INICIANDO RECUPERAÇÃO E LIMPEZA DE MATÉRIAS (${isDryRun ? 'DRY-RUN / SIMULAÇÃO' : 'EXECUÇÃO REAL NO SUPABASE'}) ===\n`);

  // 2. Carrega catálogo legado mapeado anteriormente
  const catalogoPath = path.join(__dirname, '../backups/legado-catalogo-26-paginas.json');
  const legado = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
  console.log(`> Carregadas ${legado.length} referências do catálogo oficial de quimicosjc.org.br`);

  // 3. Busca todas as notícias no banco de dados Supabase
  const { data: noticias, error: errBusca } = await supabase
    .from('conteudos')
    .select('*')
    .eq('tipo', 'noticia')
    .order('criado_em', { ascending: false });

  if (errBusca || !noticias) {
    console.error('Erro ao buscar notícias do banco:', errBusca);
    process.exit(1);
  }
  console.log(`> Encontradas ${noticias.length} notícias no Supabase`);

  let totalRecuperadas = 0;
  let totalLimpezas = 0;
  let totalResumosAjustados = 0;
  const relatorioAuditoria = [];

  for (let i = 0; i < noticias.length; i++) {
    const art = noticias[i];
    let corpoOriginal = art.corpo || '';
    let resumoOriginal = art.resumo || '';
    let corpoFinal = corpoOriginal;
    let resumoFinal = resumoOriginal;
    let recuperouDoLegado = false;
    let motivoRecuperacao = '';

    // Verifica se a matéria tem rodapé ou texto corrompido
    const temRodape = corpoOriginal.includes('site-contatos-rodape') ||
                      corpoOriginal.includes('123921-8177') ||
                      corpoOriginal.includes('3921-8177') ||
                      corpoOriginal.includes('Contato</h2>');

    if (temRodape) {
      // Tenta recuperar conteúdo autêntico do site legado
      const tNorm = norm(art.titulo);
      const sNorm = norm((art.slug || '').replace(/-\d+$/, ''));

      let match = legado.find(l => {
        const lNorm = norm(decodeURIComponent(l.urlSlug));
        return (lNorm.length > 5 && (tNorm.includes(lNorm) || lNorm.includes(tNorm) || sNorm === lNorm || sNorm.includes(lNorm) || lNorm.includes(sNorm)));
      });

      if (match) {
        process.stdout.write(`[${i+1}/${noticias.length}] Recuperando "${art.titulo.slice(0, 40)}"... `);
        const html = await fetchHtml(match.fullUrl);
        const conteudoMatch = html.match(/<div class="conteudo">([\s\S]*?)<\/div>/i);
        let textoExtraido = conteudoMatch ? conteudoMatch[1].trim() : '';

        // Se tem conteúdo real (texto ou iframe)
        if (textoExtraido.replace(/<[^>]+>/g, '').trim().length > 10 || textoExtraido.includes('<iframe')) {
          corpoFinal = textoExtraido;
          recuperouDoLegado = true;
          motivoRecuperacao = `Conteúdo autêntico extraído de ${match.fullUrl}`;
          totalRecuperadas++;
          console.log(`OK (${textoExtraido.length} chars)`);
        } else {
          // Na página legada original não havia texto cadastrado (apenas foto ou aviso)
          corpoFinal = `<p>${art.titulo}</p>`;
          recuperouDoLegado = true;
          motivoRecuperacao = `Original legado sem texto. Purgado rodapé parasita e mantido título limpo.`;
          totalRecuperadas++;
          console.log(`PURGADO (${corpoFinal.length} chars)`);
        }
      }
    }

    // Aplica limpeza de resíduos parasitas
    const corpoLimpo = limparHtmlLegado(corpoFinal);
    if (corpoLimpo !== corpoOriginal) {
      corpoFinal = corpoLimpo;
      totalLimpezas++;
    }

    // Ajusta o resumo para garantir a regra dos 300 caracteres
    const resumoTemTelefone = resumoOriginal.includes('3921-8177') || resumoOriginal.includes('123921-8177');
    const resumoMuitoCurto = !resumoOriginal || resumoOriginal.trim().length < 15;
    const resumoTemHtml = /<[^>]+>/.test(resumoOriginal);

    if (resumoTemTelefone || resumoMuitoCurto || resumoTemHtml || recuperouDoLegado) {
      resumoFinal = gerarResumo300(corpoFinal, art.titulo);
      if (resumoFinal !== resumoOriginal) {
        totalResumosAjustados++;
      }
    }

    // Se houve qualquer modificação
    if (corpoFinal !== corpoOriginal || resumoFinal !== resumoOriginal) {
      relatorioAuditoria.push({
        id: art.id,
        titulo: art.titulo,
        slug: art.slug,
        recuperouDoLegado,
        motivoRecuperacao,
        corpoAntesLen: corpoOriginal.length,
        corpoDepoisLen: corpoFinal.length,
        resumoAntes: resumoOriginal.slice(0, 100),
        resumoDepois: resumoFinal,
      });

      if (!isDryRun) {
        const { error: errUpdate } = await supabase
          .from('conteudos')
          .update({
            corpo: corpoFinal,
            resumo: resumoFinal,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', art.id);

        if (errUpdate) {
          console.error(`Erro ao atualizar artigo ID ${art.id}:`, errUpdate);
        }
      }
    }
  }

  // 4. Salva relatório de auditoria
  const auditPath = path.join(__dirname, '../backups/relatorio-auditoria-recuperacao.json');
  fs.writeFileSync(auditPath, JSON.stringify(relatorioAuditoria, null, 2));

  console.log('\n=== RELATÓRIO FINAL ===');
  console.log(`> Matérias autênticas recuperadas de quimicosjc.org.br: ${totalRecuperadas}`);
  console.log(`> Matérias com parasitas purgados (foto duplicada, datas antigas, ícones): ${totalLimpezas}`);
  console.log(`> Resumos recalculados (regra dos 300 caracteres e remoção de telefones): ${totalResumosAjustados}`);
  console.log(`> Total de registros auditados e atualizados: ${relatorioAuditoria.length}`);
  console.log(`> Relatório completo salvo em: ${auditPath}`);
}

main().catch(console.error);
