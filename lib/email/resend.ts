import { Resend } from 'resend'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith('re_exemplo') || apiKey === 'fake') {
    return null
  }
  return new Resend(apiKey)
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'contato@quimicosjc.org.br'
const EMAIL_DESTINO_PADRAO = process.env.EMAIL_CONTATO || 'contato@quimicosjc.org.br'

interface AvisoRecebimentoParams {
  protocolo: string
  formularioNome: string
  nomeTrabalhador?: string
  emailTrabalhador?: string
  telefoneTrabalhador?: string
  empresa?: string
  dados?: Record<string, any>
  destinatario?: string
}

/**
 * Envia notificação por e-mail para a equipe do Sindicato quando um novo formulário é recebido.
 */
export async function enviarAvisoRecebimento(
  params: AvisoRecebimentoParams
): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] Resend não configurado ou chave de exemplo. Aviso ignorado silenciosamente.')
    return { ok: false, erro: 'Resend não configurado' }
  }

  const destinatario = params.destinatario || EMAIL_DESTINO_PADRAO
  const assunto = `[Site Químicos — ${params.formularioNome}] Novo envio · ${params.protocolo}`

  const linhasDados = params.dados
    ? Object.entries(params.dados)
        .filter(([k]) => !['website_extra', 'protocolo', 'arquivos'].includes(k))
        .map(([k, v]) => `<li><strong>${k}:</strong> ${String(v)}</li>`)
        .join('\n')
    : ''

  const html = `
    <div style="font-family: sans-serif; color: #30252a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4dce0; border-radius: 6px;">
      <div style="background: #65172A; padding: 14px 18px; border-radius: 4px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px;">Sindicato dos Químicos de SJC e Região</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Notificação de Novo Recebimento</p>
      </div>
      
      <p style="font-size: 15px;">Uma nova solicitação foi registrada no portal oficial do Sindicato.</p>
      
      <div style="background: #f8fafb; border: 1px solid #cbd7de; padding: 14px; border-radius: 4px; margin: 18px 0;">
        <div style="font-size: 12px; color: #71636a; text-transform: uppercase; font-weight: bold;">Protocolo</div>
        <div style="font-size: 18px; font-weight: bold; color: #861e32;">${params.protocolo}</div>
        <div style="margin-top: 8px; font-size: 13px;"><strong>Tipo:</strong> ${params.formularioNome}</div>
        ${params.nomeTrabalhador ? `<div style="font-size: 13px;"><strong>Trabalhador:</strong> ${params.nomeTrabalhador}</div>` : ''}
        ${params.empresa ? `<div style="font-size: 13px;"><strong>Empresa:</strong> ${params.empresa}</div>` : ''}
        ${params.telefoneTrabalhador ? `<div style="font-size: 13px;"><strong>Telefone:</strong> ${params.telefoneTrabalhador}</div>` : ''}
        ${params.emailTrabalhador ? `<div style="font-size: 13px;"><strong>E-mail:</strong> ${params.emailTrabalhador}</div>` : ''}
      </div>

      ${linhasDados ? `<h4 style="margin: 16px 0 8px; font-size: 14px;">Dados informados:</h4><ul style="font-size: 13px; line-height: 1.6; padding-left: 20px;">${linhasDados}</ul>` : ''}

      <p style="margin-top: 24px; font-size: 13px; color: #71636a;">
        Acesse o painel administrativo para visualizar a solicitação completa e atualizar sua situação.
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: `Sindicato dos Químicos SJC <${EMAIL_FROM}>`,
      to: [destinatario],
      subject: assunto,
      html,
    })

    if (error) {
      console.error('[email] Erro ao enviar aviso:', error)
      return { ok: false, erro: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.error('[email] Exceção ao enviar e-mail:', err)
    return { ok: false, erro: err?.message || 'Falha no envio' }
  }
}

/**
 * Envia notificação estritamente sigilosa de denúncia para o Sindicato.
 * REGRA ABSOLUTA DE SEGURANÇA: Não inclui o relato da denúncia nem seus anexos no corpo do e-mail.
 */
export async function enviarAvisoDenuncia(params: {
  protocolo: string
  destinatario?: string
}): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] Resend não configurado. Aviso de denúncia não enviado.')
    return { ok: false, erro: 'Resend não configurado' }
  }

  const destinatario = params.destinatario || EMAIL_DESTINO_PADRAO
  const assunto = `[Site Químicos — Denúncia] Novo envio · ${params.protocolo}`

  const html = `
    <div style="font-family: sans-serif; color: #30252a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4dce0; border-radius: 6px;">
      <div style="background: #65172A; padding: 14px 18px; border-radius: 4px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px;">Sindicato dos Químicos de SJC e Região</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Canal de Denúncias Sigilosas</p>
      </div>

      <p style="font-size: 15px; font-weight: bold; color: #861e32;">Foi recebida uma nova denúncia no portal.</p>
      
      <div style="background: #fff8f8; border: 1px solid #f0c4c4; padding: 14px; border-radius: 4px; margin: 18px 0;">
        <div style="font-size: 12px; color: #71636a; text-transform: uppercase; font-weight: bold;">Protocolo de Segurança</div>
        <div style="font-size: 20px; font-weight: bold; color: #861e32;">${params.protocolo}</div>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #30252a;">
        Por motivos estritos de segurança e sigilo, o relato e os eventuais arquivos anexados <strong>não trafegam por e-mail</strong>.
      </p>

      <p style="font-size: 14px; line-height: 1.5; color: #30252a;">
        Acesse o painel administrativo com uma conta que possua permissão específica para o módulo de denúncias para consultar o teor e adotar as medidas cabíveis.
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: `Sindicato dos Químicos SJC <${EMAIL_FROM}>`,
      to: [destinatario],
      subject: assunto,
      html,
    })

    if (error) {
      console.error('[email] Erro ao enviar aviso de denúncia:', error)
      return { ok: false, erro: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.error('[email] Exceção ao enviar aviso de denúncia:', err)
    return { ok: false, erro: err?.message || 'Falha no envio' }
  }
}

