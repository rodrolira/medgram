'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/session'

const DOCTOR_LINKS = [
  { href: '/', label: 'Cola' },
  { href: '/calendar', label: 'Calendario' },
  { href: '/analytics', label: 'Analytics' },
]

const AGENCY_LINKS = [
  { href: '/', label: 'Cola' },
  { href: '/daily', label: 'Generación diaria' },
  { href: '/calendar', label: 'Calendario' },
  { href: '/analytics', label: 'Analytics' },
]

export function Nav() {
  const path = usePathname()
  const { role } = useSession()
  const links = role === 'agency' ? AGENCY_LINKS : DOCTOR_LINKS

  return (
    <nav className="flex items-center gap-1">
      {links.map((l) => {
        const active =
          l.href === '/'
            ? path === '/' || path.startsWith('/content') || path.startsWith('/generate')
            : path.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-2.5 py-1 text-sm transition ${
              active ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
