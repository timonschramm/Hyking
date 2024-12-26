import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/onboarding'
  
  if (code) {
    const supabase = createClient()
    const { error } = await (await supabase).auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Use the origin from the request URL to maintain localhost/prod URLs
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/error`)
} 