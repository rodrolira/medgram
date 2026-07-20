import { NextRequest, NextResponse } from 'next/server'

const AGENCY_ONLY = ['/daily', '/generate']

export function middleware(request: NextRequest) {
  const session = request.cookies.get('medgram-session')
  const { pathname } = request.nextUrl

  if (!session && pathname !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (session && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (session) {
    let role: string | undefined
    try {
      role = JSON.parse(session.value)?.role
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const res = NextResponse.redirect(url)
      res.cookies.delete('medgram-session')
      return res
    }

    if (role === 'doctor' && AGENCY_ONLY.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
