import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { RoleProvider } from '@/lib/session';
import { Nav } from './nav';
import { RoleSwitcher } from './role-switcher';

export const metadata: Metadata = {
  title: 'medgram — Panel de aprobación',
  description: 'Cola de revisión y aprobación de contenido médico para Instagram',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <RoleProvider>
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-lg font-semibold tracking-tight">
                  medgram
                </Link>
                <Nav />
              </div>
              <RoleSwitcher />
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
