import { describe, it, expect, beforeEach } from 'vitest'
import { signSession, verifySession } from '../lib/session-crypto'
import type { Session } from '../lib/auth'

const DOCTOR: Session = { role: 'doctor', email: 'doctor@medgram.local' }
const AGENCY: Session = { role: 'agency', email: 'admin@medgram.local' }

describe('signSession / verifySession', () => {
  it('round-trips a doctor session', () => {
    const token = signSession(DOCTOR)
    expect(verifySession(token)).toEqual(DOCTOR)
  })

  it('round-trips an agency session', () => {
    const token = signSession(AGENCY)
    expect(verifySession(token)).toEqual(AGENCY)
  })

  it('returns null for an empty string', () => {
    expect(verifySession('')).toBeNull()
  })

  it('returns null when signature is missing (no dot)', () => {
    expect(verifySession('justapayload')).toBeNull()
  })

  it('returns null when signature is tampered', () => {
    const token = signSession(DOCTOR)
    const [payload] = token.split('.')
    expect(verifySession(`${payload}.deadbeef`)).toBeNull()
  })

  it('returns null when payload is tampered', () => {
    const token = signSession(DOCTOR)
    const dot = token.lastIndexOf('.')
    const sig = token.slice(dot)
    const fakePayload = Buffer.from(JSON.stringify({ role: 'agency', email: 'hacker@evil.com' })).toString('base64url')
    expect(verifySession(`${fakePayload}${sig}`)).toBeNull()
  })

  it('returns null for malformed base64', () => {
    expect(verifySession('not-valid-base64!!!.abc123')).toBeNull()
  })

  it('produces different tokens for different sessions', () => {
    expect(signSession(DOCTOR)).not.toBe(signSession(AGENCY))
  })

  it('produces stable tokens (deterministic for same session + secret)', () => {
    expect(signSession(DOCTOR)).toBe(signSession(DOCTOR))
  })
})
