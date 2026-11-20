'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  enviarAvisoRecebimento,
  enviarAvisoDenuncia,
  type AnexoDenunciaEmail,
} from '@/lib/email/resend'

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function gerarProtocolo(prefixo: string): string {
  const agora = new Date()
  const ano = agora.getFullYear().toString().slice(-2)
  const mes = (agora.getMonth() + 1).toString().padStart(2, '0')
  const aleatorio = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `PROT-${prefixo}-${ano}${mes}-${aleatorio}`
}

async function obterFormularioId(slug: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('formularios')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (data?.id) return data.id

  return '00000000-0000-0000-0000-000000000000'
}

/**
 * Gera um hash SHA-256 anônimo do IP (conformidade LGPD) e verifica limite de envios (Rate Limiting)
 */
async function verificarRateLimitPublico(): Promise<{ bloqueado: boolean; ipHash: string }> {
  try {
    const hdrs = await headers()
    const forwarded = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || 'ip-local'
    const ip = forwarded.split(',')[0].trim()
    const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || 'quimicos-sjc-salt'
    const ipHash = crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 24)

    if (ip === 'ip-local' || ip === '127.0.0.1' || ip === '::1') {
      return { bloqueado: false, ipHash }
    }

    const supabase = getSupabaseAdmin()
    const quinzeMinAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('recebimentos')
      .select('id', { count: 'exact', head: true })
      .gte('criado_em', quinzeMinAtras)
      .contains('dados', { ip_hash: ipHash })

    if (typeof count === 'number' && count >= 10) {
      return { bloqueado: true, ipHash }
    }

    return { bloqueado: false, ipHash }
  } catch {
    return { bloqueado: false, ipHash: 'unknown' }
  }
}

/**
 * Valida a assinatura binária real (Magic Bytes) do arquivo enviado
 * Impede upload de executáveis ou scripts renomeados como imagem/PDF.
 */
function validarMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false

  const e = ext.toLowerCase()
  // JPEG: FF D8 FF
  if (e === 'jpg' || e === 'jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  // PNG: 89 50 4E 47
  if (e === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  }
  // WebP: RIFF....WEBP
  if (e === 'webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    )
  }
  // PDF: %PDF-
  if (e === 'pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  }
  // ZIP-based Office / OpenDocument (docx, odt, ods): PK\x03\x04
  if (e === 'docx' || e === 'odt' || e === 'ods') {
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
  }
  // Legacy MS Office (doc): D0 CF 11 E0
  if (e === 'doc') {
    return (
      (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) ||
      (buffer[0] === 0x50 && buffer[1] === 0x4b)
    )
  }
  // MP4 / M4A: ....ftyp
  if (e === 'mp4' || e === 'm4a') {
    return buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp'
  }
  // MP3: ID3 or MPEG sync word
  if (e === 'mp3') {
    return (
      buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    )
  }
  // TXT: sem bytes nulos ou executáveis MZ/ELF/scripts
  if (e === 'txt') {
    const amostra = buffer.subarray(0, Math.min(buffer.length, 512))
    if (amostra.includes(0x00)) return false
    if (amostra[0] === 0x4d && amostra[1] === 0x5a) return false // MZ exe
    return true
  }

  return false
}

/**
 * 1. SUBMISSÃO DE FICHA DE SINDICALIZAÇÃO (FIQUE SÓCIO)
 */
export async function submeterSindicalizacao(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') {
      return { ok: true, protocolo: 'PROT-OK' }
    }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const apelido = formData.get('apelido')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const rg = formData.get('rg')?.toString()?.trim() || ''
    const ctps = formData.get('ctps')?.toString()?.trim() || ''
    const dataNascimento = formData.get('data_nascimento')?.toString()?.trim() || ''
    const estadoCivil = formData.get('estado_civil')?.toString()?.trim() || ''
    const numeroDependentes = formData.get('numero_dependentes')?.toString()?.trim() || '0'
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const telefoneResidencial = formData.get('telefone_residencial')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
    const cep = formData.get('cep')?.toString()?.trim() || ''
    const endereco = formData.get('endereco')?.toString()?.trim() || ''
    const numeroEndereco = formData.get('numero_endereco')?.toString()?.trim() || ''
    const bairro = formData.get('bairro')?.toString()?.trim() || ''
    const cidade = formData.get('cidade')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const setor = formData.get('setor')?.toString()?.trim() || ''
    const funcao = formData.get('funcao')?.toString()?.trim() || ''
    const matriculaEmpresa = formData.get('matricula_empresa')?.toString()?.trim() || ''
    const dataAdmissao = formData.get('data_admissao')?.toString()?.trim() || ''
    const telefoneEmpresa = formData.get('telefone_empresa')?.toString()?.trim() || ''
    const ramal = formData.get('ramal')?.toString()?.trim() || ''
    const turno = formData.get('turno')?.toString()?.trim() || ''
    const autorizacao = formData.get('autorizacao')?.toString() === 'true'

    if (!nome) return { ok: false, erro: 'Informe o seu nome completo.' }
    if (!cpf) return { ok: false, erro: 'Informe o seu CPF.' }
    if (!telefone) return { ok: false, erro: 'Informe um telefone celular / WhatsApp para contato.' }
    if (!empresa) return { ok: false, erro: 'Informe a empresa onde trabalha.' }
    if (!autorizacao) {
      return { ok: false, erro: 'É necessário concordar com a autorização de sindicalização (Art. 545 da CLT).' }
    }

    const protocolo = gerarProtocolo('SIND')
    const formularioId = await obterFormularioId('sindicalizacao')
    const supabase = getSupabaseAdmin()

    const enderecoCompleto = numeroEndereco && endereco && !endereco.includes(numeroEndereco)
      ? `${endereco}, Nº ${numeroEndereco}`
      : endereco

    const dados = {
      protocolo,
      tipo: 'sindicalizacao',
      situacao: 'recebida',
      nome,
      apelido,
      cpf,
      rg,
      ctps,
      data_nascimento: dataNascimento,
      estado_civil: estadoCivil,
      numero_dependentes: numeroDependentes,
      telefone,
      telefone_residencial: telefoneResidencial,
      email,
      cep,
      endereco: enderecoCompleto,
      numero_endereco: numeroEndereco,
      bairro,
      cidade,
      empresa,
      setor,
      funcao,
      matricula_empresa: matriculaEmpresa,
      data_admissao: dataAdmissao,
      telefone_empresa: telefoneEmpresa,
      ramal,
      turno,
      autorizacao: true,
      ip_hash: ipHash,
      enviado_em: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados,
      processado: false,
    })

    if (dbError) {
      console.error('[sindicalizacao] Erro no Supabase:', dbError.message)
      return { ok: false, erro: `Falha ao registrar solicitação: ${dbError.message}` }
    }

    enviarAvisoRecebimento({
      protocolo,
      formularioNome: 'Ficha de Sindicalização',
      nomeTrabalhador: nome,
      emailTrabalhador: email,
      telefoneTrabalhador: telefone,
      empresa,
      dados,
    }).catch(console.error)

    return { ok: true, protocolo }
  } catch (err: any) {
    console.error('[sindicalizacao] Erro inesperado:', err)
    return { ok: false, erro: err?.message || 'Erro inesperado ao processar formulário' }
  }
}

/**
 * 2. SUBMISSÃO DE SOLICITAÇÃO DE CARTEIRINHA
 */
