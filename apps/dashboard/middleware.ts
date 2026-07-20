import { NextRequest, NextResponse } from 'next/server'

const AGENCY_ONLY = ['/daily', '/generate']

// Middleware runs in the Edge runtime, which does not support Node.js `crypto`.
// The HMAC verification below re-implements the logic from lib/session-crypto.ts
// using the Web Crypto API (crypto.subtle), which is available in the Edge runtime.
export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export function base64urlDecode(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function extractRole(cookieValue: string): Promise<string | null> {
  const secret = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-in-production'
  const dot = cookieValue.lastIndexOf('.')
  if (dot === -1) return null

  const payload = cookieValue.slice(0, dot)
  const mac = cookieValue.slice(dot + 1)

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const valid = await crypto.subtle.verify('HMAC', key, hexToBytes(mac), encoder.encode(payload))
    if (!valid) return null

    const parsed = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)))
    return typeof parsed?.role === 'string' ? parsed.role : null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('medgram-session')
  const { pathname } = request.nextUrl

  const to = (path: string, deleteCookie = false) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const res = NextResponse.redirect(url)
    if (deleteCookie) res.cookies.delete('medgram-session')
    return res
  }

  if (!session && pathname !== '/login') return to('/login')
  if (session && pathname === '/login') return to('/')

  if (session) {
    const role = await extractRole(session.value)
    if (role === null) return to('/login', true)
    if (role === 'doctor' && AGENCY_ONLY.some((p) => pathname.startsWith(p))) return to('/')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
