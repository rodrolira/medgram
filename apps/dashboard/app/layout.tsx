import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { getSession } from '@/lib/auth'
import { SessionProvider } from '@/lib/session'
import { Nav } from './nav'
import { UserMenu } from './user-menu'

export const metadata: Metadata = {
  title: 'medgram — Panel',
  description: 'Panel de marketing médico para Instagram',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {session ? (
          <SessionProvider role={session.role} email={session.email}>
            <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
              <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-6">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-base font-semibold tracking-tight text-slate-900"
                  >
                    medgram
                  </Link>
                  <Nav />
                </div>
                <UserMenu />
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </SessionProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
