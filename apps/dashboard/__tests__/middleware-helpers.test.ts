/**
 * Tests for the two pure helper functions exported from middleware.ts:
 *   - hexToBytes  : converts a lowercase hex string to a Uint8Array
 *   - base64urlDecode : decodes a base64url string to a Uint8Array
 *
 * next/server is mocked because the middleware module imports NextRequest /
 * NextResponse, which are Edge-runtime globals unavailable in Node test env.
 */

import { describe, it, expect, vi } from 'vitest'

// --- Mock next/server before importing the module under test -----------------
vi.mock('next/server', () => {
  class FakeNextResponse {
    static redirect() {
      return new FakeNextResponse()
    }
    static next() {
      return new FakeNextResponse()
    }
    cookies = { delete: vi.fn() }
  }

  class FakeNextRequest {
    cookies = { get: vi.fn() }
    nextUrl = { clone: vi.fn(), pathname: '/' }
  }

  return {
    NextResponse: FakeNextResponse,
    NextRequest: FakeNextRequest,
  }
})

import { hexToBytes, base64urlDecode } from '../middleware'

// ---------------------------------------------------------------------------
// hexToBytes
// ---------------------------------------------------------------------------

describe('hexToBytes', () => {
  it('converts a simple known hex string to the correct bytes', () => {
    // "deadbeef" → [0xde, 0xad, 0xbe, 0xef]
    const result = hexToBytes('deadbeef')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result)).toEqual([0xde, 0xad, 0xbe, 0xef])
  })

  it('converts an all-zeros hex string', () => {
    const result = hexToBytes('00000000')
    expect(Array.from(result)).toEqual([0, 0, 0, 0])
  })

  it('converts an all-ff hex string', () => {
    const result = hexToBytes('ffffffff')
    expect(Array.from(result)).toEqual([0xff, 0xff, 0xff, 0xff])
  })

  it('converts a 32-byte (64 hex char) string correctly — typical SHA-256 output', () => {
    const hex = 'a'.repeat(64) // 32 bytes, all 0xaa
    const result = hexToBytes(hex)
    expect(result.length).toBe(32)
    expect(Array.from(result)).toEqual(Array(32).fill(0xaa))
  })

  it('returns an empty Uint8Array for an empty string', () => {
    const result = hexToBytes('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('returns a Uint8Array (not a plain Array)', () => {
    expect(hexToBytes('ff')).toBeInstanceOf(Uint8Array)
  })

  it('output length is always hex.length / 2', () => {
    expect(hexToBytes('aabb').length).toBe(2)
    expect(hexToBytes('aabbcc').length).toBe(3)
    expect(hexToBytes('aabbccdd').length).toBe(4)
  })

  it('handles mixed uppercase/lowercase hex digits via parseInt', () => {
    // parseInt('AB', 16) === 171 === 0xab
    const upper = hexToBytes('AB')
    const lower = hexToBytes('ab')
    expect(Array.from(upper)).toEqual(Array.from(lower))
  })

  it('handles single byte "00"', () => {
    expect(Array.from(hexToBytes('00'))).toEqual([0])
  })

  it('handles single byte "ff"', () => {
    expect(Array.from(hexToBytes('ff'))).toEqual([255])
  })

  it('converts the zero byte surrounded by other bytes', () => {
    expect(Array.from(hexToBytes('ff00ff'))).toEqual([0xff, 0x00, 0xff])
  })

  it('handles a real SHA-256 hex digest without throwing', () => {
    // SHA-256 of empty string, well-known value
    const sha256Empty =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const result = hexToBytes(sha256Empty)
    expect(result.length).toBe(32)
    expect(result[0]).toBe(0xe3)
    expect(result[31]).toBe(0x55)
  })
})

// ---------------------------------------------------------------------------
// base64urlDecode
// ---------------------------------------------------------------------------

describe('base64urlDecode', () => {
  it('decodes a basic base64url string to the correct bytes', () => {
    // base64url of "hello" → "aGVsbG8"
    const result = base64urlDecode('aGVsbG8')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(result)).toBe('hello')
  })

  it('decodes an empty base64url string to an empty Uint8Array', () => {
    const result = base64urlDecode('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('handles the URL-safe - character (replaces + in standard base64)', () => {
    // ">" encodes as "Pg==" in standard base64 which contains no - or _,
    // but we can use a payload that specifically requires the substitution.
    // base64 of [0xfb] is "+w==" and base64url of [0xfb] is "-w"
    const result = base64urlDecode('-w')
    expect(result[0]).toBe(0xfb)
  })

  it('handles the URL-safe _ character (replaces / in standard base64)', () => {
    // base64 of [0xff] is "/w==" and base64url of [0xff] is "_w"
    const result = base64urlDecode('_w')
    expect(result[0]).toBe(0xff)
  })

  it('handles input containing both - and _ substitutions', () => {
    // [0xfb, 0xff] → base64 "+/8=" → base64url "-_8"
    const result = base64urlDecode('-_8')
    expect(result[0]).toBe(0xfb)
    expect(result[1]).toBe(0xff)
  })

  it('decodes a base64url-encoded JSON object (matches the middleware usage pattern)', () => {
    const obj = { role: 'doctor', email: 'doc@medgram.local' }
    const b64url = Buffer.from(JSON.stringify(obj)).toString('base64url')
    const decoded = base64urlDecode(b64url)
    const parsed = JSON.parse(new TextDecoder().decode(decoded))
    expect(parsed).toEqual(obj)
  })

  it('returns a Uint8Array, not a plain Array', () => {
    expect(base64urlDecode('aGVsbG8')).toBeInstanceOf(Uint8Array)
  })

  it('decodes a single-byte payload', () => {
    // base64url of [0x00] is "AA"
    const result = base64urlDecode('AA')
    expect(result.length).toBe(1)
    expect(result[0]).toBe(0)
  })

  it('decodes a two-byte payload', () => {
    // base64url of [0x00, 0x01] is "AAE"
    const result = base64urlDecode('AAE')
    expect(result.length).toBe(2)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(1)
  })

  it('produces output whose length matches the decoded byte count, not the base64 char count', () => {
    // "hello" is 5 bytes, base64url "aGVsbG8" is 7 chars
    const result = base64urlDecode('aGVsbG8')
    expect(result.length).toBe(5)
  })

  it('decodes padding-free base64url strings (no trailing = signs)', () => {
    // "Man" encodes as "TWFu" — no padding needed, but standard atob accepts it fine
    const result = base64urlDecode('TWFu')
    expect(new TextDecoder().decode(result)).toBe('Man')
  })

  it('is consistent with Buffer.from base64url decoding for arbitrary binary data', () => {
    const original = Uint8Array.from([0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff])
    const b64url = Buffer.from(original).toString('base64url')
    const decoded = base64urlDecode(b64url)
    expect(Array.from(decoded)).toEqual(Array.from(original))
  })
})
