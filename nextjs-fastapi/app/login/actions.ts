'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null

  if (!email || !password) {
    return { error: 'Email or password is missing' }
  }

  const data = { email, password }

  const { error } = await supabase.auth.signUp(data)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
  return { success: true }
}