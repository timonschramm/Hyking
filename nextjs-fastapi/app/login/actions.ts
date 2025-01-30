'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Check if this is an OAuth sign in
  const provider = formData.get('provider') as 'google' | 'apple' | null
  
  if (provider) {
  // console.log('Starting OAuth sign in with provider:', provider);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      })

    // console.log('OAuth response:', { data, error });

      if (error) {
        console.error('Supabase OAuth error:', error);
        return { error: error.message }
      }

      // Instead of using Next.js redirect, return the URL
      if (data?.url) {
        return { url: data.url }
      }
      
      return { error: 'Failed to get OAuth URL' }
    } catch (err) {
      console.error('Caught error in OAuth flow:', err);
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }

  // Handle regular email/password login
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

  // Check if this is an OAuth sign up
  const provider = formData.get('provider') as 'google' | 'apple' | null
  
  if (provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Redirect to OAuth provider's login page
    if (data?.url) {
      redirect(data.url)
    }
    
    return { error: 'Failed to get OAuth URL' }
  }

  // Handle regular email/password signup
  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null

  if (!email || !password) {
    return { error: 'Email or password is missing' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
  return { success: true }
}