'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-1/2 flex-col justify-between bg-slate-950 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
            M
          </span>
          <span className="text-xl font-semibold tracking-tight text-white">medgram</span>
        </div>
        <div>
          <p className="text-2xl font-medium leading-snug text-slate-100">
            Marketing médico de alta calidad,
            <br />
            generado por IA y aprobado por ti.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            5 publicaciones diarias · Compliance automático · Instagram nativo
          </p>
        </div>
        <p className="text-xs text-slate-600">Especialidad: Reumatología</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white">
                M
              </span>
              <span className="text-xl font-semibold tracking-tight text-slate-900">medgram</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bienvenido</h1>
            <p className="mt-1.5 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          <form action={action} className="space-y-5" aria-label="Iniciar sesión">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="tu@email.com"
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 aria-[invalid]:border-red-300 aria-[invalid]:focus:border-red-400 aria-[invalid]:focus:ring-red-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 aria-[invalid]:border-red-300 aria-[invalid]:focus:border-red-400 aria-[invalid]:focus:ring-red-100 disabled:opacity-50"
              />
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  ⚠
                </span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  Verificando…
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
