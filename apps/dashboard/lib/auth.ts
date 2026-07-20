import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session-crypto'

export type Role = 'doctor' | 'agency'

export interface Session {
  role: Role
  email: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('medgram-session')
  if (!cookie) return null
  return verifySession(cookie.value)
}
