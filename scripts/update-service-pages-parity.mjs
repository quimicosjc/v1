import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const assetMap = JSON.parse(fs.readFileSync('/tmp/migrated_assets_map.json', 'utf8'))

function getAsset(originalUrl) {
  return assetMap[originalUrl] || originalUrl
}

async function atualizarPagina(slug, campos) {
  const { data, error } = await supabase
    .from('conteudos')
    .update({
      ...campos,
      atualizado_em: new Date().toISOString(),
    })
    .eq('slug', slug)
    .in('tipo', ['institucional', 'avulsa'])
    .select('id, slug, titulo')

  if (error) {
    console.error(`[ERRO] Falha ao atualizar ${slug}:`, error.message)
  } else {
    console.log(`[OK] Página atualizada: ${slug} (${data?.[0]?.titulo || ''})`)
  }
}

async function main() {
  // =========================================================================
  // 1. COLÔNIA DE FÉRIAS — VISÃO GERAL (/paginas/colonia)
  // =========================================================================
  const fotoCaragua8 = getAsset('https://quimicosjc.org.br/assets/img/colonia-caragua-8.jpg')
  const fotoCaragua9 = getAsset('https://quimicosjc.org.br/assets/img/colonia-caragua-9.jpg')
  const fotoCaragua10 = getAsset('https://quimicosjc.org.br/assets/img/colonia-caragua-10.jpg')
  const fotoSS5 = getAsset('https://quimicosjc.org.br/assets/img/colonia-sao-sebastiao-5.jpg')
  const fotoSS6 = getAsset('https://quimicosjc.org.br/assets/img/colonia-sao-sebastiao-6.jpg')
  const fotoSS7 = getAsset('https://quimicosjc.org.br/assets/img/colonia-sao-sebastiao-7.jpg')

  const corpoColonia = `
<div style="background: #65172A; color: #ffffff; border-left: 6px solid #F5B800; border-radius: 8px; padding: 24px 28px; margin: 0 0 24px 0; box-shadow: 0 4px 14px rgba(101,23,42,0.14);">
  <h2 style="font-family: var(--font-condensed), sans-serif; color: #ffffff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 14px 0; border: none; padding: 0;">
    Reservas direto na Colônia de Férias
  </h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
    <div style="background: rgba(255,255,255,0.08); padding: 14px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14);">
      <div style="font-family: var(--font-condensed), sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #f2d4db; margin-bottom: 4px;">Endereço</div>
      <strong style="font-size: 15px; color: #ffffff;">Avenida 6, 250, Porto Novo – Caraguatatuba/SP</strong>
    </div>
    <div style="background: rgba(255,255,255,0.08); padding: 14px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14);">
      <div style="font-family: var(--font-condensed), sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #f2d4db; margin-bottom: 4px;">Telefone e WhatsApp</div>
      <a href="https://api.whatsapp.com/send?phone=551238612218&text=Ol%C3%A1%20estou%20interessado%20na%20reserva%20da%20col%C3%B4nia%20de%20f%C3%A9rias!" target="_blank" rel="noopener noreferrer" style="font-family: var(--font-condensed), sans-serif; font-size: 22px; font-weight: 800; color: #F5B800; text-decoration: none;">
        (12) 3861-2218 ↗
      </a>
    </div>
    <div style="background: rgba(255,255,255,0.08); padding: 14px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14);">
      <div style="font-family: var(--font-condensed), sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #f2d4db; margin-bottom: 4px;">Atendimento</div>
      <strong style="font-size: 15px; color: #ffffff;">Quarta a domingo, das 10h às 18h</strong>
    </div>
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0 28px 0;">
  <div style="background: #fdf2f2; border: 1px solid #f0a8a8; border-left: 5px solid #861E32; border-radius: 6px; padding: 16px 20px;">
    <strong style="font-family: var(--font-condensed), sans-serif; color: #861E32; font-size: 17px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 4px;">Não é permitido levar animais</strong>
    <span style="font-size: 14px; color: #4a1c1c;">Proibida a entrada ou permanência de animais nas unidades da Colônia.</span>
  </div>
  <div style="background: #fff9ea; border: 1px solid #f3d489; border-left: 5px solid #d97706; border-radius: 6px; padding: 16px 20px;">
    <strong style="font-family: var(--font-condensed), sans-serif; color: #825914; font-size: 17px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 4px;">Reservas apenas por telefone ou WhatsApp</strong>
    <span style="font-size: 14px; color: #5a3d0a;">Não são feitas reservas nas sedes nem por e-mail, Facebook ou SMS.</span>
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 20px 0;">
  <img src="${fotoCaragua8}" alt="Colônia de Férias Caraguatatuba" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
  <img src="${fotoCaragua9}" alt="Colônia de Férias Caraguatatuba" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
  <img src="${fotoCaragua10}" alt="Colônia de Férias Caraguatatuba" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
  <img src="${fotoSS5}" alt="Colônia de Férias São Sebastião" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
  <img src="${fotoSS6}" alt="Colônia de Férias São Sebastião" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
  <img src="${fotoSS7}" alt="Colônia de Férias São Sebastião" style="width: 100%; height: 190px; object-fit: cover; border-radius: 6px; margin: 0;" />
</div>

<p style="text-align: center; margin-top: 24px;">
  <a href="/paginas/colonia-fotos" style="display: inline-block; background: #861e32; color: #ffffff; padding: 12px 26px; border-radius: 6px; font-family: var(--font-condensed), sans-serif; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: none;">
    Mais fotos →
  </a>
</p>
`.trim()

  await atualizarPagina('colonia', {
    titulo: 'Colônia de Férias',
    subtitulo: 'Unidades em Caraguatatuba e São Sebastião para sócios e dependentes.',
    banner_url: fotoCaragua8,
    fotos_json: JSON.stringify([{ url: fotoCaragua8, foco: 50, legenda: '' }]),
    corpo: corpoColonia,
  })

  // =========================================================================
  // 2. COLÔNIA — COMO RESERVAR (/paginas/colonia-reservas)
  // =========================================================================
  const corpoColoniaReservas = `
<div style="background: #65172A; color: #ffffff; border-left: 6px solid #F5B800; border-radius: 8px; padding: 22px 26px; margin-bottom: 24px;">
  <p style="margin: 0 0 10px 0; font-size: 16.5px; color: #ffffff;">
    Reservas para sócios e dependentes direto na Colônia pelo telefone / WhatsApp
    <a href="https://api.whatsapp.com/send?phone=551238612218&text=Ol%C3%A1%20estou%20interessado%20na%20reserva%20da%20col%C3%B4nia%20de%20f%C3%A9rias!" target="_blank" rel="noopener noreferrer" style="color: #F5B800; font-weight: 800; text-decoration: underline;">(12) 3861-2218</a>,
    de <strong>quarta a domingo, das 10h às 18h</strong>.
  </p>
  <p style="margin: 0; font-size: 14px; color: #f2d4db;">
    <strong>Endereço:</strong> Avenida 6, 250, Porto Novo – Caraguatatuba/SP • Não são feitas reservas por e-mail, redes sociais, SMS ou nas sedes.
  </p>
</div>

<h2>Regras de Reserva</h2>
<ul>
  <li>As reservas só podem ser feitas com <strong>até um mês de antecedência</strong> da data desejada;</li>
  <li><strong>Não serão feitas reservas na sede ou nas subsedes</strong>, somente na Colônia pelo nº <strong>(12) 3861-2218 (WhatsApp)</strong>;</li>
  <li><strong>Conveniados</strong> só podem realizar reservas com <strong>15 dias de antecedência</strong> no máximo;</li>
  <li>Formas de pagamento e valor total são informados no ato da reserva;</li>
  <li>O comprovante de pagamento deve ser enviado pelo WhatsApp <strong>(12) 3861-2218</strong> ou e-mail <a href="mailto:quimisjc.colonia@gmail.com">quimisjc.colonia@gmail.com</a>;</li>
  <li>Não é permitida a hospedagem sem a <strong>presença do sócio titular responsável pela reserva</strong>;</li>
  <li>Obrigatória a apresentação de <strong>documento com foto</strong> na chegada;</li>
  <li>Confira as diárias para associados, conveniados e convidados na aba <a href="/paginas/colonia-valores">Valores</a>;</li>
  <li>Não é permitido utilizar os quartos acima da capacidade;</li>
  <li>Todos os hóspedes do período devem constar na ficha de reserva;</li>
  <li>Estacionamento com vaga para <strong>01 veículo por apartamento</strong>;</li>
  <li><strong>Animais são proibidos</strong> nos quartos e dependências da Colônia;</li>
  <li>O pagamento e envio do comprovante devem ocorrer até a data limite informada na reserva, sob pena de cancelamento automático da vaga;</li>
  <li>Comprovantes enviados por e-mail após as <strong>16h30</strong> do dia limite não serão validados se o dia seguinte ultrapassar o vencimento;</li>
  <li>Não é permitido efetuar reserva para terceiros.</li>
</ul>

<h2>Pagamento e Comprovante</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin-top: 16px;">
  <div style="background: #faf8f9; border: 1px solid #e4dce0; border-top: 4px solid #861e32; border-radius: 6px; padding: 20px;">
    <h3 style="font-family: var(--font-condensed), sans-serif; text-transform: uppercase; margin: 0 0 10px 0; font-size: 19px; color: #861e32;">Conta Bancária / PIX</h3>
    <p style="margin: 0; font-size: 15px; line-height: 1.8;">
      <strong>Banco:</strong> C.E.F. (Caixa Econômica Federal)<br/>
      <strong>Agência:</strong> 0351 • <strong>Operação:</strong> 013<br/>
      <strong>Conta:</strong> 5000120-6<br/>
      <strong>Chave PIX (CNPJ):</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #cbd7de; border-radius: 4px; font-weight: 800; color: #861e32;">53.322.442/0001-10</code>
    </p>
  </div>
  <div style="background: #faf8f9; border: 1px solid #e4dce0; border-top: 4px solid #65172A; border-radius: 6px; padding: 20px;">
    <h3 style="font-family: var(--font-condensed), sans-serif; text-transform: uppercase; margin: 0 0 10px 0; font-size: 19px; color: #65172A;">Envio do Comprovante</h3>
    <p style="margin: 0 0 10px 0; font-size: 14.5px; line-height: 1.6;">
      Envie o comprovante dentro do prazo limite por um dos canais abaixo:
    </p>
    <p style="margin: 0; font-size: 15px; line-height: 1.8;">
      <strong>WhatsApp:</strong> <a href="https://wa.me/551238612218" target="_blank" rel="noopener noreferrer">(12) 3861-2218</a><br/>
      <strong>E-mail:</strong> <a href="mailto:quimisjc.colonia@gmail.com">quimisjc.colonia@gmail.com</a>
    </p>
  </div>
</div>
`.trim()

  const tagsColoniaReservas = {
    tipoPagina: 'contacts',
    grupo: 'Colônia de Férias',
    records: [
      {
        id: '1',
        name: 'Reservas — Colônia de Férias',
        description: '',
        phone: '(12) 3861-2218',
        whatsapp: '(12) 3861-2218',
        hours: 'Quarta a domingo, das 10h às 18h',
        address: 'Avenida 6, 250, Porto Novo - Caraguatatuba/SP',
        email: 'quimisjc.colonia@gmail.com',
        url: 'https://www.google.com/maps/search/?api=1&query=Avenida+6+250+Porto+Novo+Caraguatatuba+SP',
        active: true,
      },
    ],
  }

  await atualizarPagina('colonia-reservas', {
    titulo: 'Reservas — Colônia de Férias',
    subtitulo: 'Regras de antecedência, contato direto da Colônia e dados bancários para confirmação.',
    corpo: corpoColoniaReservas,
    tags_json: JSON.stringify(tagsColoniaReservas),
  })

  // =========================================================================
  // 3. COLÔNIA — VALORES E DETALHES (/paginas/colonia-valores)
  // =========================================================================
  const corpoColoniaValores = `
<div style="background: #fff9ea; border: 1px solid #f3d489; border-left: 5px solid #d97706; border-radius: 6px; padding: 16px 20px; margin: 0 0 24px 0;">
  <strong style="font-family: var(--font-condensed), sans-serif; color: #825914; font-size: 17px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">Convidados e Temporada</strong>
  <ul style="margin: 0; padding-left: 20px; font-size: 14.5px; color: #5a3d0a;">
    <li><strong>Convidados (não sócios / não dependentes):</strong> <strong>R$ 40,00 por pessoa / por dia</strong>;</li>
    <li><strong>Titular:</strong> É obrigatória a presença do sócio titular durante toda a estadia;</li>
    <li><strong>Fim de Ano e Carnaval:</strong> Valores diferenciados e vagas definidas por sorteio.</li>
  </ul>
</div>

<h2>Estrutura dos Quartos</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin: 16px 0 28px 0;">
  <div style="background: #eef7f2; border: 1px solid #bce0cc; border-top: 4px solid #23634e; border-radius: 6px; padding: 20px;">
    <h3 style="font-family: var(--font-condensed), sans-serif; text-transform: uppercase; margin: 0 0 10px 0; font-size: 19px; color: #1a3a2a;">Nos Quartos</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #1a3a2a; line-height: 1.8;">
      <li><strong>Ar-condicionado</strong></li>
      <li><strong>Geladeira (ou frigobar)</strong></li>
      <li><strong>Micro-ondas</strong></li>
      <li><strong>TV LCD</strong></li>
      <li><strong>Banheiro privativo</strong></li>
    </ul>
  </div>

  <div style="background: #fdf2f2; border: 1px solid #f0a8a8; border-top: 4px solid #861e32; border-radius: 6px; padding: 20px;">
    <h3 style="font-family: var(--font-condensed), sans-serif; text-transform: uppercase; margin: 0 0 10px 0; font-size: 19px; color: #861e32;">O que levar</h3>
    <p style="margin: 0; font-size: 15px; color: #4a1c1c; line-height: 1.7;">
      <strong>Levar roupa de cama</strong> (fronhas, lençóis, cobertas), <strong>toalhas</strong> e <strong>itens de higiene pessoal</strong>.
    </p>
  </div>
</div>

<h2>Internet Sem Fio (Wi-Fi)</h2>
<ul>
  <li>O Sindicato não se responsabiliza pelo conteúdo transmitido nem por eventuais danos ou configurações nos aparelhos dos hóspedes;</li>
  <li>O sinal é disponibilizado nas áreas comuns da Colônia, podendo variar conforme o ambiente e o alcance de cada aparelho nos apartamentos;</li>
  <li>A banda é compartilhada entre os hóspedes conectados;</li>
  <li>Em caso de tempestades com raios, os equipamentos podem ser desligados preventivamente para proteção da rede;</li>
  <li><strong>O uso do Wi-Fi é gratuito durante toda a estadia.</strong></li>
</ul>
`.trim()

  const tagsValores = {
    tipoPagina: 'prices',
    records: [
      {
        id: '1',
        unit: 'São Sebastião',
        public: 'Associado dos Químicos',
        type: 'Quarto para Casal',
        capacity: 'Apenas 02 pessoas, sem crianças',
        value: 80,
        charge: 'a diária',
        notes: 'Exclusivo para associado titular e cônjuge.',
        active: true,
      },
      {
        id: '2',
        unit: 'São Sebastião',
        public: 'Associado dos Químicos',
        type: 'Quarto de 03 a 06 pessoas',
        capacity: 'De 03 a 06 pessoas',
        value: 100,
        charge: 'a diária',
        notes: 'Acomodação familiar completa.',
        active: true,
      },
      {
        id: '3',
        unit: 'Caraguatatuba',
        public: 'Associado dos Químicos',
        type: 'Quarto para 04 pessoas',
        capacity: 'Até 04 pessoas',
        value: 100,
        charge: 'a diária',
        notes: 'Unidade Porto Novo — Caraguatatuba.',
        active: true,
      },
      {
        id: '4',
        unit: 'São Sebastião',
        public: 'Conveniados',
        type: 'Quarto para Casal (Conveniado)',
        capacity: 'Apenas 02 pessoas, sem crianças',
        value: 100,
        charge: 'a diária',
        notes: 'Reserva com até 15 dias de antecedência.',
        active: true,
      },
      {
        id: '5',
        unit: 'São Sebastião',
        public: 'Conveniados',
        type: 'Quarto de 03 a 06 pessoas (Conveniado)',
        capacity: 'De 03 a 06 pessoas',
        value: 120,
        charge: 'a diária',
        notes: 'Reserva com até 15 dias de antecedência.',
        active: true,
      },
      {
        id: '6',
        unit: 'Ambas as Unidades',
        public: 'Convidados (Não sócios / não dependentes)',
        type: 'Taxa de Convidado',
        capacity: 'Por pessoa / Por dia',
        value: 40,
        charge: 'por pessoa / dia',
        notes: 'É obrigatória a presença do sócio titular no período da estadia.',
        active: true,
      },
    ],
  }

  await atualizarPagina('colonia-valores', {
    titulo: 'Valores — Colônia de Férias',
    subtitulo: 'Diárias para associados, conveniados e convidados, estrutura dos quartos e uso do Wi-Fi.',
    corpo: corpoColoniaValores,
    tags_json: JSON.stringify(tagsValores),
  })

  // =========================================================================
  // 4. COLÔNIA — REGULAMENTO INTERNO (/paginas/colonia-regulamento)
  // =========================================================================
  const corpoColoniaRegulamento = `
<ul>
  <li>Os apartamentos têm capacidade diferenciada, podendo alojar de <strong>2 a 6 pessoas</strong>, incluindo-se os menores. Somente estadia.</li>
  <li><strong>Períodos de permanência na Colônia de Férias:</strong>
    <ul>
      <li><strong>Na temporada:</strong> de 2 (dois) a 5 (cinco) dias corridos;</li>
      <li><strong>Fora da temporada:</strong> no mínimo 2 (dois) dias e no máximo 25 (vinte e cinco) dias corridos.</li>
    </ul>
  </li>
  <li><strong>Horário das Diárias:</strong> A diária começa a contar a partir das <strong>11h</strong> da data de entrada e se encerra às <strong>11h</strong> do dia seguinte, porém na data contratada para saída o sócio pode sair até as <strong>18h</strong> (tempo cedido pela entidade além da diária na data de saída).</li>
  <li>O sócio deverá marcar sua reserva pelo telefone <strong>(12) 3861-2218 (fixo / WhatsApp)</strong> e efetuar o pagamento até a data do vencimento sob risco de cancelamento sem prévio aviso, e o comprovante deverá ser enviado para confirmação da reserva ao e-mail (<a href="mailto:quimisjc.colonia@gmail.com">quimisjc.colonia@gmail.com</a>) ou WhatsApp da colônia.</li>
  <li>Nas datas específicas referentes a <strong>Carnaval e Réveillon</strong>, será realizado sorteio. Datas para inscrição e sorteio deverão ser confirmadas através dos telefones de contato.</li>
  <li>Os sócios deverão se apresentar à recepção da Colônia de Férias munidos de <strong>documentos que os identifiquem, com fotografia</strong>.</li>
  <li><strong>Horário de Entrada:</strong> A entrada dos sócios na Colônia de Férias será das <strong>11h às 22h</strong>.</li>
  <li>Os sócios deverão levar <strong>lençóis, fronhas, cobertores e toalhas</strong>. Quem necessitar fazer mamadeira deverá levar caneca, colher e outros utensílios necessários.</li>
  <li>Durante a estada, os sócios são responsáveis pela limpeza e conservação do seu apartamento. Na saída, deverão devolver intacto todo o material que lhes foi confiado (qualquer dano, quebra ou falta de equipamento será imediatamente ressarcido). Caso na vistoria se verifique excesso de sujeira, será cobrada uma <strong>taxa extra de R$ 30,00</strong> para efeito de limpeza. A responsabilidade dos sócios(as), dependentes e convidados(as) inicia-se desde o momento de sua entrada na colônia até o fim de sua estadia.</li>
  <li><strong>A guia de inscrição:</strong>
    <ul>
      <li>Não pode ser adulterada;</li>
      <li>Os hóspedes não poderão ser substituídos sem que haja autorização expressa da Administração da Colônia de Férias;</li>
      <li>O sócio não poderá levar para o apartamento convidado ou visitante sem autorização da Administração da Colônia de Férias.</li>
    </ul>
  </li>
  <li><strong>São considerados dependentes do sócio:</strong>
    <ul>
      <li><strong>Sócios solteiros:</strong> pai, mãe e filhos;</li>
      <li><strong>Sócios casados:</strong> cônjuge e filhos.</li>
    </ul>
  </li>
  <li><strong>Em caso de desistência</strong> (avisada com antecedência de 48 horas), não haverá devolução da importância paga, ficando em aberto o valor a ser gozado no período de <strong>1 (um) ano</strong> a contar da data em que a reserva for feita, respeitando os reajustes posteriores.</li>
  <li>A Administração da Colônia de Férias não se responsabiliza por danos causados aos veículos, objetos perdidos ou extraviados na área da Colônia de Férias.</li>
  <li>Quaisquer reclamações e/ou sugestões deverão ser encaminhadas à administração da Colônia de Férias ou ao Sindicato pelos canais de comunicação.</li>
  <li>A responsabilidade com os menores é exclusiva dos pais ou responsáveis legais. O Sindicato adverte aos pais o dever de orientarem seus filhos para o seu total resguardo e bem-estar.</li>
  <li>As chaves são de inteira responsabilidade dos(as) sócios(as). Em caso de extravio, o valor da cópia ou troca da fechadura deverá ser ressarcido.</li>
  <li><strong>Não é permitida a entrada de animais</strong> nas dependências da Colônia de Férias.</li>
  <li>Convidados somente poderão se hospedar na Colônia de Férias juntamente com o sócio.</li>
  <li>O não cumprimento deste Regulamento acarretará sanções punitivas a critério da diretoria do Sindicato dos Químicos.</li>
</ul>

<h2>Internet Sem Fio (Wi-Fi)</h2>
<ul>
  <li>O Sindicato não se responsabiliza pelo conteúdo transmitido, bem como pelos riscos que a internet pode oferecer, ficando sob responsabilidade do usuário/sócio a segurança e proteção de seus equipamentos;</li>
  <li>O Sindicato não se responsabiliza por danos que possam ocorrer nos equipamentos;</li>
  <li>Nenhum funcionário do Sindicato ou da Colônia tem autorização de prestar manutenção, configuração ou suporte técnico no equipamento do usuário/sócio;</li>
  <li>O sinal da internet é garantido nas dependências da colônia, podendo variar devido a interferências do ambiente; como cada aparelho possui uma limitação de potência, não há condições exatas de funcionamento dentro dos apartamentos;</li>
  <li>A velocidade de navegação é dividida em partes iguais para todos que estiverem utilizando a internet;</li>
  <li>Se necessário, para garantir a integridade dos equipamentos da colônia em caso de chuva com raios, o funcionário da colônia pode desligar o equipamento sem prévio aviso, retornando a ligá-lo quando for seguro;</li>
  <li>Não será cobrado pelo uso da internet durante a estadia do sócio.</li>
</ul>
<p><strong>Boa estadia!</strong></p>
`.trim()

  await atualizarPagina('colonia-regulamento', {
    titulo: 'Regulamento — Colônia de Férias',
    subtitulo: 'Normas de utilização, horários de entrada e saída, conservação e convivência nas unidades.',
    corpo: corpoColoniaRegulamento,
  })

  // =========================================================================
  // 5. COLÔNIA — COMO CHEGAR (/paginas/colonia-como-chegar)
  // =========================================================================
  const corpoColoniaComoChegar = `
<div style="background: #fdf2f2; border: 1px solid #f0a8a8; border-left: 5px solid #861E32; border-radius: 6px; padding: 16px 20px; margin: 0 0 20px 0;">
  <strong style="font-family: var(--font-condensed), sans-serif; color: #861E32; font-size: 18px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 4px;">Atenção ao chegar na Unidade de São Sebastião (Enseada)</strong>
  <span style="font-size: 15px; color: #4a1c1c;">
    <strong>Faça o retorno nas Cigarras — NÃO entre direto atravessando a faixa contrária da rodovia!</strong>
  </span>
</div>
`.trim()

  const tagsComoChegar = {
    tipoPagina: 'locations',
    records: [
      {
        name: 'Unidade São Sebastião (Enseada)',
        description: 'Atenção: Faça o retorno no bairro Cigarras, NÃO entre direto atravessando a faixa contrária.',
        address: 'Rua José Paulino Ferreira, 152 – Enseada – São Sebastião/SP – CEP 11602-664',
        url: 'https://www.google.com/maps/search/?api=1&query=Rua+Jose+Paulino+Ferreira+152+Enseada+Sao+Sebastiao+SP',
      },
      {
        name: 'Unidade Caraguatatuba (Porto Novo)',
        description: 'Central de Reservas — Tel/WhatsApp: (12) 3861-2218 (Quarta a domingo, das 10h às 18h).',
        address: 'Avenida 6, 250 – Porto Novo – Caraguatatuba/SP',
        url: 'https://www.google.com/maps/search/?api=1&query=Avenida+6+250+Porto+Novo+Caraguatatuba+SP',
      },
    ],
  }

  await atualizarPagina('colonia-como-chegar', {
    titulo: 'Como Chegar — Colônia de Férias',
    subtitulo: 'Endereços e mapas das unidades de São Sebastião e Caraguatatuba.',
    corpo: corpoColoniaComoChegar,
    tags_json: JSON.stringify(tagsComoChegar),
  })

  // =========================================================================
  // 6. COLÔNIA — GALERIA DE FOTOS (/paginas/colonia-fotos — 28 FOTOS REAIS)
  // =========================================================================
  const fotosColoniaRecords = []
  for (let i = 1; i <= 20; i++) {
    const orig = `https://quimicosjc.org.br/assets/img/colonia-caragua-${i}.jpg`
    fotosColoniaRecords.push({
      id: `caragua-${i}`,
      unidade: 'Caraguatatuba',
      url: getAsset(orig),
      titulo: `Colônia de Férias Caraguatatuba`,
      legenda: 'Caraguatatuba/SP',
      provisoria: false,
    })
  }
  for (let i = 1; i <= 8; i++) {
    const orig = `https://quimicosjc.org.br/assets/img/colonia-sao-sebastiao-${i}.jpg`
    fotosColoniaRecords.push({
      id: `saosebastiao-${i}`,
      unidade: 'São Sebastião',
      url: getAsset(orig),
      titulo: `Colônia de Férias São Sebastião`,
      legenda: 'São Sebastião/SP',
      provisoria: false,
    })
  }

  await atualizarPagina('colonia-fotos', {
    titulo: 'Fotos — Colônia de Férias',
    subtitulo: '',
    corpo: '',
    tags_json: JSON.stringify({
      tipoPagina: 'gallery',
      records: fotosColoniaRecords,
    }),
  })

  // =========================================================================
  // 7. ATENDIMENTO JURÍDICO (/paginas/juridico)
  // =========================================================================
  const corpoJuridico = `
<div style="background: #fff9ea; border: 1px solid #f3d489; border-left: 5px solid #d97706; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
  <span style="font-size: 15.5px; color: #5a3d0a;">
    Para utilizar os serviços advocatícios, basta ir até uma de nossas sedes nos dias e horários de atendimento de cada cidade. <strong>Os atendimentos não são agendados e seguem ordem de chegada.</strong>
  </span>
</div>
`.trim()

  const tagsJuridico = {
    tipoPagina: 'hours',
    records: [
      {
        id: '1',
        name: 'Dr. Fernando',
        specialty: 'Processo Coletivo',
        schedules: [
          {
            day: 'Segunda-feira e Quarta-feira',
            hours: 'das 09h às 12h e das 14h às 16h30',
            city: 'São José dos Campos',
          },
        ],
        active: true,
      },
      {
        id: '2',
        name: 'Dr. Emerson',
        specialty: 'Processos Trabalhistas',
        schedules: [
          {
            day: 'Quinta-feira',
            hours: 'das 09h às 12h',
            city: 'São José dos Campos',
          },
          {
            day: 'Quarta-feira (Atendimento quinzenal)',
            hours: 'das 14h às 16h30',
            city: 'Jacareí',
          },
        ],
        active: true,
      },
      {
        id: '3',
        name: 'Dr. Gabriel de Macedo',
        specialty: 'Processo Previdenciário',
        schedules: [
          {
            day: 'Terça-feira',
            hours: 'das 09h às 12h',
            city: 'Jacareí',
          },
          {
            day: 'Terça-feira',
            hours: 'das 14h às 16h30',
            city: 'São José dos Campos',
          },
        ],
        active: true,
      },
    ],
  }

  await atualizarPagina('juridico', {
    titulo: 'Atendimento Jurídico',
    subtitulo: 'Plantão trabalhista, coletivo e previdenciário em São José dos Campos e Jacareí.',
    corpo: corpoJuridico,
    tags_json: JSON.stringify(tagsJuridico),
  })

  // =========================================================================
  // 8. HOMOLOGAÇÕES (/paginas/homologacoes)
  // =========================================================================
  const corpoHomologacoes = `
<div style="background: #fdf2f2; border: 1px solid #f0a8a8; border-left: 5px solid #861E32; border-radius: 6px; padding: 18px 22px; margin-bottom: 28px;">
  <ul style="margin: 0; padding-left: 20px; font-size: 15.5px; color: #4a1c1c; line-height: 1.7;">
    <li><strong>As homologações devem ser agendadas;</strong></li>
    <li><strong>O Sindicato não homologa trabalhadores detentores de estabilidade, tais como CIPA, Auxílio-acidente, doença ocupacional, entre outros.</strong></li>
  </ul>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; margin-bottom: 24px;">
  <div style="background: #ffffff; border: 1px solid #e4dce0; border-top: 4px solid #65172A; border-radius: 6px; padding: 22px;">
    <h2 style="font-family: var(--font-condensed), sans-serif; font-size: 22px; font-weight: 800; text-transform: uppercase; color: #30252a; margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 1px solid #f0e8ea;">
      Documentos do Trabalhador
    </h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 15.5px; line-height: 1.9; color: #30252a;">
      <li><strong>Carteira de Trabalho (CTPS);</strong></li>
      <li><strong>CPF;</strong></li>
      <li><strong>R.G.;</strong></li>
      <li><strong>Laudos Médicos</strong> (caso tenha problemas de saúde).</li>
    </ul>
  </div>

  <div style="background: #ffffff; border: 1px solid #e4dce0; border-top: 4px solid #861e32; border-radius: 6px; padding: 22px;">
    <h2 style="font-family: var(--font-condensed), sans-serif; font-size: 22px; font-weight: 800; text-transform: uppercase; color: #30252a; margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 1px solid #f0e8ea;">
      Documentos da Empresa
    </h2>
    <ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #30252a;">
      <li><strong>5 vias do termo de rescisão</strong> (sendo uma via para o Sindicato, uma via para a empresa e três vias para o trabalhador);</li>
      <li><strong>3 Cópias</strong> do Comprovante de pagamento das verbas rescisórias;</li>
      <li><strong>3 Cópias</strong> do Comprovante de pagamento da multa de 40% do FGTS (Guia de recolhimento);</li>
      <li><strong>3 Cópias</strong> do Demonstrativo do Trabalhador de Recolhimento FGTS Rescisório;</li>
      <li><strong>3 Cópias</strong> do Extrato da conta vinculada para fins rescisórios – FGTS;</li>
      <li><strong>3 Cópias</strong> da Chave de identificação;</li>
      <li><strong>3 Cópias</strong> do ASO – Atestado de Saúde Ocupacional;</li>
      <li><strong>3 Cópias</strong> do Aviso Prévio;</li>
      <li><strong>PPP</strong> (Perfil Profissiográfico Previdenciário);</li>
      <li><strong>Carteira de Trabalho atualizada;</strong></li>
      <li><strong>Requerimento do Seguro-Desemprego;</strong></li>
      <li>Se for pedido de demissão, trazer a <strong>carta do pedido</strong>;</li>
      <li><strong>Carta Preposto;</strong></li>
      <li><strong>Carta de apresentação.</strong></li>
    </ul>
  </div>
</div>

<div style="background: #fff9ea; border: 1px solid #f3d489; border-radius: 6px; padding: 14px 18px; font-size: 14.5px; color: #5a3d0a;">
  <strong>Obs.:</strong> Não é necessário trazer cópia da Carteira de Trabalho e do requerimento do Seguro-Desemprego.
</div>
`.trim()

  await atualizarPagina('homologacoes', {
    titulo: 'Homologações',
    subtitulo: 'Documentos necessários para conferência de rescisão contratual.',
    corpo: corpoHomologacoes,
  })

  // =========================================================================
  // 9. PROCESSOS COLETIVOS (/paginas/processos — 19 PROCESSOS REAIS)
  // =========================================================================
  const corpoProcessos = `
<p>Informações detalhadas sobre processos: <strong>(12) 3921-8177</strong> (segunda a sexta-feira, das 08h00 às 17h00).</p>
`.trim()

  const tagsProcessos = {
    tipoPagina: 'processes',
    records: [
      // JACAREÍ (6)
      {
        id: 'jac-1',
        city: 'Jacareí',
        company: 'Henkel / Cognis / Basf',
        number: '0134000.21.2003.5.15.0023',
        court: '1ª VT JACAREÍ',
        subject: 'Correção da multa de 40% do FGTS.',
        status: 'Sindicato ganhou. Trabalhadores recebendo.',
        active: true,
      },
      {
        id: 'jac-2',
        city: 'Jacareí',
        company: 'White Martins',
        number: '0167500.59.1995.5.15.0023',
        court: '1ª VT JACAREÍ',
        subject: 'Ação Coletiva Trabalhista',
        status: 'Sindicato ganhou. Pagamentos já efetuados.',
        active: true,
      },
      {
        id: 'jac-3',
        city: 'Jacareí',
        company: 'Teknia',
        number: '0011365-18.2015.5.15.0023',
        court: '1ª VT JACAREÍ',
        subject: 'Adicionais de periculosidade e insalubridade',
        status: 'Aguardando realização de perícia na empresa. Sindicato perdeu na 1ª instância e recorreu para 2ª instância.',
        active: true,
      },
      {
        id: 'jac-4',
        city: 'Jacareí',
        company: 'Produquímica (JAC I)',
        number: '0010704-19.2014.5.15.0138',
        court: '2ª VT JACAREÍ',
        subject: 'Adicionais de periculosidade e insalubridade',
        status: 'Sindicato ganhou em 1ª instância. Empresa já recorreu.',
        active: true,
      },
      {
        id: 'jac-5',
        city: 'Jacareí',
        company: 'Produquímica (JAC II)',
        number: '0010694-29.2014.5.15.0023',
        court: '1ª VT JACAREÍ',
        subject: 'Adicionais de periculosidade e insalubridade',
        status: 'Aguardando julgamento na 1ª instância.',
        active: true,
      },
      {
        id: 'jac-6',
        city: 'Jacareí',
        company: 'BRASILIT',
        number: '0010345-55.2016.5.15.0023',
        court: '1ª VT JACAREÍ',
        subject: 'Adicionais de insalubridade e periculosidade',
        status: 'Sindicato ganhou em 1ª instância. Aguardando prazo para empresa recorrer.',
        active: true,
      },
      // TAUBATÉ (1)
      {
        id: 'tau-1',
        city: 'Taubaté',
        company: 'First Wave',
        number: '0000338.85.2012.5.15.0009',
        court: '1ª VT TAUBATÉ',
        subject: 'Verbas rescisórias, FGTS e salários não pagos.',
        status: 'Realizado acordo, não cumprido pela empresa. Execução.',
        active: true,
      },
      // CAÇAPAVA (2)
      {
        id: 'cac-1',
        city: 'Caçapava',
        company: 'FLC',
        number: '0105600.58.2007.5.15.0119',
        court: 'VT CAÇAPAVA',
        subject: 'Adicionais de periculosidade / insalubridade',
        status: 'Sindicato ganhou em todas as instâncias. Processo em fase de execução/cálculos.',
        active: true,
      },
      {
        id: 'cac-2',
        city: 'Caçapava',
        company: 'IPA',
        number: '0000626.57.2013.5.15.0119',
        court: 'VT CAÇAPAVA / TAUBATÉ',
        subject: 'Adicional de periculosidade / insalubridade.',
        status: 'Sindicato ganhou em 1ª instância. Aguardando julgamento pela 2ª instância.',
        active: true,
      },
      // SÃO JOSÉ DOS CAMPOS (10)
      {
        id: 'sjc-1',
        city: 'São José dos Campos',
        company: 'FGTS (Caixa)',
        number: '0003062-62.2014.4.03.6100',
        court: '3ª Vara Cível de SJC',
        subject: 'Juntada de CDs com extratos das contas dos FGTS',
        status: 'Justiça negou em todas as instâncias. Encerrado.',
        active: true,
      },
      {
        id: 'sjc-2',
        city: 'São José dos Campos',
        company: 'Monsanto',
        number: '0085300.05.2007.5.15.0013',
        court: '1ª VT SJC',
        subject: 'Adicionais de periculosidade / insalubridade.',
        status: 'Sindicato ganhou na 1ª e 2ª instância. Empresa já recorreu para 3ª instância.',
        active: true,
      },
      {
        id: 'sjc-3',
        city: 'São José dos Campos',
        company: 'Monsanto',
        number: '0010112-56.2015.5.15.0132',
        court: '5ª VT SÃO JOSÉ DOS CAMPOS',
        subject: 'Intervalo de refeição',
        status: 'Sindicato ganhou na 1ª instância. Empresa já recorreu.',
        active: true,
      },
      {
        id: 'sjc-4',
        city: 'São José dos Campos',
        company: 'Monsanto',
        number: '0011040-57.2015.5.15.0083',
        court: '3ª VT SÃO JOSÉ DOS CAMPOS',
        subject: 'Horas Extras - (CATRACA)',
        status: 'Audiência agendada para 26/09/2019.',
        active: true,
      },
      {
        id: 'sjc-5',
        city: 'São José dos Campos',
        company: 'CSE Composites',
        number: '0001182.75.2010.5.15.0083',
        court: '3ª VT SJC',
        subject: 'Cautelar de bloqueio de bens.',
        status: 'Aguardando solução do processo principal.',
        active: true,
      },
      {
        id: 'sjc-6',
        city: 'São José dos Campos',
        company: 'Johnson & Johnson INDUSTRIAL (Proc. de 2007)',
        number: '0145500-59.2007.5.15.0083',
        court: '3ª Vara do Trabalho de SJC',
        subject: 'Insalubridade / periculosidade',
        status: 'Realizado acordo. Trabalhadores estão recebendo.',
        active: true,
      },
      {
        id: 'sjc-7',
        city: 'São José dos Campos',
        company: 'Janssen',
        number: '0220100-69.2005.5.15.0132',
        court: '5ª VT SÃO JOSÉ DOS CAMPOS',
        subject: 'Adicionais de periculosidade / insalubridade',
        status: 'Realizado acordo. Trabalhadores já receberam.',
        active: true,
      },
      {
        id: 'sjc-8',
        city: 'São José dos Campos',
        company: 'JJ Profissionais (Atual Medical, Proc. de 2007) Saúde',
        number: '0114200.76.2007.5.15.0085',
        court: '4ª Vara do Trabalho de SJC',
        subject: 'Ação Coletiva Trabalhista',
        status: 'Realizado acordo. Trabalhadores já receberam.',
        active: true,
      },
      {
        id: 'sjc-9',
        city: 'São José dos Campos',
        company: 'Johnson & Johnson (Todas as empresas)',
        number: '0011241-78.2017.5.15.0083',
        court: '3ª VT SÃO JOSÉ DOS CAMPOS',
        subject: 'Horas extras – (CATRACA)',
        status: 'Processo suspenso por 60 dias para negociação com a empresa.',
        active: true,
      },
      {
        id: 'sjc-10',
        city: 'São José dos Campos',
        company: 'Johnson & Johnson (Multa de 40%)',
        number: '1054-2003-84-15',
        court: 'Vara do Trabalho de SJC',
        subject: 'Multa de 40% para os demitidos entre 1999 e 2003',
        status: 'Trabalhadores recebendo.',
        active: true,
      },
    ],
  }

  await atualizarPagina('processos', {
    titulo: 'Lista de Processos',
    subtitulo: 'Acompanhamento dos processos coletivos movidos pelo Sindicato em defesa dos trabalhadores de Jacareí, Taubaté, Caçapava e São José dos Campos.',
    corpo: corpoProcessos,
    tags_json: JSON.stringify(tagsProcessos),
  })

  // =========================================================================
  // 10. CONVÊNIOS (/paginas/convenios — TODOS OS CONVÊNIOS COM TELEFONES, ENDEREÇOS E CIDADES EXATAS)
  // =========================================================================
  const tagsConvenios = {
    tipoPagina: 'partners',
    records: [
      // CAÇAPAVA
      {
        id: 'cac-1',
        city: 'Caçapava',
        kind: 'Fisioterapia',
        name: 'Centro de Reabilitação Caçapava',
        description: 'Desconto de 20% nas sessões para tratamento de Traumato-ortopedia (fisioterapia).',
        phone: '(12) 3653-2348',
        address: 'Rua Prudente de Moraes, 319 - Centro',
        active: true,
      },
      {
        id: 'cac-2',
        city: 'Caçapava',
        kind: 'Escolas e Faculdades',
        name: 'Faculdade Santo Antônio',
        description: 'Condições especiais para associados do Sindicato e seus dependentes.',
        phone: '(12) 3653-1110 / (12) 3221-4501',
        address: 'Rua Professor Argemiro Telles Gopfert, 51 - Vila São João',
        website: 'https://fsantoantonio.edu.br/',
        active: true,
      },
      // JACAREÍ
      {
        id: 'jac-1',
        city: 'Jacareí',
        kind: 'Escolas e Faculdades',
        name: 'Instituto de Tecnologia de Jacareí - ITJ',
        description: 'Desconto de 10% nas mensalidades para os sócios e dependentes.',
        phone: '(12) 3955-3388',
        address: 'Av. Siqueira Campos, 1174',
        active: true,
      },
      {
        id: 'jac-2',
        city: 'Jacareí',
        kind: 'Escolas e Faculdades',
        name: 'Instituto Educacional Thereza Porto Marques',
        description: 'Desconto de 10% para Curso do Jardim ao Ensino Médio, Regular e Cursos Técnicos.',
        phone: '(12) 3951-8569',
        address: 'Rua São Sebastião, 25 - Centro',
        active: true,
      },
      {
        id: 'jac-3',
        city: 'Jacareí',
        kind: 'Escolas e Faculdades',
        name: 'Anhanguera Educacional S/A (Unidade Jacareí)',
        description: 'Tabela de cursos com valores diferenciados para sócios do Sindicato e seus dependentes que estejam iniciando o curso.',
        address: 'Rua São Sebastião, 25 - Centro',
        website: 'https://www.anhanguera.com/',
        active: true,
      },
      {
        id: 'jac-4',
        city: 'Jacareí',
        kind: 'Escolas e Faculdades',
        name: 'Faculdade de Tecnologia São Francisco - FATESF',
        description: 'Desconto de 25% nas mensalidades: Administração, Engenharia de Computação, Engenharia de Controle e Automação.',
        phone: '(12) 3955-3380',
        address: 'Avenida Siqueira Campos, 1174',
        active: true,
      },
      {
        id: 'jac-5',
        city: 'Jacareí',
        kind: 'Idiomas',
        name: 'Decápole Profissionalizantes e Idiomas',
        description: 'Desconto de 40% para os cursos profissionalizantes e desconto de 30% para os cursos de idiomas presenciais.',
        phone: '(12) 3955-3388',
        address: 'Av. Siqueira Campos, 1174',
        active: true,
      },
      {
        id: 'jac-6',
        city: 'Jacareí',
        kind: 'Idiomas',
        name: 'ALPS - Inglês Fluente',
        description: 'Desconto de 35% para cursos Inglês Flex, desconto de 30% para curso em grupo Idiomas (Class Adult) e desconto de 20% na matrícula.',
        phone: '(12) 3962-4816',
        address: 'Rua General Carneiro, nº 394 – Centro – Jacareí',
        email: 'jacarei@alpschool.com.br',
        active: true,
      },
      {
        id: 'jac-7',
        city: 'Jacareí',
        kind: 'Dentistas',
        name: 'Dra. Caroline Bastos Collard',
        description: 'Atendimento odontológico conveniado para sócios e dependentes.',
        phone: '(12) 3953-6677 / (12) 99718-4143',
        address: 'Av. Santos Dumont, 72',
        active: true,
      },
      {
        id: 'jac-8',
        city: 'Jacareí',
        kind: 'Dentistas',
        name: 'Dra. Maria Angêlica Assis',
        description: 'Atendimento odontológico conveniado para sócios e dependentes.',
        phone: '(12) 3953-6677',
        address: 'Av. Santos Dumont, 72',
        active: true,
      },
      {
        id: 'jac-9',
        city: 'Jacareí',
        kind: 'Dentistas',
        name: 'Juliana Leonor de Souza Camilo',
        description: 'Desconto de 30% a 50% à vista ou parcelado.',
        phone: '(12) 3953-3342',
        address: 'Rua Tiradentes, 419',
        active: true,
      },
      {
        id: 'jac-10',
        city: 'Jacareí',
        kind: 'Dentistas',
        name: 'Edilson Camilo',
        description: 'Desconto de 30% a 50% à vista ou parcelado.',
        phone: '(12) 3953-3342',
        address: 'Rua Tiradentes, 419',
        active: true,
      },
      {
        id: 'jac-11',
        city: 'Jacareí',
        kind: 'Academias',
        name: 'Academia Falcão Cross Força (Studio Falcão Cross)',
        description: 'Desconto de 50% nos treinamentos: Cross força, Funcional, Boxe, Musculação resistida e Personal.',
        phone: '(12) 98177-2585',
        address: 'Av. Dom Pedro I, nº 500, Parque dos Príncipes - Jacareí',
        active: true,
      },
      {
        id: 'jac-12',
        city: 'Jacareí',
        kind: 'Farmácias',
        name: 'Drogaria Dia e Noite e Drogaria Barão',
        description: 'Rede de farmácias conveniada ao Sindicato em Jacareí.',
        address: 'Jacareí - SP',
        active: true,
      },
      // TAUBATÉ
      {
        id: 'tau-1',
        city: 'Taubaté',
        kind: 'Escolas e Faculdades',
        name: 'Instituto Taubaté de Ensino Superior - ITES',
        description: 'Desconto de 10% para cursos de Graduação e Pós-Graduação.',
        phone: '(12) 3536-4553',
        address: 'Av. D. Pedro I, 3.575',
        active: true,
      },
      {
        id: 'tau-2',
        city: 'Taubaté',
        kind: 'Idiomas',
        name: 'Skill Idiomas',
        description: 'Desconto de 30% na matrícula, material didático em 12x no cartão ou 6x no cheque e parcelas do curso com 10% de desconto a mais do que a tabela promocional vigente.',
        phone: '(12) 3426-7888',
        address: 'Rua Itália, 360',
        active: true,
      },
      {
        id: 'tau-3',
        city: 'Taubaté',
        kind: 'Idiomas',
        name: 'Curso de Francês e Traduções - Prof.ª Jeanne Monique',
        description: 'Desconto de 10% até o vencimento.',
        phone: '(12) 3672-4565',
        address: 'Rua Duque de Caxias, 33 - Sala 205 - 2º andar',
        active: true,
      },
      {
        id: 'tau-4',
        city: 'Taubaté',
        kind: 'Dentistas',
        name: 'Dr. Alysson Martins Corrêa',
        description: 'Tratamento Odontológico com 30% de desconto sobre a tabela da APCD.',
        phone: '(12) 3624-7828 / (12) 99155-5334',
        address: 'Rua José Vicente de Faria Lima, 251',
        active: true,
      },
      {
        id: 'tau-5',
        city: 'Taubaté',
        kind: 'Dentistas',
        name: 'Dra. Éllen Renata de Pontes Coelho',
        description: 'Atendimento odontológico conveniado para associados e dependentes.',
        phone: '(12) 3624-7273',
        address: 'Rua Pedro Costa, 210 - Sala 9',
        active: true,
      },
      {
        id: 'tau-6',
        city: 'Taubaté',
        kind: 'Psicologia',
        name: 'Vanessa Alves Sena',
        description: 'Desconto de 50% sobre o valor da sessão terapêutica semanal.',
        phone: '(12) 99171-6939 / (12) 99137-1141',
        address: 'Rua Dona Chiquinha de Mattos, 84 - Sala 6',
        active: true,
      },
      {
        id: 'tau-7',
        city: 'Taubaté',
        kind: 'Nutrição e Suplementos',
        name: 'Nutrisaúde',
        description: 'Desconto de 40% nas consultas, acompanhamentos de gestantes, crianças, idosos e para ganho de massa magra.',
        phone: '(12) 98237-4135 / (12) 99176-7588',
        address: 'Rua Expedicionário Rubens Leite, 34',
        active: true,
      },
      {
        id: 'tau-8',
        city: 'Taubaté',
        kind: 'Nutrição e Suplementos',
        name: 'Big Gang Suplementos',
        description: 'Desconto de 20% à vista e 10% a prazo.',
        phone: '(12) 3432-5081 / (12) 98202-9291',
        address: 'Rua Juca Esteves, 354',
        active: true,
      },
      {
        id: 'tau-9',
        city: 'Taubaté',
        kind: 'Farmácias',
        name: 'Droga Mendes e Drogaria Juliani',
        description: 'Rede de farmácias conveniada ao Sindicato em Taubaté.',
        address: 'Taubaté - SP',
        active: true,
      },
      // SÃO JOSÉ DOS CAMPOS
      {
        id: 'sjc-1',
        city: 'São José dos Campos',
        kind: 'Auto Escola',
        name: 'Formatran-Centro CFC',
        description: 'Desconto de 10% à vista.',
        phone: '(12) 3923-7177 / (12) 3923-7026',
        address: 'Rua Francisco Rafael, 122 – Centro',
        active: true,
      },
      {
        id: 'sjc-2',
        city: 'São José dos Campos',
        kind: 'Automecânica',
        name: 'Pit Stop Automecânica',
        description: 'Desconto de 15% à vista.',
        phone: '(12) 98208-8935',
        address: 'Travessa Antônio Domênico Ferro, 10 - Vila Maria',
        active: true,
      },
      {
        id: 'sjc-3',
        city: 'São José dos Campos',
        kind: 'Dentistas',
        name: 'Dr. Paulo Roberto Vilela',
        description: 'Tratamento Odontológico com preços reduzidos.',
        phone: '(12) 3931-1244',
        address: 'Rua Mário Valério Camargo, 37 - Sala 5',
        active: true,
      },
      {
        id: 'sjc-4',
        city: 'São José dos Campos',
        kind: 'Dentistas',
        name: 'Dra. Vera Lúcia Sizue Tenguan',
        description: 'Desconto de 30% para Prótese, Ortodontia e Clínica Geral.',
        phone: '(12) 3942-2060',
        address: 'Av. Pedro Álvares Cabral, 845 - Jd. Paulista',
        active: true,
      },
      {
        id: 'sjc-5',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'CETEC Educacional',
        description: 'Bolsas de 50% sobre as cinco parcelas da semestralidade e desconto de pontualidade, conforme tabela da instituição.',
        address: 'Av. Barão do Rio Branco, 882 - Sala 1 - Jd. Esplanada',
        active: true,
      },
      {
        id: 'sjc-6',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'COC Ensino Médio e Pré-vestibular',
        description: 'Desconto de 10% no ensino médio e de 15% no pré-vestibular.',
        phone: '(12) 2134-9300',
        address: 'Av. Nelson D’Ávila, 1202 - Jd. São Dimas',
        active: true,
      },
      {
        id: 'sjc-7',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'ECOMPO',
        description: 'Desconto de 10% para Técnico em Química, Informática, Prótese Dentária e Ensino Médio (desconto não acumulativo).',
        phone: '(12) 3922-8655 / 0800-148550',
        address: 'Rua Raul Ramos de Araújo, 283 - Santana',
        email: 'informacoescursos@ecompo.com.br',
        website: 'http://www.ecompo.com.br/',
        active: true,
      },
      {
        id: 'sjc-8',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'UNIP - Universidade Paulista',
        description: 'Desconto de 5% sobre o resultado + desconto para alunos que efetuam o pagamento até o 5º dia útil.',
        phone: '(12) 3933-2529',
        website: 'http://www3.unip.br/',
        active: true,
      },
      {
        id: 'sjc-9',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'Anhanguera Educacional S/A (Unidade SJC)',
        description: 'Tabela de cursos com valores diferenciados para sócios do Sindicato e seus dependentes que estejam iniciando o curso.',
        website: 'https://www.anhanguera.com/',
        active: true,
      },
      {
        id: 'sjc-10',
        city: 'São José dos Campos',
        kind: 'Escolas e Faculdades',
        name: 'Curso Êxito',
        description: 'Desconto de 25% sobre o valor do curso (nas parcelas dos cursos oferecidos, exceto não formandos).',
        phone: '(12) 3923-2293',
        address: 'Av. Alfredo I. Nogueira Penido, 614 - Jd. Aquarius',
        active: true,
      },
      {
        id: 'sjc-11',
        city: 'São José dos Campos',
        kind: 'Farmácias',
        name: 'Rede Droga Bella e Rede Plantão',
        description: 'Rede de farmácias conveniada ao Sindicato em São José dos Campos e região.',
        address: 'São José dos Campos - SP',
        active: true,
      },
      {
        id: 'sjc-12',
        city: 'São José dos Campos',
        kind: 'Livrarias e Papelaria',
        name: 'Livraria e Papelaria Itapuã',
        description: 'Desconto de 10% à vista ou 3x no cartão. Material de papelaria, festa, enfeites e embalagens em geral.',
        phone: '(12) 3936-1537 / (12) 3923-3150 / (12) 3921-0333',
        address: 'Av. Cidade Jardim, 5153 - Bosque dos Eucaliptos',
        active: true,
      },
      {
        id: 'sjc-13',
        city: 'São José dos Campos',
        kind: 'Livrarias e Papelaria',
        name: 'Papelaria Hikari',
        description: 'Material escolar, escritório, informática, presentes, brinquedos, higiene e limpeza.',
        phone: '(12) 3941-5579 / (12) 3923-6321',
        address: 'Rua Floriano Peixoto, 41 - Centro',
        active: true,
      },
      {
        id: 'sjc-14',
        city: 'São José dos Campos',
        kind: 'Nutricionistas',
        name: 'Dra. Leticia Novakoski',
        description: 'Desconto de 40% em cada consulta nutricional. Avaliação nutricional, montagem de planos alimentares e assessoria nutricional.',
        phone: '(12) 98104-2410',
        address: 'Av. Andrômeda, 3112, Sala 5 - Bosque dos Eucaliptos',
        active: true,
      },
      {
        id: 'sjc-15',
        city: 'São José dos Campos',
        kind: 'Ótica',
        name: 'Óticas Sophia',
        description: 'Desconto de 20% para sócios do sindicato e consulta visual gratuita.',
        phone: '(12) 3943-2115',
        active: true,
      },
      {
        id: 'sjc-16',
        city: 'São José dos Campos',
        kind: 'Ótica',
        name: 'Óticas Carvalho',
        description: 'Desconto de 15% à vista ou desconto de 10% para compras em até 6x. Relógios, óculos de grau ou solares.',
        phone: '(12) 3307-7311',
        address: 'Rua Nelson Cesar de Oliveira, 151 (rua da feira) - Jd. das Indústrias',
        email: 'oticas.carv@hotmail.com',
        active: true,
      },
      {
        id: 'sjc-17',
        city: 'São José dos Campos',
        kind: 'Ótica',
        name: 'Óticas Diniz',
        description: 'Desconto de 10% no orçamento.',
        phone: '(12) 3921-8120 / (12) 3922-8581',
        address: 'Rua Sebastião Humel, 171 e Rua Coronel José Monteiro, 264 - Centro',
        website: 'http://www.oticadiniz.com.br/',
        active: true,
      },
    ],
  }

  await atualizarPagina('convenios', {
    titulo: 'Convênios',
    subtitulo: 'Descontos em educação, saúde, odontologia, farmácias, óticas e serviços para associados e dependentes.',
    corpo: '',
    tags_json: JSON.stringify(tagsConvenios),
  })

  // =========================================================================
  // 11. CONVENÇÕES COLETIVAS — CCT (/paginas/cct — 8 DOCUMENTOS COM PDFs NO SUPABASE)
  // =========================================================================
  const corpoCCT = `
<div style="background: #65172A; color: #ffffff; border-left: 6px solid #F5B800; border-radius: 8px; padding: 22px 26px; margin-bottom: 24px;">
  <p style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff;">
    A partir da <strong>CCT 2019</strong>, a solicitação deve ser feita diretamente ao setor jurídico:
  </p>
  <div style="display: flex; flex-wrap: wrap; gap: 22px; align-items: center; font-size: 16px;">
    <span><strong>Telefone / WhatsApp:</strong> <a href="tel:1239218177" style="color: #F5B800; font-weight: 800; text-decoration: underline;">(12) 3921-8177</a></span>
    <span><strong>E-mail:</strong> <a href="mailto:quimisjc.jur@gmail.com" style="color: #F5B800; font-weight: 800; text-decoration: underline;">quimisjc.jur@gmail.com</a></span>
  </div>
</div>
`.trim()

  const tagsCCT = {
    tipoPagina: 'documents',
    records: [
      {
        id: '1',
        name: 'Convenção Coletiva de Trabalho: 2018/2020 (30MB)',
        validity: '2018/2020',
        size: '30MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/CCT_QUIMICOS_2018_2020.pdf'),
        active: true,
      },
      {
        id: '2',
        name: 'Convenção Coletiva de Trabalho: 2017/2018 (6.5MB)',
        validity: '2017/2018',
        size: '6.5MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/Acordo-Coletivo-de-Trabalho-2017-2018.pdf'),
        active: true,
      },
      {
        id: '3',
        name: 'Termo Aditivo da Convenção Coletiva de Trabalho: 2016/2017 (3.8MB)',
        validity: '2016/2017',
        size: '3.8MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/CCT_2016_2017.pdf'),
        active: true,
      },
      {
        id: '4',
        name: 'Convenção Coletiva de Trabalho: 2015/2017 (12MB)',
        validity: '2015/2017',
        size: '12MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/CCT-2015-2017.pdf'),
        active: true,
      },
      {
        id: '5',
        name: 'Convenção Coletiva de Trabalho: 2014/2015 (21MB)',
        validity: '2014/2015',
        size: '21MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/CCT_2014_2015.pdf'),
        active: true,
      },
      {
        id: '6',
        name: 'Aviso às Empresas ref. CCT 2014/2015 (450KB)',
        validity: '2014/2015',
        size: '450KB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/Comunicado_as_empresas_CCT_2014_2015.pdf'),
        active: true,
      },
      {
        id: '7',
        name: 'Convenção Coletiva de Trabalho: 2012/2014 (23MB)',
        validity: '2012/2014',
        size: '23MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/Comunicado_as_empresas_CCT_2014_2015.pdf'),
        active: true,
      },
      {
        id: '8',
        name: 'Termo Aditivo: 2013/2014 (3MB)',
        validity: '2013/2014',
        size: '3MB',
        file: getAsset('https://www.quimicosjc.org.br/pdfs/especiais/CCT_2014_2015.pdf'),
        active: true,
      },
    ],
  }

  await atualizarPagina('cct', {
    titulo: 'Convenções - CCT',
    subtitulo: 'Convenções Coletivas de Trabalho, termos aditivos e contato direto do setor jurídico.',
    corpo: corpoCCT,
    tags_json: JSON.stringify(tagsCCT),
  })

  // =========================================================================
  // 12. QUEM SOMOS / HISTÓRIA (/paginas/historia — LINHA DO TEMPO COMPLETA COM 18 MARCOS E 22 FOTOS)
  // =========================================================================
  const marcosHistoria = [
    {
      ano: '2023',
      titulo: '60 Anos de Sindicato',
      img: getAsset('https://quimicosjc.org.br/assets/img/60-anos.jpg'),
      texto: 'Em 2023, o Sindicato dos Químicos, Farmacêuticos e Plásticos de São José dos Campos e Região comemorou seu 60º aniversário. Durante essas seis décadas, representamos e lutamos pelos direitos dos trabalhadores nas Indústrias Químicas, Plásticas e Farmacêuticas. Nosso compromisso em buscar melhores condições de trabalho e defender direitos fundamentais tem sido uma constante ao longo de nossa história. Celebramos essa importante conquista, reafirmando nosso compromisso de continuar sendo a voz dos trabalhadores.',
    },
    {
      ano: '2014',
      titulo: 'Concepção de luta do Sindicato',
      img: getAsset('https://quimicosjc.org.br/assets/img/lutas-sociais.jpg'),
      texto: 'A concepção de luta do Sindicato dos Químicos é o enfrentamento de classes contra a opressão dos ricos, dos governos da elite sobre os trabalhadores. Esta é a luta da classe trabalhadora e da nossa categoria química.',
    },
    {
      ano: '2012',
      titulo: 'Lutas Sociais e Estudantis',
      img: getAsset('https://quimicosjc.org.br/assets/img/luta-estudantis.jpg'),
      texto: 'Todas as lutas sociais e estudantis, principalmente dos anos 2000 para cá, também foram tomadas como nossas! Temos participado de todas as lutas sociais aqui da região em atos contra as Câmaras Municipais e prefeituras em benefício próprio e contra o povo trabalhador, como na luta contra o aumento do salário dos vereadores, em 2012, contra o aumento das passagens de ônibus na região e outras questões. Solidariedade de classe é o combustível que move as nossas ações e apoio a todas as lutas da classe trabalhadora, seja nas lutas dos trabalhadores grevistas ou nas reivindicações dos estudantes e movimentos populares por moradia, saúde, educação, programas habitacionais.',
    },
    {
      ano: '2012',
      titulo: 'Apoio às lutas da classe trabalhadora',
      img: getAsset('https://quimicosjc.org.br/assets/img/apoio-as-lutas.jpg'),
      texto: 'O Sindicato dos Químicos construiu um histórico de apoio a todas as lutas não só da categoria química como também da classe trabalhadora.',
    },
    {
      ano: '2011',
      titulo: 'O maior ataque da Polícia Militar aos grevistas da Johnson',
      img: getAsset('https://quimicosjc.org.br/assets/img/ataque-policia.jpg'),
      texto: 'A barbárie da tropa de choque agindo sob ordens da Johnson se repetiu em 2011 com a força de repressão do estado capitalista marchando de dentro da fábrica para escoltar e oprimir trabalhadores, algo inaceitável ainda em uma democracia. Além de manter a greve, os companheiros aprovaram repúdio à ação da empresa em usar a Polícia Militar como guarda particular. A união e solidariedade dos companheiros nesta luta despertou a solidariedade de outras categorias no Brasil, na América Latina e fortaleceu o nosso Sindicato como instrumento de luta a serviço da categoria química e da classe trabalhadora!',
    },
    {
      ano: '2010',
      titulo: 'A construção de uma nova organização sindical',
      img: getAsset('https://quimicosjc.org.br/assets/img/construcao-nova-organizacao.jpg'),
      texto: 'Em 2010, sindicatos de luta do país inteiro começaram a discutir a construção de uma nova central sindical dos trabalhadores. Vários grupos de esquerda participaram das discussões para unir todos esses setores em uma única central. O Sindicato dos Químicos participou dessas discussões como então filiado à Conlutas. Parte das bases presentes ao congresso de fundação da nova central sindical, incluindo a delegação do Sindicato dos Químicos, por divergências de concepção política, retirou-se do congresso. A partir daí, o Sindicato dos Químicos manteve a união na luta direta contra todos os patrões, mas sem atrelamento a uma central sindical. Desde então o sindicato vive uma experiência com a entidade Unidos pra Lutar, tentando um instrumento que não o isole das lutas de outras categorias e que garanta a sua autonomia e independência diante dos patrões e governos.',
    },
    {
      ano: '2008',
      titulo: 'Invasão do choque aos ônibus',
      img: getAsset('https://quimicosjc.org.br/assets/img/tropa-choque-onibus.jpg'),
      texto: 'A tropa de choque invadiu os ônibus, forçou os motoristas a passar por cima do canteiro e avançar sobre o piquete de greve. O episódio foi um dos mais graves atentados à liberdade sindical da história recente na região.',
    },
    {
      ano: '2008',
      titulo: 'Liminar contra a greve',
      img: getAsset('https://quimicosjc.org.br/assets/img/liminar-contra-greve.jpg'),
      texto: 'A empresa tentou uma liminar contra a greve, mas o Sindicato conseguiu o reconhecimento da Justiça do Trabalho do direito de greve, inclusive a legitimidade do piquete e das faixas, tendo em vista o 100% de adesão. A Johnson então apelou e contou com a tropa de choque da PM do governo estadual do PSDB para aterrorizar a greve.',
    },
    {
      ano: '2008',
      titulo: 'Paralisação de Advertência de 24h na Johnson',
      img: getAsset('https://quimicosjc.org.br/assets/img/paralisacao-johnson.jpg'),
      texto: 'Em 2008, o Sindicato dos Químicos realizou uma paralisação de advertência de 24 horas na Johnson e, em seguida, uma greve histórica de 6 dias com 100% de adesão para barrar o banco de horas, contra o plano de cargos e salários e aumento real acima do negociado na FIESP para toda a categoria. Como retaliação, a empresa demitiu por justa causa vários dirigentes do Sindicato para averiguação de suposta falta grave.',
    },
    {
      ano: '2007',
      titulo: 'Paralisação na Tarkett por 5 dias',
      img: getAsset('https://quimicosjc.org.br/assets/img/paralisacao-tarkett.jpg'),
      texto: 'Em 2007, os trabalhadores da Fademac (hoje, Tarkett), em Jacareí, paralisaram a empresa por cinco dias contra a redução de direitos de um setor da empresa que foi terceirizado e vendido para um grupo empresarial que não aceitava o Sindicato dos Químicos como representante dos trabalhadores. A greve obteve uma grande conquista.',
    },
    {
      ano: '2003',
      titulo: 'Combate à Reforma da Previdência',
      img: getAsset('https://quimicosjc.org.br/assets/img/combate-reforma-previdencia.jpg'),
      texto: 'Criada nos fins dos anos 1980, a CUT viveu o seu apogeu nas greves históricas do fim desta década e no começo dos anos 1990. Durante o governo FHC, a Central já apontava uma tendência ao governismo, materializada nos acordos das Câmaras Setoriais, quando chamou para negociar os patrões, os governos e o sindicato (as chamadas Câmaras tripartites), momento de perdas para os trabalhadores e ganhos vultosos das empresas via desoneração de impostos. Já no ano 2000, a Central já apresentava mudanças de rumo com o crescimento da burocracia, com o poder centralizado e os interesses partidários do PT acima das lutas dos trabalhadores. Com a chegada do PT ao executivo federal, em 2002, essa ruptura ficou ainda mais clara. A CUT se negou a combater de frente a reforma da Previdência que Lula realizou em 2003 para reduzir valores e dificultar o acesso do trabalhador à aposentadoria.',
    },
    {
      ano: '2003',
      titulo: 'Participação nos protestos contra as privatizações lesa-pátria de FHC',
      img: getAsset('https://quimicosjc.org.br/assets/img/privatizacao-lesa.jpg'),
      texto: 'Nós participamos dos protestos contra as privatizações lesa-pátria de FHC, contra as políticas neoliberais no regime de trabalho, contra a reforma da Previdência de 2003 do governo Lula, contra a corrupção dos escândalos dos sanguessugas do PSDB e dos mensaleiros do PT, contra os leilões do petróleo, etc.',
    },
    {
      ano: '2003',
      titulo: 'Dois Triunfos Históricos',
      img: getAsset('https://quimicosjc.org.br/assets/img/dois-triunfos.jpg'),
      texto: 'Em 2000, obtivemos dois triunfos históricos: a redução da jornada na Johnson, que acabou com o trabalho aos sábados, e o triunfo da esquerda nas eleições do Sindicato. A vitória veio sobre a Articulação Sindical, um grupo de pelegos da CUT e do PT que participaram da eleição ao lado de bate-paus a serviço dos patrões. Em 2003, como parte da campanha salarial, greve de 24h paralisa a Johnson, conquistando uma das PLRs mais altas da categoria. Em 2004, a Johnson consegue interdito proibitório que impede a realização de assembleias em frente aos vestiários.',
    },
    {
      ano: '1998',
      titulo: 'Patronal nega aumento real e reduz índice de horas extras',
      img: getAsset('https://quimicosjc.org.br/assets/img/patronal-nega.jpg'),
      texto: 'Em 1998, a patronal nega aumento real e reduz o índice de horas extras para 70% (dias de semana) e 110% (finais de semana e feriados). Os Sindicatos Químicos de todo o estado se negam a assinar a Convenção Coletiva. A Johnson desviou os ônibus tentando evitar a assembleia, mas os trabalhadores se reuniram no vestiário e marcharam até a portaria da empresa para fazer assembleia. Em 1999, novas lutas conquistam Acordos Coletivos que garantiram direitos para 80% dos trabalhadores da base, dentre eles as horas extras a 85% e 130%, percentual mantido até hoje com muita luta nas fábricas grandes da categoria.',
    },
    {
      ano: '1997',
      titulo: 'Caminhão do Sindicato foi incendiado',
      img: getAsset('https://quimicosjc.org.br/assets/img/caminhao-incendio.jpg'),
      texto: 'Em 12 de agosto, o caminhão do Sindicato fora incendiado. Havia uma assembleia marcada para ocorrer na Kodak naquele dia. O atentado nunca foi desvendado, mas a luta continuou. Os aumentos e conquistas da nossa região foram os maiores do ramo em nível nacional. As mobilizações conquistaram Acordos Coletivos (negociação por fábrica) com índices e pontos acima do negociado na FIESP em várias fábricas.',
    },
    {
      ano: '1997',
      titulo: 'Campanhas salariais unificadas',
      img: getAsset('https://quimicosjc.org.br/assets/img/campanhas-salariais.jpg'),
      texto: 'Em 1997 e durante quatro anos, o Sindicato realizou campanhas salariais unificadas com outros sindicatos químicos do interior de São Paulo, que abrangiam, além do Vale do Paraíba, Campinas, Vinhedo, Sorocaba e Osasco. Havia mutirões de madrugada para concentrar esforços nas fábricas e realizar assembleias fortalecidas com dezenas de apoiadores, o que dava mais fôlego e ânimo às atividades. A redução da jornada passa a ser uma das reivindicações.',
    },
    {
      ano: '1995',
      titulo: 'Primeiras Greves',
      img: getAsset('https://quimicosjc.org.br/assets/img/primeiras-greves.jpg'),
      texto: 'A primeira e espontânea greve na Johnson aconteceu em 1995. Os trabalhadores estavam indignados com as condições de trabalho e salariais e pararam as máquinas por quase um dia em uma grande greve de ocupação. A paralisação alcançou as primeiras conquistas. Neste ano, houve 14 greves na categoria. Dentre elas, a de 24 dias na IQT (Indústrias Químicas de Taubaté). Em 1996, a entidade teve acentuado o papel classista e lutador. Encampamos uma greve de oito dias na Monsanto, resistindo aos fura-greve que entravam de helicóptero. Em seguida, houve greves na Henkel e na Rohm Haas (atual Dow), ambas em Jacareí. 1996 termina com aumento real de 5% na maior parte das fábricas.',
    },
    {
      ano: '1992',
      titulo: 'Luta contra as privatizações',
      img: getAsset('https://quimicosjc.org.br/assets/img/luta-privatizacoes.jpg'),
      texto: 'O movimento sindical e o Sindicato dos Químicos estiveram presentes nas lutas contra as privatizações, que não demoraram para mostrar resultados nas fábricas da categoria por meio da chamada reestruturação produtiva. Ou seja, produzir e garantir mais lucros para os patrões com menos trabalhadores efetivos e mais exploração. Daí para o início da terceirização foi um pulo. Mesmo com toda a luta dos sindicatos e categorias organizadas contra os efeitos do neoliberalismo sobre a produção, os trabalhadores passaram a ser atacados agressivamente nos seus direitos trabalhistas. É daí também que advém a nossa luta contra os ataques à Previdência Social e o direito à aposentadoria.',
    },
    {
      ano: '1990',
      titulo: 'Reflexo do neoliberalismo',
      img: getAsset('https://quimicosjc.org.br/assets/img/neoliberalismo.jpg'),
      texto: 'Já como reflexo do neoliberalismo, as primeiras grandes greves da categoria aparecem a partir de 1995 na Johnson e na Monsanto. Houve greves importantes e longas em muitas fábricas, como: IQT (Taubaté), Monsanto (atualmente, Bayer), Johnson, Fademac (atualmente, Tarkett) e outras.',
    },
    {
      ano: '1980',
      titulo: 'Primeiras greves históricas da categoria química',
      img: getAsset('https://quimicosjc.org.br/assets/img/primeiras-greves-historicas.jpg'),
      texto: 'As primeiras greves históricas da categoria química começam a ocorrer no fim dos anos 1980. É também neste período que o nosso Sindicato ingressa de vez na luta política e social do país, apoiando a luta pela terra, por justiça social e contra as primeiras consequências aqui na região das políticas neoliberais implantadas no mundo por meio da globalização econômica.',
    },
    {
      ano: '1980',
      titulo: 'Embate contra o capital e a exploração dos patrões e governos',
      img: getAsset('https://quimicosjc.org.br/assets/img/embate-contra-capital.jpg'),
      texto: 'Nesse período, as lutas começam a ficar mais aguerridas no embate contra o capital e a exploração dos patrões e governos. Então os companheiros que criaram a associação de base em São José formaram uma chapa combativa e conquistaram a direção do Sindicato. Nos últimos anos da década de 1980, o Brasil viveu o apogeu das lutas sindicais, da construção da CUT, que naquele momento era um instrumento independente dos governos e patrões para lutar e organizar os trabalhadores.',
    },
    {
      ano: '1963',
      titulo: 'Início do Sindicato dos Químicos de São José dos Campos',
      img: getAsset('https://quimicosjc.org.br/assets/img/inicio-sindicato.jpg'),
      texto: 'Esse instrumento de luta dos trabalhadores completa 60 anos em 2023 com um histórico de enfrentamentos e conquistas de direitos para os trabalhadores. O Sindicato é uma construção histórica em evolução. Os primeiros passos foram em 1963, em Jacareí. Temos pouca informação deste período. Sabe-se que a entidade era uma espécie de entidade cartorial, sem raízes no chão de fábrica e inserção na luta direta dos trabalhadores. Com a redemocratização e industrialização crescente da região, já em meados da década de 1980, os trabalhadores de base criaram uma associação, em São José dos Campos. Como forma de combater essa organização pela base, a então direção do Sindicato pediu extensão de base territorial. A partir disso, o Sindicato passou a alcançar até a base de Taubaté.',
    },
  ]

  const corpoHistoria = `
<div style="display: flex; flex-direction: column; gap: 24px; margin-top: 8px;">
  ${marcosHistoria
    .map(
      (m) => `
  <div style="background: #ffffff; border: 1px solid #e4dce0; border-left: 5px solid #861e32; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; align-items: center;">
    <div>
      <span style="display: inline-block; background: #861e32; color: #ffffff; font-family: var(--font-condensed), sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 12px; border-radius: 4px; margin-bottom: 10px;">
        ${m.ano}
      </span>
      <h2 style="font-family: var(--font-condensed), sans-serif; text-transform: uppercase; margin: 0 0 10px 0; font-size: 25px; font-weight: 800; line-height: 1.15; color: #30252a; border: none; padding: 0;">
        ${m.titulo}
      </h2>
      <p style="margin: 0; font-size: 16px; line-height: 1.75; color: #30252a;">
        ${m.texto}
      </p>
    </div>
    <div style="background: #f8fafb; border: 1px solid #ebdbe0; border-radius: 6px; padding: 10px; display: flex; align-items: center; justify-content: center;">
      <img src="${m.img}" alt="${m.ano} - ${m.titulo}" loading="lazy" style="max-width: 100%; max-height: 320px; width: auto; height: auto; object-fit: contain; margin: 0; border-radius: 4px; box-shadow: none;" />
    </div>
  </div>`
    )
    .join('\n')}
</div>
`.trim()

  await atualizarPagina('historia', {
    titulo: 'Sindicato é pra lutar! A história de luta da categoria!',
    subtitulo: 'De 1963 aos 60 anos de luta: a trajetória combativa do Sindicato dos Químicos, Farmacêuticos e Plásticos de São José dos Campos e Região.',
    banner_url: getAsset('https://quimicosjc.org.br/assets/img/60-anos.jpg'),
    fotos_json: JSON.stringify([]),
    corpo: corpoHistoria,
  })

  // =========================================================================
  // 13. DIRETORIA (/paginas/diretoria — FOTOS MIGRADAS PARA O SUPABASE STORAGE)
  // =========================================================================
  const { data: dirAtual } = await supabase
    .from('conteudos')
    .select('tags_json')
    .eq('slug', 'diretoria')
    .maybeSingle()

  if (dirAtual?.tags_json) {
    const parsedDir = JSON.parse(dirAtual.tags_json)
    if (parsedDir.records && Array.isArray(parsedDir.records)) {
      parsedDir.records = parsedDir.records.map((r) => {
        let img = r.image || ''
        if (img.includes('logo.svg') || img.includes('placehold.co') || img.endsWith('/uploads/')) {
          img = ''
        } else if (assetMap[img]) {
          img = assetMap[img]
        }
        return { ...r, image: img }
      })
      await atualizarPagina('diretoria', {
        titulo: 'Diretoria',
        subtitulo: 'Dirigentes do Sindicato dos Químicos de São José dos Campos e Região.',
        corpo: '',
        tags_json: JSON.stringify(parsedDir),
      })
    }
  }

  // =========================================================================
  // 14. ATENDIMENTO & FALE CONOSCO (/paginas/fale-conosco)
  // =========================================================================
  const tagsContatos = {
    tipoPagina: 'contacts',
    records: [
      {
        id: '1',
        name: 'Sede Central — São José dos Campos',
        description: '',
        address: 'Rua Conselheiro Rodrigues Alves, 51 - Jd. Santa Luzia - CEP 12209-540',
        phone: '(12) 3921-8177',
        hours: 'Segunda a sexta, das 08h00 às 17h00',
        url: 'https://goo.gl/maps/2ov8QBz4t3x1Kt3X8',
        active: true,
      },
      {
        id: '2',
        name: 'Subsede Jacareí',
        description: '',
        address: 'Rua Floriano Peixoto, 78 - Centro - CEP 12308-030',
        phone: '(12) 3953-3277',
        hours: 'Segunda a sexta, das 08h00 às 17h00',
        url: 'https://goo.gl/maps/WPESrUAQvvqsm4kM7',
        active: true,
      },
      {
        id: '3',
        name: 'Subsede Caçapava',
        description: '',
        address: 'Rua Cel. José Guimarães, 331 - Centro - CEP 12282-330',
        phone: '(12) 3655-6044',
        hours: 'Segunda a sexta, das 08h00 às 17h00',
        url: 'https://goo.gl/maps/QePKp8NYQZqRE8DaA',
        active: true,
      },
      {
        id: '4',
        name: 'Subsede Taubaté',
        description: '',
        address: 'Rua Sebastião Gil, 319 - Vila Costa - CEP 12050-200',
        phone: '(12) 3632-0932 / (12) 3655-0932',
        hours: 'Segunda a sexta, das 08h00 às 17h00',
        url: 'https://goo.gl/maps/g4PPrQy1hTzjaFCV7',
        active: true,
      },
      {
        id: '5',
        name: 'Salão de Assembleias — São José dos Campos',
        description: 'Praça atrás da Sede Central do Sindicato',
        address: 'Praça Carlos Maldonado Campoy, nº 23 – Centro – São José dos Campos/SP',
        url: 'https://goo.gl/maps/9qD6JgNwtWS72YVPA',
        active: true,
      },
    ],
  }

  await atualizarPagina('fale-conosco', {
    titulo: 'Atendimento e Fale Conosco',
    subtitulo: 'Sede Central, subsedes regionais e envio de mensagens.',
    corpo: '',
    tags_json: JSON.stringify(tagsContatos),
  })

  // =========================================================================
  // 15. PÁGINAS DE FORMULÁRIOS E SERVIÇOS (LIMPEZA DE REDUNDÂNCIAS)
  // =========================================================================
  await atualizarPagina('fique-socio', {
    titulo: 'Fique Sócio',
    subtitulo: 'Sindicalize-se e fortaleça a luta dos trabalhadores químicos.',
    corpo: '<p>Associados e dependentes têm acesso à assessoria jurídica trabalhista e previdenciária, às unidades da Colônia de Férias em Caraguatatuba e São Sebastião e aos descontos da rede de convênios.</p>',
  })

  await atualizarPagina('carteirinha', {
    titulo: 'Solicitar Carteirinha',
    subtitulo: 'Emissão de 1ª ou 2ª via da carteirinha de associado.',
    corpo: '',
  })

  await atualizarPagina('atualizar-cadastro', {
    titulo: 'Atualizar Cadastro',
    subtitulo: 'Atualização de endereço, telefone, empresa e dependentes.',
    corpo: '',
  })

  await atualizarPagina('denuncia', {
    titulo: 'Enviar Denúncia',
    subtitulo: 'Canal sigiloso para denúncias de irregularidades trabalhistas.',
    corpo: '',
  })

  await atualizarPagina('cadastro-noticias', {
    titulo: 'Receber Notícias',
    subtitulo: 'Informativos e comunicados do Sindicato no seu WhatsApp e e-mail.',
    corpo: '',
  })

  console.log('\n✅ TODAS AS PÁGINAS DE SERVIÇO E INSTITUCIONAIS FORAM ATUALIZADAS COM PROPOSTA B E VARRIÇÃO DE REDUNDÂNCIAS!')
}

main().catch(console.error)
