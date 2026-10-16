'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawRedirect = (formData.get('redirect') as string) || '/admin'

  // Blindagem contra Open Redirect (CWE-601): aceita apenas caminhos locais seguros
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('\\') ? rawRedirect : '/admin'

  if (!email || !password) {
    return { error: 'Por favor, preencha o e-mail e a senha.', email }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos. Por favor, confira os dados.', email }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Este e-mail ainda não foi confirmado.', email }
    }
    return { error: `Não foi possível entrar: ${error.message}`, email }
  }

  redirect(redirectTo)
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
