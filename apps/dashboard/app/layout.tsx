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
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Link href="/" className="text-lg font-semibold tracking-tight">
                    medgram
                  </Link>
                  <Nav />
                </div>
                <UserMenu />
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          </SessionProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
