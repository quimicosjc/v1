'use server'

import crypto from 'crypto'
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

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const rg = formData.get('rg')?.toString()?.trim() || ''
    const dataNascimento = formData.get('data_nascimento')?.toString()?.trim() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
    const endereco = formData.get('endereco')?.toString()?.trim() || ''
    const bairro = formData.get('bairro')?.toString()?.trim() || ''
    const cidade = formData.get('cidade')?.toString()?.trim() || ''
    const cep = formData.get('cep')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const funcao = formData.get('funcao')?.toString()?.trim() || ''
    const dataAdmissao = formData.get('data_admissao')?.toString()?.trim() || ''
    const estadoCivil = formData.get('estado_civil')?.toString()?.trim() || ''
    const autorizacao = formData.get('autorizacao')?.toString() === 'true'

    if (!nome) return { ok: false, erro: 'Informe o seu nome completo.' }
    if (!cpf) return { ok: false, erro: 'Informe o seu CPF.' }
    if (!telefone) return { ok: false, erro: 'Informe um telefone para contato.' }
    if (!empresa) return { ok: false, erro: 'Informe a empresa onde trabalha.' }
    if (!autorizacao) {
      return { ok: false, erro: 'É necessário concordar com a autorização de sindicalização.' }
    }

    const protocolo = gerarProtocolo('SIND')
    const formularioId = await obterFormularioId('sindicalizacao')
    const supabase = getSupabaseAdmin()

    const dados = {
      protocolo,
      tipo: 'sindicalizacao',
      situacao: 'recebida',
      nome,
      cpf,
      rg,
      data_nascimento: dataNascimento,
      estado_civil: estadoCivil,
      telefone,
      email,
      endereco,
      bairro,
      cidade,
      cep,
      empresa,
      funcao,
      data_admissao: dataAdmissao,
      autorizacao: true,
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

    // Notificação interna para a equipe do Sindicato (SEM resposta automática ao trabalhador)
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

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const matriculaSocio = formData.get('matricula_socio')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
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
      const supabase = getSupabaseAdmin()
      const nomeArquivo = `carteirinhas/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
      const arrayBuffer = await fotoFile.arrayBuffer()
      const { error: upErr } = await supabase.storage
        .from('privado')
        .upload(nomeArquivo, Buffer.from(arrayBuffer), {
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

    const dados = {
      protocolo,
      tipo: 'carteirinha',
      situacao: 'recebida',
      nome,
      matricula_socio: matriculaSocio,
      cpf,
      empresa,
      telefone,
      email,
      tipo_via: tipoVia,
      foto_path: fotoPath,
      foto_url: null,
      observacoes,
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

    // Notificação interna para a equipe do Sindicato
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

    const nome = formData.get('nome')?.toString()?.trim() || ''
    const matriculaSocio = formData.get('matricula_socio')?.toString()?.trim() || ''
    const cpf = formData.get('cpf')?.toString()?.trim() || ''
    const telefone = formData.get('telefone')?.toString()?.trim() || ''
    const email = formData.get('email')?.toString()?.trim() || ''
    const endereco = formData.get('endereco')?.toString()?.trim() || ''
    const empresa = formData.get('empresa')?.toString()?.trim() || ''
    const alteracoes = formData.get('alteracoes')?.toString()?.trim() || ''

    if (!nome) return { ok: false, erro: 'Informe o seu nome completo.' }
    if (!telefone) return { ok: false, erro: 'Informe um telefone para contato.' }

    const protocolo = gerarProtocolo('ATU')
    const formularioId = await obterFormularioId('atualizacao-cadastral')
    const supabase = getSupabaseAdmin()

    const dados = {
      protocolo,
      tipo: 'atualizacao-cadastral',
      situacao: 'recebida',
      nome,
      matricula_socio: matriculaSocio,
      cpf,
      telefone,
      email,
      endereco,
      empresa,
      alteracoes,
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

    // Notificação interna para a equipe do Sindicato
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
 * O e-mail para o Sindicato recebe o teor integral da denúncia e os anexos para apuração imediata.
 * Nenhuma resposta automática é gerada para o trabalhador.
 */
export async function submeterDenuncia(
  formData: FormData
): Promise<{ ok: boolean; protocolo?: string; erro?: string }> {
  try {
    const honeypot = formData.get('website_extra')?.toString()
    if (honeypot && honeypot.trim() !== '') return { ok: true, protocolo: 'PROT-OK' }

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

    // Processamento de anexos (até 5 arquivos, max 20MB cada)
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

        const nomeArquivo = `denuncias/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
        const arrayBuffer = await arq.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: upErr } = await supabase.storage
          .from('privado')
          .upload(nomeArquivo, buffer, {
            contentType: arq.type || 'application/octet-stream',
            upsert: false,
          })

        if (!upErr) {
          anexosSalvos.push({
            nome: arq.name,
            url: '', // Privado: acessado via link assinado com auth
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

    // Para o banco de dados salvamos a referência do arquivo privado
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

    // Dispara e-mail com conteúdo completo e anexos para o responsável do Sindicato
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
