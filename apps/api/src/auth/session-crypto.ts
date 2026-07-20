import { createHmac, timingSafeEqual } from 'crypto';

// Debe coincidir con el esquema de firma del dashboard (apps/dashboard/lib/session-crypto.ts):
// token = base64url(JSON(payload)) + '.' + hmacSha256Hex(base64urlPayload)
// Ambos procesos comparten el mismo SESSION_SECRET.

export type Role = 'doctor' | 'agency';

export interface Session {
  role: Role;
  email: string;
}

function secret(): string {
  return process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-in-production';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function verifySession(value: string): Session | null {
  const dot = value.lastIndexOf('.');
  if (dot === -1) return null;

  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(payload);

  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if ((parsed?.role === 'doctor' || parsed?.role === 'agency') && typeof parsed?.email === 'string') {
      return { role: parsed.role, email: parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}
