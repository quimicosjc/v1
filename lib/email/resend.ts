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
 * (Apenas notificação interna para o Sindicato — nenhuma resposta automática é enviada ao trabalhador).
 */
export async function enviarAvisoRecebimento(
  params: AvisoRecebimentoParams
): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] Resend não configurado. Aviso ignorado silenciosamente.')
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
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Nova Solicitação Recebida no Site</p>
      </div>
      
      <div style="background: #f8fafb; border: 1px solid #cbd7de; padding: 14px; border-radius: 4px; margin: 18px 0;">
        <div style="font-size: 12px; color: #71636a; text-transform: uppercase; font-weight: bold;">Protocolo</div>
        <div style="font-size: 18px; font-weight: bold; color: #861e32;">${params.protocolo}</div>
        <div style="margin-top: 8px; font-size: 13px;"><strong>Tipo:</strong> ${params.formularioNome}</div>
        ${params.nomeTrabalhador ? `<div style="font-size: 13px;"><strong>Nome:</strong> ${params.nomeTrabalhador}</div>` : ''}
        ${params.empresa ? `<div style="font-size: 13px;"><strong>Empresa:</strong> ${params.empresa}</div>` : ''}
        ${params.telefoneTrabalhador ? `<div style="font-size: 13px;"><strong>Telefone:</strong> ${params.telefoneTrabalhador}</div>` : ''}
        ${params.emailTrabalhador ? `<div style="font-size: 13px;"><strong>E-mail:</strong> ${params.emailTrabalhador}</div>` : ''}
      </div>

      ${linhasDados ? `<h4 style="margin: 16px 0 8px; font-size: 14px;">Dados informados:</h4><ul style="font-size: 13px; line-height: 1.6; padding-left: 20px;">${linhasDados}</ul>` : ''}

      <p style="margin-top: 24px; font-size: 12px; color: #71636a;">
        Esta mensagem foi gerada automaticamente pelo portal quimicosjc.org.br.
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

export interface AnexoDenunciaEmail {
  nome: string
  url: string
  tipo: string
  buffer?: Buffer
}

export interface AvisoDenunciaParams {
  protocolo: string
  empresa: string
  tipoInfracao: string
  relato: string
  sigilo: string
  nome?: string
  contato?: string
  anexos?: AnexoDenunciaEmail[]
  destinatario?: string
}

/**
 * Envia e-mail COMPLETO de denúncia para o Sindicato.
 * Conforme instrução: o relato na íntegra, dados e arquivos anexados vão diretamente no e-mail
 * para apuração imediata pelo responsável habilitado.
 */
export async function enviarAvisoDenuncia(
  params: AvisoDenunciaParams
): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] Resend não configurado. Aviso de denúncia não enviado.')
    return { ok: false, erro: 'Resend não configurado' }
  }

  const destinatario = params.destinatario || EMAIL_DESTINO_PADRAO
  const assunto = `[Site Químicos — Denúncia] ${params.empresa} · ${params.tipoInfracao} · ${params.protocolo}`

  const modoSigiloTexto =
    params.sigilo === 'anonimo'
      ? 'Anônimo (Trabalhador optou por não se identificar)'
      : `Identificado: ${params.nome || 'Não informado'} ${params.contato ? `(Contato: ${params.contato})` : ''}`

  const listaLinksAnexos =
    params.anexos && params.anexos.length > 0
      ? params.anexos
          .map(
            (a, idx) =>
              `<li><a href="${a.url}" target="_blank" style="color: #861e32; font-weight: bold;">Arquivo ${idx + 1}: ${a.nome} (${a.tipo.toUpperCase()})</a></li>`
          )
          .join('\n')
      : '<em>Nenhum anexo enviado.</em>'

  const html = `
    <div style="font-family: sans-serif; color: #30252a; max-width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #e4dce0; border-radius: 6px;">
      
      <div style="background: #65172A; padding: 16px 20px; border-radius: 4px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">Sindicato dos Químicos de SJC e Região</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Nova Denúncia Trabalhista Recebida no Site</p>
      </div>

      <div style="background: #fff8f8; border: 1px solid #f0c4c4; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 12px; color: #71636a; text-transform: uppercase; font-weight: bold;">Protocolo de Registro</span>
          <span style="font-size: 16px; font-weight: bold; color: #861e32;">${params.protocolo}</span>
        </div>
        
        <div style="font-size: 15px; margin-bottom: 6px;">
          <strong>Empresa Denunciada:</strong> <span style="color: #861e32; font-weight: bold;">${params.empresa}</span>
        </div>
        
        <div style="font-size: 14px; margin-bottom: 6px;">
          <strong>Tipo de Irregularidade:</strong> ${params.tipoInfracao}
        </div>

        <div style="font-size: 14px;">
          <strong>Modo de Identificação:</strong> ${modoSigiloTexto}
        </div>
      </div>

      <h3 style="font-size: 16px; color: #861e32; border-bottom: 2px solid #861e32; padding-bottom: 4px; margin: 20px 0 10px 0;">
        Relato Detalhado dos Fatos
      </h3>
      <div style="background: #f8fafb; border: 1px solid #cbd7de; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.7; color: #222222; white-space: pre-wrap;">
${params.relato}
      </div>

      <h3 style="font-size: 15px; color: #30252a; margin: 20px 0 8px 0;">
        Arquivos e Provas Anexadas (${params.anexos?.length || 0})
      </h3>
      <ul style="font-size: 13px; line-height: 1.6; padding-left: 20px;">
        ${listaLinksAnexos}
      </ul>

      <hr style="border: none; border-top: 1px solid #e4dce0; margin: 24px 0;" />

      <p style="font-size: 12px; color: #71636a; line-height: 1.4;">
        Este e-mail contém informações confidenciais destinadas exclusivamente ao responsável habilitado do Sindicato dos Químicos de SJC e Região para averiguação e fiscalização.
      </p>
    </div>
  `

  // Prepara anexos nativos no Resend (se buffers fornecidos e menores que 20MB)
  const resendAttachments: { filename: string; content: Buffer }[] = []
  if (params.anexos && params.anexos.length > 0) {
    for (const anexo of params.anexos) {
      if (anexo.buffer && anexo.buffer.length > 0 && anexo.buffer.length <= 15 * 1024 * 1024) {
        resendAttachments.push({
          filename: anexo.nome,
          content: anexo.buffer,
        })
      }
    }
  }

  try {
    const payload: any = {
      from: `Sindicato dos Químicos SJC <${EMAIL_FROM}>`,
      to: [destinatario],
      subject: assunto,
      html,
    }

    if (resendAttachments.length > 0) {
      payload.attachments = resendAttachments
    }

    const { data, error } = await resend.emails.send(payload)

    if (error) {
      console.error('[email] Erro ao enviar denúncia completa:', error)
      return { ok: false, erro: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.error('[email] Exceção ao enviar denúncia completa:', err)
    return { ok: false, erro: err?.message || 'Falha no envio' }
  }
}
