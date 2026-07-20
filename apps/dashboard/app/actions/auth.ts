'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/auth'

interface Credential {
  email: string
  password: string
  role: Role
}

function getCredentials(): Credential[] {
  return [
    {
      email: process.env.DOCTOR_EMAIL ?? 'doctor@medgram.local',
      password: process.env.DOCTOR_PASSWORD ?? 'Doctor2024',
      role: 'doctor',
    },
    {
      email: process.env.AGENCY_EMAIL ?? 'admin@medgram.local',
      password: process.env.AGENCY_PASSWORD ?? 'Agency2024',
      role: 'agency',
    },
  ]
}

export async function login(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const match = getCredentials().find((c) => c.email === email && c.password === password)
  if (!match) {
    return 'Credenciales incorrectas. Verifica tu email y contraseña.'
  }

  const cookieStore = await cookies()
  cookieStore.set('medgram-session', JSON.stringify({ role: match.role, email: match.email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('medgram-session')
  redirect('/login')
}