export async function submeterCarteirinha(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const apelido = formData.get('apelido')?.toString()?.trim() || ''
    const matriculaSocio = formData.get('matricula_socio')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const telefoneResidencial = formData.get('telefone_residencial')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
    const cep = formData.get('cep')?.toString()?.trim() || ''
    const endereco = formData.get('endereco')?.toString()?.trim() || ''
    const numeroEndereco = formData.get('numero_endereco')?.toString()?.trim() || ''
    const bairro = formData.get('bairro')?.toString()?.trim() || ''
    const cidade = formData.get('cidade')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const cargo = formData.get('cargo')?.toString()?.trim() || ''
    const setor = formData.get('setor')?.toString()?.trim() || ''
    const turno = formData.get('turno')?.toString()?.trim() || ''
    const telefoneEmpresa = formData.get('telefone_empresa')?.toString()?.trim() || ''
    const numeroDependentes = formData.get('numero_dependentes')?.toString()?.trim() || '0'
    const tipoVia = formData.get('tipo_via')?.toString()?.trim() || 'primeira_via'
    const observacoes = formData.get('observacoes')?.toString()?.trim() || ''

    if (!nome) return { ok: false, erro: 'Informe o seu nome completo.' }
    if (!telefone) return { ok: false, erro: 'Informe um telefone para contato.' }

    let fotoPath: string | null = null
    const fotoFile = formData.get('foto') as File | null
    if (fotoFile && fotoFile.size > 0) {
      if (fotoFile.size > 5 * 1024 * 1024) {
        return { ok: false, erro: 'A foto deve ter no máximo 5 MB.' }
      }
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp']
      const ext = fotoFile.name.split('.').pop()?.toLowerCase() || ''
      if (!allowedExts.includes(ext)) {
        return { ok: false, erro: 'Formato de foto não suportado. Envie em JPG, PNG ou WebP.' }
      }
      const arrayBuffer = await fotoFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      if (!validarMagicBytes(buffer, ext)) {
        return { ok: false, erro: 'O arquivo enviado não é uma imagem válida (JPG, PNG ou WebP).' }
      }

      const supabase = getSupabaseAdmin()
      const nomeArquivo = `carteirinhas/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('privado')
        .upload(nomeArquivo, buffer, {
          contentType: fotoFile.type || 'image/jpeg',
          upsert: false,
        })
      if (!upErr) {
        fotoPath = nomeArquivo
      } else {
        console.error('[carteirinha] Erro ao enviar foto para storage privado:', upErr.message)
      }
    }

    const protocolo = gerarProtocolo('CART')
    const formularioId = await obterFormularioId('carteirinha')
    const supabase = getSupabaseAdmin()

    const enderecoCompleto = numeroEndereco && endereco && !endereco.includes(numeroEndereco)
      ? `${endereco}, Nº ${numeroEndereco}`
      : endereco

    const dados = {
      protocolo,
      tipo: 'carteirinha',
      situacao: 'recebida',
      nome,
      apelido,
      matricula_socio: matriculaSocio,
      cpf,
      telefone,
      telefone_residencial: telefoneResidencial,
      email,
      cep,
      endereco: enderecoCompleto,
      numero_endereco: numeroEndereco,
      bairro,
      cidade,
      empresa,
      cargo,
      setor,
      turno,
      telefone_empresa: telefoneEmpresa,
      numero_dependentes: numeroDependentes,
      tipo_via: tipoVia,
      foto_path: fotoPath,
      foto_url: null,
      observacoes,
      ip_hash: ipHash,
      enviado_em: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados,
      processado: false,
    })

    if (dbError) {
      console.error('[carteirinha] Erro no Supabase:', dbError.message)
      return { ok: false, erro: 'Falha ao registrar solicitação de carteirinha. Tente novamente em instantes.' }
    }

    enviarAvisoRecebimento({
      protocolo,
      formularioNome: 'Solicitação de Carteirinha',
      nomeTrabalhador: nome,
      emailTrabalhador: email,
      telefoneTrabalhador: telefone,
      empresa,
      dados,
    }).catch(console.error)

    return { ok: true, protocolo }
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro inesperado ao solicitar carteirinha' }
  }
}

/**
 * 3. SUBMISSÃO DE ATUALIZAÇÃO CADASTRAL
 */
export async function submeterAtualizacaoCadastral(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const apelido = formData.get('apelido')?.toString()?.trim() || ''
    const matriculaSocio = formData.get('matricula_socio')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const rg = formData.get('rg')?.toString()?.trim() || ''
    const ctps = formData.get('ctps')?.toString()?.trim() || ''
    const dataNascimento = formData.get('data_nascimento')?.toString()?.trim() || ''
    const estadoCivil = formData.get('estado_civil')?.toString()?.trim() || ''
    const numeroDependentes = formData.get('numero_dependentes')?.toString()?.trim() || '0'
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const telefoneResidencial = formData.get('telefone_residencial')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
    const cep = formData.get('cep')?.toString()?.trim() || ''
    const endereco = formData.get('endereco')?.toString()?.trim() || ''
    const numeroEndereco = formData.get('numero_endereco')?.toString()?.trim() || ''
    const bairro = formData.get('bairro')?.toString()?.trim() || ''
    const cidade = formData.get('cidade')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const setor = formData.get('setor')?.toString()?.trim() || ''
    const cargo = formData.get('cargo')?.toString()?.trim() || ''
    const matriculaEmpresa = formData.get('matricula_empresa')?.toString()?.trim() || ''
    const dataAdmissao = formData.get('data_admissao')?.toString()?.trim() || ''
    const telefoneEmpresa = formData.get('telefone_empresa')?.toString()?.trim() || ''
    const ramal = formData.get('ramal')?.toString()?.trim() || ''
    const turno = formData.get('turno')?.toString()?.trim() || ''
    const aposentado = formData.get('aposentado')?.toString()?.trim() || 'Não'
    const possuiCarteirinha = formData.get('possui_carteirinha')?.toString()?.trim() || 'Sim'
    const alteracoes = formData.get('alteracoes')?.toString()?.trim() || ''

    if (!nome) return { ok: false, erro: 'Informe o seu nome completo.' }
    if (!telefone) return { ok: false, erro: 'Informe um telefone para contato.' }

    const protocolo = gerarProtocolo('ATU')
    const formularioId = await obterFormularioId('atualizacao-cadastral')
    const supabase = getSupabaseAdmin()

    const enderecoCompleto = numeroEndereco && endereco && !endereco.includes(numeroEndereco)
      ? `${endereco}, Nº ${numeroEndereco}`
      : endereco

    const dados = {
      protocolo,
      tipo: 'atualizacao-cadastral',
      situacao: 'recebida',
      nome,
      apelido,
      matricula_socio: matriculaSocio,
      cpf,
      rg,
      ctps,
      data_nascimento: dataNascimento,
      estado_civil: estadoCivil,
      numero_dependentes: numeroDependentes,
      telefone,
      telefone_residencial: telefoneResidencial,
      email,
      cep,
      endereco: enderecoCompleto,
      numero_endereco: numeroEndereco,
      bairro,
      cidade,
      empresa,
      setor,
      cargo,
      matricula_empresa: matriculaEmpresa,
      data_admissao: dataAdmissao,
      telefone_empresa: telefoneEmpresa,
      ramal,
      turno,
      aposentado,
      possui_carteirinha: possuiCarteirinha,
      alteracoes,
      ip_hash: ipHash,
      enviado_em: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados,
      processado: false,
    })

    if (dbError) {
      return { ok: false, erro: `Falha ao registrar: ${dbError.message}` }
    }

    enviarAvisoRecebimento({
      protocolo,
      formularioNome: 'Atualização Cadastral',
      nomeTrabalhador: nome,
      emailTrabalhador: email,
      telefoneTrabalhador: telefone,
      empresa,
      dados,
    }).catch(console.error)

    return { ok: true, protocolo }
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro ao atualizar dados' }
  }
}

/**
 * 4. SUBMISSÃO DE CANAL DE DENÚNCIAS
 */
export async function submeterDenuncia(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const tipoInfracao = formData.get('tipo_infracao')?.toString()?.trim() || 'Irregularidade Trabalhista'
    const relato = formData.get('relato')?.toString()?.trim() || ''
    const sigilo = formData.get('sigilo')?.toString()?.trim() || 'anonimo'
    const nome = formData.get('nome')?.toString()?.trim() || 'Denunciante Anônimo'
    const contato = formData.get('contato')?.toString()?.trim() || ''

    if (!empresa) return { ok: false, erro: 'Informe o nome da empresa denunciada.' }
    if (!relato || relato.length < 20) {
      return { ok: false, erro: 'O relato da denúncia deve conter pelo menos 20 caracteres detalhando a irregularidade.' }
    }

    const arquivos = formData.getAll('arquivos') as File[]
    const anexosSalvos: (AnexoDenunciaEmail & { path?: string })[] = []
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mp3', 'm4a', 'odt', 'ods']

    if (arquivos && arquivos.length > 0) {
      const supabase = getSupabaseAdmin()
      for (const arq of arquivos.slice(0, 5)) {
        if (!arq || arq.size === 0) continue
        if (arq.size > 20 * 1024 * 1024) continue

        const ext = arq.name.split('.').pop()?.toLowerCase() || 'bin'
        if (!allowedExts.includes(ext)) {
          console.warn(`[denuncia] Anexo rejeitado por extensão não permitida: .${ext}`)
          continue
        }

        const arrayBuffer = await arq.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        if (!validarMagicBytes(buffer, ext)) {
          console.warn(`[denuncia] Anexo rejeitado por assinatura binária inválida: .${ext}`)
          continue
        }

        const nomeArquivo = `denuncias/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`

        const { error: upErr } = await supabase.storage
          .from('privado')
          .upload(nomeArquivo, buffer, {
            contentType: arq.type || 'application/octet-stream',
            upsert: false,
          })

        if (!upErr) {
          anexosSalvos.push({
            nome: arq.name,
            url: '',
            path: nomeArquivo,
            tipo: ext,
            buffer,
          })
        } else {
          console.error('[denuncia] Erro ao salvar anexo no storage privado:', upErr.message)
        }
      }
    }

    const protocolo = gerarProtocolo('DEN')
    const formularioId = await obterFormularioId('denuncia')
    const supabase = getSupabaseAdmin()

    const anexosBanco = anexosSalvos.map(({ nome, path, tipo }) => ({ nome, path, tipo, url: '' }))

    const dados = {
      protocolo,
      tipo: 'denuncia',
      situacao: 'nova',
      empresa,
      tipo_infracao: tipoInfracao,
      relato,
      sigilo,
      nome: sigilo === 'anonimo' ? 'Anônimo' : nome,
      contato: sigilo === 'anonimo' ? '' : contato,
      anexos: anexosBanco,
      ip_hash: ipHash,
      enviado_em: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados,
      processado: false,
    })

    if (dbError) {
      console.error('[denuncia] Erro no Supabase:', dbError.message)
      return { ok: false, erro: 'Falha ao registrar denúncia. Tente novamente em instantes.' }
    }

    enviarAvisoDenuncia({
      protocolo,
      empresa,
      tipoInfracao,
      relato,
      sigilo,
      nome: sigilo === 'anonimo' ? undefined : nome,
      contato: sigilo === 'anonimo' ? undefined : contato,
      anexos: anexosSalvos,
    }).catch(console.error)

    return { ok: true, protocolo }
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro ao registrar denúncia' }
  }
}

/**
 * 5. SUBMISSÃO DE CADASTRO PARA NOTÍCIAS (NEWSLETTER / WHATSAPP)
 */
export async function submeterCadastroNoticias(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''

    if (!nome) return { ok: false, erro: 'Informe seu nome.' }
    if (!email && !telefone) {
      return { ok: false, erro: 'Informe pelo menos um e-mail ou telefone celular.' }
    }

    const protocolo = gerarProtocolo('NOTIC')
    const supabase = getSupabaseAdmin()

    if (email) {
      await supabase.from('inscricoes_noticias').upsert(
        {
          nome,
          email,
          ativo: true,
          criado_em: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
    }

    const formularioId = await obterFormularioId('contato')
    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados: {
        protocolo,
        tipo: 'cadastro-noticias',
        situacao: 'recebida',
        nome,
        email,
        telefone,
        ip_hash: ipHash,
        enviado_em: new Date().toISOString(),
      },
      processado: false,
    })

    if (dbError) {
      console.error('[cadastro-noticias] Erro no Supabase:', dbError.message)
      return { ok: false, erro: 'Falha ao registrar inscrição. Tente novamente mais tarde.' }
    }

    return { ok: true, protocolo }
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro ao cadastrar para notícias' }
  }
}

/**
 * 6. SUBMISSÃO DO FORMULÁRIO FALE CONOSCO (/paginas/fale-conosco)
 * Paridade com quimicosjc.org.br/fale-conosco
 */
export async function submeterFaleConosco(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

    const { bloqueado, ipHash } = await verificarRateLimitPublico()
    if (bloqueado) {
      return { ok: false, erro: 'Muitas solicitações enviadas em sequência. Aguarde alguns minutos e tente novamente.' }
    }

    const opcaoContato = formData.get('opcao_contato')?.toString()?.trim() || 'Dúvidas Gerais e Processos'
    const isDenuncia = opcaoContato.toLowerCase().includes('denúncia') || opcaoContato.toLowerCase().includes('denuncia')
    const nomeRaw = formData.get('nome')?.toString()?.trim() || ''
    const nome = nomeRaw || (isDenuncia ? 'Anônimo' : '')
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const cidade = formData.get('cidade')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const mensagem = formData.get('mensagem')?.toString()?.trim() || ''

    if (!isDenuncia && !nome) {
      return { ok: false, erro: 'Informe o seu nome completo.' }
    }
    if (!empresa) {
      return { ok: false, erro: 'Informe a fábrica / empresa onde trabalha.' }
    }
    if (!cidade) {
      return { ok: false, erro: 'Informe a cidade.' }
    }
    if (!mensagem || mensagem.length < 5) {
      return { ok: false, erro: 'Escreva sua mensagem antes de enviar.' }
    }

    const protocolo = gerarProtocolo(isDenuncia ? 'DEN' : 'CONT')
    const formularioId = await obterFormularioId(isDenuncia ? 'denuncia' : 'contato')
    const supabase = getSupabaseAdmin()

    if (opcaoContato.toLowerCase().includes('boca no trombone') && email) {
      await supabase.from('inscricoes_noticias').upsert(
        {
          nome: nome || 'Leitor Boca no Trombone',
          email,
          ativo: true,
          criado_em: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
    }

    const dados = isDenuncia
      ? {
          protocolo,
          tipo: 'denuncia',
          situacao: 'nova',
          empresa,
          cidade,
          tipo_infracao: 'Denúncia via Fale Conosco',
          relato: mensagem,
          sigilo: nomeRaw ? 'identificado' : 'anonimo',
          nome: nomeRaw || 'Anônimo',
          contato: [email, telefone].filter(Boolean).join(' • '),
          anexos: [],
          ip_hash: ipHash,
          enviado_em: new Date().toISOString(),
        }
      : {
          protocolo,
          tipo: 'fale-conosco',
          situacao: 'recebida',
          opcao_contato: opcaoContato,
          nome,
          empresa,
          cidade,
          email,
          telefone,
          mensagem,
          ip_hash: ipHash,
          enviado_em: new Date().toISOString(),
        }

    const { error: dbError } = await supabase.from('recebimentos').insert({
      formulario_id: formularioId,
      dados,
      processado: false,
    })

    if (dbError) {
      console.error('[fale-conosco] Erro no Supabase:', dbError.message)
      return { ok: false, erro: 'Falha ao enviar mensagem. Tente novamente em instantes.' }
    }

    if (isDenuncia) {
      enviarAvisoDenuncia({
        protocolo,
        empresa: `${empresa} (${cidade})`,
        tipoInfracao: 'Denúncia via Fale Conosco',
        relato: mensagem,
        sigilo: nomeRaw ? 'identificado' : 'anonimo',
        nome: nomeRaw || undefined,
        contato: [email, telefone].filter(Boolean).join(' • ') || undefined,
        anexos: [],
      }).catch(console.error)
    } else {
      enviarAvisoRecebimento({
        protocolo,
        formularioNome: `Fale Conosco (${opcaoContato})`,
        nomeTrabalhador: nome,
        emailTrabalhador: email,
        telefoneTrabalhador: telefone,
        empresa: `${empresa} - ${cidade}`,
        dados,
      }).catch(console.error)
    }

    return { ok: true, protocolo }
  } catch (err: any) {
    return { ok: false, erro: err?.message || 'Erro ao enviar mensagem' }
  }
}
