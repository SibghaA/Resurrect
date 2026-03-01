import { cookies } from 'next/headers'
import { signToken, verifyToken, type TokenPayload } from './jwt'

const COOKIE_NAME = 'token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setSession(userId: string, email: string, profileSetup: boolean) {
  const token = await signToken({ sub: userId, email, profileSetup })
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<TokenPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

export function clearSession() {
  cookies().delete(COOKIE_NAME)
}
