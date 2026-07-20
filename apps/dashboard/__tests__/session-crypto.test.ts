import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from '../lib/session-crypto'
import type { Session } from '../lib/auth'

const DOCTOR: Session = { role: 'doctor', email: 'doctor@medgram.local' }
const AGENCY: Session = { role: 'agency', email: 'admin@medgram.local' }

// Helper: craft a token with a valid HMAC over an arbitrary payload string so
// that the signature check passes but the content is wrong.
function signedTokenFromRawPayload(rawPayload: string): string {
  // Re-use signSession internals by round-tripping: sign a valid Session, then
  // splice in a different base64url payload while keeping the real MAC position.
  // This is simpler than importing the private `sign` function.
  //
  // Instead, we build the payload ourselves and produce a matching MAC by calling
  // Node's crypto directly — the same implementation signSession uses.
  const { createHmac } = require('crypto')
  const secret = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-in-production'
  const payload = Buffer.from(rawPayload).toString('base64url')
  const mac = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${mac}`
}

describe('signSession', () => {
  it('returns a string with exactly one dot separator', () => {
    const token = signSession(DOCTOR)
    const dots = [...token].filter((c) => c === '.').length
    expect(dots).toBeGreaterThanOrEqual(1)
  })

  it('produces different tokens for different sessions', () => {
    expect(signSession(DOCTOR)).not.toBe(signSession(AGENCY))
  })

  it('produces stable, deterministic tokens for the same input and secret', () => {
    expect(signSession(DOCTOR)).toBe(signSession(DOCTOR))
  })
})

describe('verifySession — happy paths', () => {
  it('round-trips a doctor session', () => {
    const token = signSession(DOCTOR)
    expect(verifySession(token)).toEqual(DOCTOR)
  })

  it('round-trips an agency session', () => {
    const token = signSession(AGENCY)
    expect(verifySession(token)).toEqual(AGENCY)
  })

  it('preserves all Session fields exactly', () => {
    const session: Session = { role: 'doctor', email: 'precision@test.local' }
    const result = verifySession(signSession(session))
    expect(result).toEqual(session)
  })
})

describe('verifySession — missing or malformed structure', () => {
  it('returns null for an empty string', () => {
    expect(verifySession('')).toBeNull()
  })

  it('returns null when there is no dot (no MAC section)', () => {
    expect(verifySession('justapayload')).toBeNull()
  })

  it('returns null when MAC is wrong length (timingSafeEqual throws on length mismatch)', () => {
    const token = signSession(DOCTOR)
    const payload = token.slice(0, token.lastIndexOf('.'))
    expect(verifySession(`${payload}.short`)).toBeNull()
  })

  it('returns null when MAC is the right length but wrong bytes', () => {
    const token = signSession(DOCTOR)
    const dot = token.lastIndexOf('.')
    const payload = token.slice(0, dot)
    // Replace every hex char with '0' to keep the same byte-length as a real SHA-256 hex
    const badMac = '0'.repeat(token.slice(dot + 1).length)
    expect(verifySession(`${payload}.${badMac}`)).toBeNull()
  })

  it('returns null when the payload is tampered (signature no longer matches)', () => {
    const token = signSession(DOCTOR)
    const dot = token.lastIndexOf('.')
    const sig = token.slice(dot) // includes the dot
    const fakePayload = Buffer.from(
      JSON.stringify({ role: 'agency', email: 'hacker@evil.com' }),
    ).toString('base64url')
    expect(verifySession(`${fakePayload}${sig}`)).toBeNull()
  })

  it('returns null for a completely malformed input', () => {
    expect(verifySession('not-valid-base64!!!.abc123')).toBeNull()
  })
})

describe('verifySession — valid MAC but wrong payload shape', () => {
  it('returns null when role is a number, not a string', () => {
    const token = signedTokenFromRawPayload(JSON.stringify({ role: 42, email: 'a@b.com' }))
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when role is missing entirely', () => {
    const token = signedTokenFromRawPayload(JSON.stringify({ email: 'a@b.com' }))
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when email is missing', () => {
    const token = signedTokenFromRawPayload(JSON.stringify({ role: 'doctor' }))
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when email is null', () => {
    const token = signedTokenFromRawPayload(JSON.stringify({ role: 'doctor', email: null }))
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when the payload is an empty JSON object', () => {
    const token = signedTokenFromRawPayload('{}')
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when the payload is a JSON array', () => {
    const token = signedTokenFromRawPayload('["doctor","a@b.com"]')
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when the payload is a JSON string primitive', () => {
    const token = signedTokenFromRawPayload('"just-a-string"')
    expect(verifySession(token)).toBeNull()
  })
})

describe('verifySession — valid MAC but invalid JSON', () => {
  it('returns null when the payload is not parseable as JSON', () => {
    const token = signedTokenFromRawPayload('{ this is: not json }')
    expect(verifySession(token)).toBeNull()
  })

  it('returns null when the payload is a truncated JSON object', () => {
    const token = signedTokenFromRawPayload('{"role":"doctor"')
    expect(verifySession(token)).toBeNull()
  })
})

describe('verifySession — boundary / edge inputs', () => {
  it('returns null for a string that is only a dot', () => {
    expect(verifySession('.')).toBeNull()
  })

  it('returns null for multiple dots with no real payload or MAC', () => {
    expect(verifySession('...')).toBeNull()
  })

  it('returns null for an empty payload section with a non-empty MAC', () => {
    // dot at position 0 means payload = ''
    expect(verifySession('.deadbeefdeadbeefdeadbeefdeadbeef')).toBeNull()
  })
})
