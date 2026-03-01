import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/api/auth/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token = req.cookies.get('token')?.value
  let session: { sub: string; email: string; profileSetup: boolean } | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret)
      session = payload as { sub: string; email: string; profileSetup: boolean }
    } catch {
      // invalid or expired token — treat as unauthenticated
    }
  }

  // Already logged in with profile complete — send away from auth pages
  if (isPublic && session?.profileSetup) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isPublic) return NextResponse.next()

  // Require authentication for everything else
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Force profile setup before accessing anything else
  if (
    !session.profileSetup &&
    pathname !== '/profile/setup' &&
    !pathname.startsWith('/api/user/profile')
  ) {
    return NextResponse.redirect(new URL('/profile/setup', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
