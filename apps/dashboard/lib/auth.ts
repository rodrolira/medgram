import { cookies } from 'next/headers'

export type Role = 'doctor' | 'agency'

export interface Session {
  role: Role
  email: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('medgram-session')
  if (!cookie) return null
  try {
    const parsed = JSON.parse(cookie.value)
    if (parsed && typeof parsed.role === 'string' && typeof parsed.email === 'string') {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}
