'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
    return { success: true }
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email ou senha inválidos. Verifique suas credenciais.' }
        default:
          return { error: 'Erro ao autenticar. Verifique seus dados.' }
      }
    }
    // Next.js redirect throws a NEXT_REDIRECT error which must be re-thrown
    if (error?.message?.includes('NEXT_REDIRECT') || error?.digest?.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Server action login error:', error)
    return { error: 'Email ou senha inválidos. Verifique suas credenciais.' }
  }
}
