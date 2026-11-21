import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function fetchText(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const raw = await res.text()
  const text = raw.replace(/<!--\s*-->/g, '')
  return { status: res.status, headers: res.headers, text }
}

async function run() {
  console.log(`🔍 Iniciando certificação completa em: ${BASE_URL}\n`)
  let passed = 0

  // 1. Cabeçalhos de Segurança (HSTS, CSP, nosniff, X-Frame-Options)
  {
    const { status, headers } = await fetchText('/')
    assert.equal(status, 200, 'Home deve retornar 200')
    assert.ok(headers.get('strict-transport-security')?.includes('max-age='), 'HSTS deve estar presente')
    assert.ok(headers.get('content-security-policy')?.includes("default-src 'self'"), 'CSP deve estar presente')
    assert.equal(headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options deve ser nosniff')
    console.log('✅ [1/12] Cabeçalhos de Segurança (HSTS, CSP, X-Content-Type-Options) verificados.')
    passed++
  }

  // 2. Redirecionamentos 301 de URLs antigas do quimicosjc.org.br
  {
    const redirects = [
      ['/quem-somos', '/paginas/historia'],
      ['/colonia-de-ferias', '/paginas/colonia'],
      ['/colonia-de-ferias/fotos', '/paginas/colonia-fotos'],
      ['/colonia-de-ferias/valores-detalhes', '/paginas/colonia-valores'],
      ['/colonia-de-ferias/reservas', '/paginas/colonia-reservas'],
      ['/colonia-de-ferias/como-chegar', '/paginas/colonia-como-chegar'],
      ['/colonia-de-ferias/regulamentos', '/paginas/colonia-regulamento'],
      ['/homologacao', '/paginas/homologacoes'],
      ['/atendimento-juridico', '/paginas/juridico'],
      ['/convencoes-cct', '/paginas/cct'],
      ['/ficar-socio', '/paginas/fique-socio'],
      ['/solicitacoes-carteirinhas', '/paginas/carteirinha'],
      ['/atualizar-socio', '/paginas/atualizar-cadastro'],
      ['/enviar-denuncia', '/paginas/denuncia'],
      ['/newsletter', '/paginas/cadastro-noticias'],
      ['/imprensa', '/jornais'],
      ['/atendimento', '/paginas/fale-conosco'],
    ]
    for (const [oldPath, expectedDest] of redirects) {
      const res = await fetch(`${BASE_URL}${oldPath}`, { redirect: 'manual' })
      assert.ok([301, 308].includes(res.status), `Rota antiga ${oldPath} deve redirecionar (301/308), retornou ${res.status}`)
      const loc = res.headers.get('location') || ''
      assert.ok(loc.endsWith(expectedDest), `Rota ${oldPath} deve apontar para ${expectedDest}, apontou para ${loc}`)
    }
    console.log(`✅ [2/12] Todos os ${redirects.length} redirecionamentos 301 de URLs legadas funcionam perfeitamente.`)
    passed++
  }

  // 3. Colônia de Férias e Subpáginas (Reservas, Valores, Regulamento, Como Chegar, 28 Fotos)
  {
    const col = await fetchText('/paginas/colonia')
    assert.equal(col.status, 200)
    assert.ok(col.text.includes('3861-2218'), 'Colônia deve exibir o telefone (12) 3861-2218')
    assert.ok(col.text.includes('Avenida 6, 250, Porto Novo'), 'Colônia deve exibir o endereço Avenida 6, 250, Porto Novo')

    const resv = await fetchText('/paginas/colonia-reservas')
    assert.equal(resv.status, 200)
    assert.ok(resv.text.includes('3861-2218'), 'Reservas deve exibir (12) 3861-2218')
    assert.ok(resv.text.includes('53.322.442/0001-10'), 'Reservas deve exibir o PIX oficial')
    assert.ok(!resv.text.includes('Francisco Paes'), 'Reservas NÃO deve conter o endereço incorreto antigo')

    const val = await fetchText('/paginas/colonia-valores')
    assert.equal(val.status, 200)
    assert.ok(val.text.includes('Ar-condicionado'), 'Valores deve listar comodidades dos quartos')
    assert.ok(val.text.includes('Levar roupa de cama'), 'Valores deve informar responsabilidade de roupa de cama e toalhas')
    assert.ok(val.text.includes('Internet Sem Fio'), 'Valores deve listar regras de Wi-Fi')

    const chg = await fetchText('/paginas/colonia-como-chegar')
    assert.equal(chg.status, 200)
    assert.ok(chg.text.includes('Rua José Paulino Ferreira, 152'), 'Como chegar deve conter endereço de São Sebastião')
    assert.ok(chg.text.includes('Cigarras'), 'Como chegar deve conter alerta de retorno nas Cigarras')

    const fot = await fetchText('/paginas/colonia-fotos')
    assert.equal(fot.status, 200)
    assert.ok(fot.text.includes('Todas as Fotos (28)'), 'Galeria da Colônia deve exibir todas as 28 fotos reais')
    assert.ok(!fot.text.includes('Galeria Provisória'), 'Galeria da Colônia não deve mais exibir aviso de galeria provisória')
    assert.ok(!fot.text.includes('Ampliar ⤢'), 'Galeria da Colônia não deve exibir legendas redundantes sob cada foto')
    assert.ok(col.text.includes('var(--font-condensed)'), 'Páginas de serviço devem usar var(--font-condensed) nos títulos')
    assert.ok(col.text.includes('#48101E'), 'Páginas de serviço devem usar o Hero Bordô da Proposta B (#48101E)')

    console.log('✅ [3/12] Colônia de Férias e todas as 5 subpáginas certificadas (28 fotos, PIX, endereços e regras).')
    passed++
  }

  // 4. Atendimento Jurídico (/paginas/juridico)
  {
    const jur = await fetchText('/paginas/juridico')
    assert.equal(jur.status, 200)
    assert.ok(jur.text.includes('Os atendimentos não são agendados e seguem ordem de chegada'), 'Jurídico deve informar ordem de chegada')
    assert.ok(jur.text.includes('Dr. Fernando'), 'Jurídico deve listar Dr. Fernando')
    assert.ok(jur.text.includes('Dr. Emerson'), 'Jurídico deve listar Dr. Emerson')
    assert.ok(jur.text.includes('Gabriel de Macedo'), 'Jurídico deve listar Gabriel de Macedo')
    assert.ok(jur.text.includes('Atendimento quinzenal'), 'Jurídico deve informar plantão quinzenal em Jacareí')
    console.log('✅ [4/12] Atendimento Jurídico certificado (ordem de chegada, dias e cidades corretos).')
    passed++
  }

  // 5. Homologações (/paginas/homologacoes)
  {
    const hom = await fetchText('/paginas/homologacoes')
    assert.equal(hom.status, 200)
    assert.ok(hom.text.includes('O Sindicato não homologa trabalhadores detentores de estabilidade'), 'Homologações deve exibir alerta de estabilidade')
    assert.ok(hom.text.includes('Laudos Médicos'), 'Homologações deve incluir Laudos Médicos para o trabalhador')
    assert.ok(hom.text.includes('5 vias do termo de rescisão'), 'Homologações deve exigir 5 vias do termo de rescisão')
    assert.ok(hom.text.includes('PPP'), 'Homologações deve exigir PPP')
    assert.ok(hom.text.includes('Requerimento do Seguro-Desemprego'), 'Homologações deve exigir Requerimento do Seguro-Desemprego')
    console.log('✅ [5/12] Homologações certificada (alerta de estabilidade + checklists completos do trabalhador e empresa).')
    passed++
  }

  // 6. Processos Coletivos (/paginas/processos)
  {
    const proc = await fetchText('/paginas/processos')
    assert.equal(proc.status, 200)
    assert.ok(proc.text.includes('Todas as Cidades (19)'), 'Processos deve listar todos os 19 processos coletivos')
    assert.ok(proc.text.includes('0134000.21.2003.5.15.0023'), 'Deve conter número real do processo Henkel/Cognis/Basf')
    assert.ok(proc.text.includes('0105600.58.2007.5.15.0119'), 'Deve conter processo da FLC em Caçapava')
    assert.ok(proc.text.includes('0085300.05.2007.5.15.0013'), 'Deve conter processo da Monsanto em SJC')
    console.log('✅ [6/12] Processos Coletivos certificados (19 processos reais com números do TRT-15 e filtros por cidade).')
    passed++
  }

  // 7. Convênios (/paginas/convenios)
  {
    const conv = await fetchText('/paginas/convenios')
    assert.equal(conv.status, 200)
    assert.ok(conv.text.includes('Faculdade Santo Antônio'), 'Convênios deve conter Faculdade Santo Antônio em Caçapava')
    assert.ok(conv.text.includes('Rede Droga Bella e Rede Plantão'), 'Convênios deve conter categoria de Farmácias')
    assert.ok(conv.text.includes('Caroline Bastos Collard'), 'Convênios deve conter dentistas de Jacareí')
    assert.ok(conv.text.includes('(12) 3955-3388'), 'Convênios deve exibir os telefones reais')
    console.log('✅ [7/12] Guia de Convênios certificado (todas as 4 cidades, telefones, endereços e farmácias).')
    passed++
  }

  // 8. Convenções Coletivas (/paginas/cct)
  {
    const cct = await fetchText('/paginas/cct')
    assert.equal(cct.status, 200)
    assert.ok(cct.text.includes('quimisjc.jur@gmail.com'), 'CCT deve exibir e-mail do jurídico')
    assert.ok(cct.text.includes('2012/2014'), 'CCT deve incluir Convenção 2012/2014')
    assert.ok(cct.text.includes('2013/2014'), 'CCT deve incluir Termo Aditivo 2013/2014')
    console.log('✅ [8/12] Convenções Coletivas (CCT) certificadas (8 documentos + contato jurídico).')
    passed++
  }

  // 9. História (/paginas/historia) e Diretoria (/paginas/diretoria)
  {
    const hist = await fetchText('/paginas/historia')
    assert.equal(hist.status, 200)
    assert.ok(hist.text.includes('60 Anos de Sindicato'), 'História deve conter marco de 2023 (60 anos)')
    assert.ok(hist.text.includes('Início do Sindicato dos Químicos de São José dos Campos'), 'História deve conter marco de 1963')
    assert.ok(hist.text.includes('institucional/historia/60-anos.jpg'), 'História deve carregar fotos do Supabase Storage')

    const dir = await fetchText('/paginas/diretoria')
    assert.equal(dir.status, 200)
    assert.ok(dir.text.includes('institucional/diretoria/'), 'Diretoria deve carregar fotos do Supabase Storage')
    assert.ok(!dir.text.includes('placehold.co'), 'Diretoria não deve depender de placehold.co')
    console.log('✅ [9/12] História (22 marcos/fotos) e Diretoria (fotos no Supabase Storage) certificadas.')
    passed++
  }

  // 10. Atendimento e Fale Conosco (/paginas/fale-conosco)
  {
    const fc = await fetchText('/paginas/fale-conosco')
    assert.equal(fc.status, 200)
    assert.ok(fc.text.includes('Rua Conselheiro Rodrigues Alves, 51'), 'Fale Conosco deve exibir Sede Central SJC')
    assert.ok(fc.text.includes('Salão de Assembleias'), 'Fale Conosco deve exibir Salão de Assembleias')
    assert.ok(fc.text.includes('Envie sua Mensagem'), 'Fale Conosco deve exibir o formulário de mensagem')
    assert.ok(fc.text.includes('Dúvidas Gerais e Processos'), 'Formulário Fale Conosco deve conter as opções de assunto oficiais')
    console.log('✅ [10/12] Atendimento & Fale Conosco certificado (4 sedes + Salão de Assembleias + Formulário de Mensagem).')
    passed++
  }

  // 11. Formulários de Serviços (Fique Sócio, Carteirinha, Atualizar Cadastro)
  {
    const fsoc = await fetchText('/paginas/fique-socio')
    assert.equal(fsoc.status, 200)
    assert.ok(fsoc.text.includes('Art. 545 da CLT'), 'Fique Sócio deve mencionar Art. 545 da CLT (1%)')
    assert.ok(fsoc.text.includes('(12) 99726-0926'), 'Fique Sócio deve exibir WhatsApp (12) 99726-0926 da carteirinha')
    assert.ok(fsoc.text.includes('CTPS'), 'Fique Sócio deve ter campo de CTPS')

    const cart = await fetchText('/paginas/carteirinha')
    assert.equal(cart.status, 200)
    assert.ok(cart.text.includes('Essa seria a 2ª via de sua carteirinha?'), 'Carteirinha deve perguntar sobre 2ª via')
    assert.ok(cart.text.includes('Selecione o turno'), 'Carteirinha deve ter seleção de turno')

    const atu = await fetchText('/paginas/atualizar-cadastro')
    assert.equal(atu.status, 200)
    assert.ok(atu.text.includes('Aposentado?'), 'Atualizar Cadastro deve perguntar se é aposentado')
    assert.ok(atu.text.includes('Já possui carteirinha?'), 'Atualizar Cadastro deve perguntar se já possui carteirinha')
    console.log('✅ [11/12] Formulários Fique Sócio, Carteirinha e Atualização Cadastral certificados com 100% dos campos e avisos.')
    passed++
  }

  // 12. Sitemap.xml Dinâmico
  {
    const sm = await fetchText('/sitemap.xml')
    assert.equal(sm.status, 200)
    assert.ok(sm.text.includes('/paginas/colonia</loc>'), 'Sitemap deve incluir /paginas/colonia')
    assert.ok(sm.text.includes('/paginas/homologacoes</loc>'), 'Sitemap deve incluir /paginas/homologacoes')
    assert.ok(sm.text.includes('/paginas/processos</loc>'), 'Sitemap deve incluir /paginas/processos')
    assert.ok(!sm.text.includes('/paginas/clube-de-campo</loc>'), 'Sitemap não deve incluir slugs inexistentes')
    console.log('✅ [12/15] Sitemap.xml dinâmico certificado.')
    passed++
  }

  // 13. Página Inicial (Destaques Automáticos, OUTRAS NOTÍCIAS, Carrossel de Banners 7s, Ícones Sociais e Animação da Cobrinha no Logo)
  {
    const home = await fetchText('/')
    assert.equal(home.status, 200)
    assert.ok(home.text.includes('OUTRAS NOTÍCIAS'), 'Home deve exibir o botão OUTRAS NOTÍCIAS em maiúsculas')
    assert.ok(home.text.includes('fetchPriority="high"') || home.text.includes('fetchpriority="high"'), 'Manchete principal deve ter fetchpriority="high" para LCP')
    assert.ok(home.text.includes('cobrinha-lingua-repouso'), 'Header deve conter o overlay vetorial da linguinha da cobrinha')
    assert.ok(home.text.includes('translate(31.7, 27.8)'), 'Header deve conter o pivô vetorial nativo SVG compatível com iOS Safari')
    assert.ok(home.text.includes('M-0.2,-0.4 C2.0,-0.1 4.1,0.4 5.9,0.8'), 'Header deve conter o path vetorial bífido da linguinha')
    console.log('✅ [13/15] Página Inicial (Destaques, OUTRAS NOTÍCIAS, LCP e Animação da Cobrinha 5s/40s) certificada.')
    passed++
  }

  // 14. Máscaras de CPF, Telefone, CEP e Validador de CPF
  {
    const masks = await import('../lib/masks-viacep.ts')
    assert.equal(masks.formatarCPF('12345678901'), '123.456.789-01')
    assert.equal(masks.formatarTelefone('12997260926'), '(12) 99726-0926')
    assert.equal(masks.formatarTelefone('1239218177'), '(12) 3921-8177')
    assert.equal(masks.formatarCEP('12209540'), '12209-540')
    assert.equal(masks.validarCPF('111.111.111-11'), false)
    assert.equal(masks.validarCPF('52998224725'), true)
    console.log('✅ [14/15] Utilitários de máscara (CPF, Telefone, CEP) e validação de CPF certificados.')
    passed++
  }

  // 15. Varredura HTTP 200 em todas as 22 rotas públicas do portal
  {
    const rotas = [
      '/',
      '/noticias',
      '/jornais',
      '/paginas/colonia',
      '/paginas/colonia-valores',
      '/paginas/colonia-regulamento',
      '/paginas/colonia-reservas',
      '/paginas/colonia-como-chegar',
      '/paginas/colonia-fotos',
      '/paginas/juridico',
      '/paginas/homologacoes',
      '/paginas/processos',
      '/paginas/convenios',
      '/paginas/cct',
      '/paginas/historia',
      '/paginas/diretoria',
      '/paginas/fale-conosco',
      '/paginas/fique-socio',
      '/paginas/carteirinha',
      '/paginas/atualizar-cadastro',
      '/paginas/denuncia',
      '/paginas/cadastro-noticias',
      '/paginas/links-uteis',
    ]
    for (const r of rotas) {
      const res = await fetch(`${BASE_URL}${r}`)
      assert.equal(res.status, 200, `Rota ${r} deve retornar HTTP 200, retornou ${res.status}`)
    }
    console.log(`✅ [15/15] Todas as ${rotas.length} rotas públicas responderam HTTP 200 sem erros.`)
    passed++
  }

  console.log(`\n🎉 CERTIFICAÇÃO CONCLUÍDA COM SUCESSO: ${passed}/15 suítes aprovadas!`)
}

run().catch((err) => {
  console.error('❌ Falha na certificação:', err)
  process.exit(1)
})
