'use client'

import { logout } from '@/app/actions/auth'
import { ROLE_META, useSession } from '@/lib/session'

export function UserMenu() {
  const { role } = useSession()
  const meta = ROLE_META[role]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {meta.initials}
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:block">{meta.label}</span>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="text-xs text-slate-400 transition hover:text-slate-700"
        >
          Salir
        </button>
      </form>
    </div>
  )
}
