import { createHmac, timingSafeEqual } from 'crypto'
import type { Session } from './auth'

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-in-production'

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function signSession(data: Session): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySession(value: string): Session | null {
  const dot = value.lastIndexOf('.')
  if (dot === -1) return null
  const payload = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  const expected = sign(payload)
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof parsed?.role === 'string' && typeof parsed?.email === 'string') {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}
