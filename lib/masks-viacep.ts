export function formatarCPF(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`
}

export function formatarCEP(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`
}

export function validarCPF(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(digitos.charAt(9), 10)) return false

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(digitos.charAt(10), 10)
}

export interface EnderecoViaCEP {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export async function buscarEnderecoPorCEP(cep: string): Promise<EnderecoViaCEP | null> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.erro) return null
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
    }
  } catch {
    return null
  }
}
