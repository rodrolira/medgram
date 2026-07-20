/**
 * Unit tests para el verificador de sesión de la API.
 * Confirma compatibilidad con el esquema de firma del dashboard
 * (apps/dashboard/lib/session-crypto.ts) y el rechazo de tokens manipulados.
 * Corre sin DB ni Redis. Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHmac } from 'node:crypto';

const { verifySession } = await import(
  new URL('../../../apps/api/dist/auth/session-crypto.js', import.meta.url)
);

const SECRET = 'dev-insecure-secret-change-in-production'; // default cuando SESSION_SECRET no está seteado

/** Replica exacta de signSession del dashboard. */
function signSession(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

describe('verifySession (API)', () => {
  it('acepta un token firmado válido y devuelve role + email', () => {
    const token = signSession({ role: 'agency', email: 'admin@medgram.local' });
    assert.deepEqual(verifySession(token), { role: 'agency', email: 'admin@medgram.local' });
  });

  it('acepta rol doctor', () => {
    const token = signSession({ role: 'doctor', email: 'doctor@medgram.local' });
    assert.equal(verifySession(token)?.role, 'doctor');
  });

  it('rechaza payload manipulado (firma no coincide)', () => {
    const token = signSession({ role: 'doctor', email: 'doctor@medgram.local' });
    const forgedPayload = Buffer.from(
      JSON.stringify({ role: 'agency', email: 'attacker@evil.com' }),
    ).toString('base64url');
    const tampered = `${forgedPayload}.${token.slice(token.lastIndexOf('.') + 1)}`;
    assert.equal(verifySession(tampered), null);
  });

  it('rechaza firma manipulada', () => {
    const token = signSession({ role: 'agency', email: 'admin@medgram.local' });
    const tampered = `${token.slice(0, token.lastIndexOf('.'))}.deadbeef`;
    assert.equal(verifySession(tampered), null);
  });

  it('rechaza token sin separador de firma', () => {
    assert.equal(verifySession('sinpunto'), null);
  });

  it('rechaza JSON firmado pero con rol inválido', () => {
    const token = signSession({ role: 'superadmin', email: 'x@y.com' });
    assert.equal(verifySession(token), null);
  });

  it('rechaza JSON firmado sin email', () => {
    const token = signSession({ role: 'agency' });
    assert.equal(verifySession(token), null);
  });

  it('rechaza cadena vacía', () => {
    assert.equal(verifySession(''), null);
  });
});