/**
 * Envia e-mail de confirmação de recebimento para o trabalhador.
 */
export async function enviarConfirmacaoAoTrabalhador(params: {
  email: string
  nome: string
  protocolo: string
  formularioNome: string
}): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const resend = getResendClient()
  if (!resend || !params.email) {
    return { ok: false, erro: 'Resend não configurado ou e-mail ausente' }
  }

  const assunto = `Recebemos sua solicitação · ${params.protocolo} · Sindicato dos Químicos SJC`

  const html = `
    <div style="font-family: sans-serif; color: #30252a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4dce0; border-radius: 6px;">
      <div style="background: #65172A; padding: 14px 18px; border-radius: 4px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px;">Sindicato dos Químicos de SJC e Região</h2>
      </div>

      <p style="font-size: 15px;">Olá, <strong>${params.nome}</strong>!</p>
      
      <p style="font-size: 14px; line-height: 1.6;">
        Recebemos com sucesso sua solicitação de <strong>${params.formularioNome}</strong> através do nosso site.
      </p>

      <div style="background: #f8fafb; border: 1px solid #cbd7de; padding: 14px; border-radius: 4px; margin: 18px 0; text-align: center;">
        <div style="font-size: 12px; color: #71636a; text-transform: uppercase; font-weight: bold;">Seu Número de Protocolo</div>
        <div style="font-size: 22px; font-weight: bold; color: #861e32; margin-top: 4px;">${params.protocolo}</div>
        <div style="font-size: 12px; color: #71636a; margin-top: 6px;">Guarde este número para acompanhamento junto à secretaria.</div>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
        Nossa equipe está processando sua solicitação e entrará em contato caso seja necessária qualquer informação adicional.
      </p>

      <hr style="border: none; border-top: 1px solid #e4dce0; margin: 24px 0;" />
      
      <p style="font-size: 12px; color: #71636a; line-height: 1.5;">
        <strong>Sindicato dos Químicos de São José dos Campos e Região</strong><br />
        Praça Carlos Gomes, 81 - Centro - São José dos Campos/SP<br />
        Telefone: (12) 3921-8177 | E-mail: contato@quimicosjc.org.br
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: `Sindicato dos Químicos SJC <${EMAIL_FROM}>`,
      to: [params.email],
      subject: assunto,
      html,
    })

    if (error) {
      console.warn('[email] Erro ao enviar confirmação ao trabalhador:', error)
      return { ok: false, erro: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.warn('[email] Exceção ao enviar confirmação ao trabalhador:', err)
    return { ok: false, erro: err?.message || 'Falha no envio' }
  }
}
