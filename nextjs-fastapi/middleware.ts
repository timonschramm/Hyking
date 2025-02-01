import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Get the current session and user
  const { data: { session } } = await supabase.auth.getSession()

  // Public paths that don't require onboarding check
  const publicPaths = ['/', '/auth', '/onboarding', '/_next', '/api', '/favicon.ico', '/public']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

  // If not logged in and trying to access dashboard, redirect to login
  if (!session && isDashboardPath) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Only check onboarding status for dashboard routes
  if (session?.user && isDashboardPath) {
    try {
      // Get user profile from Supabase
      const { data: profile } = await supabase
        .from('Profile')
        .select('onboardingCompleted')
        .eq('id', session.user.id)
        .single()

      // If onboarding is not completed, redirect to onboarding page
      if (!profile?.onboardingCompleted) {
        const redirectUrl = new URL('/onboarding', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    // '/api/:path*',
    // '/chats/:path*',
    // '/dashboard/:path*'
  ],
}