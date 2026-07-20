'use server'

import { timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/auth'
import { signSession } from '@/lib/session-crypto'

interface Credential {
  email: string
  password: string
  role: Role
}

const CREDENTIALS: Credential[] = [
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

function timingSafeCompare(a: string, b: string): boolean {
  const key = Buffer.alloc(32)
  const ha = createHmac('sha256', key).update(a).digest()
  const hb = createHmac('sha256', key).update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function login(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const match = CREDENTIALS.find(
    (c) => timingSafeCompare(c.email, email) && timingSafeCompare(c.password, password),
  )
  if (!match) {
    return 'Credenciales incorrectas. Verifica tu email y contraseña.'
  }

  const cookieStore = await cookies()
  const signed = signSession({ role: match.role, email: match.email })
  cookieStore.set('medgram-session', signed, {
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
