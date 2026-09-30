'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/admin'

  if (!email || !password) {
    return { error: 'Por favor, preencha o e-mail e a senha.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos. Por favor, confira os dados.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Este e-mail ainda não foi confirmado.' }
    }
    return { error: `Não foi possível entrar: ${error.message}` }
  }

  redirect(redirectTo)
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
