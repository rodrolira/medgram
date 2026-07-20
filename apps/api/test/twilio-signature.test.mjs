/**
 * Unit tests para TwilioSignatureGuard.
 * Verifica degradación graceful (sin token), rechazo sin firma, rechazo con firma inválida
 * y aceptación con firma válida (calculada con el mismo algoritmo del SDK).
 * Corre sin DB ni Twilio real. Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { createHmac } from 'node:crypto';

const { TwilioSignatureGuard } = await import(
  new URL('../../../apps/api/dist/whatsapp/twilio-signature.guard.js', import.meta.url)
);

/** Construye un ExecutionContext mínimo con el request dado. */
function ctx(req) {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  };
}

/** Request Express-like: header() case-insensitive, get('host'), body, protocol, originalUrl. */
function makeReq({ headers = {}, body = {}, protocol = 'https', host = 'example.com', url = '/whatsapp/webhook' } = {}) {
  const lower = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  if (host) lower['host'] = lower['host'] ?? host;
  return {
    header: (name) => lower[name.toLowerCase()],
    get: (name) => lower[name.toLowerCase()],
    body,
    protocol,
    originalUrl: url,
  };
}

/**
 * Firma como Twilio: HMAC-SHA1(authToken) sobre url + params ordenados por clave (key+value),
 * en base64.
 */
function twilioSign(authToken, url, params) {
  let data = url;
  for (const key of Object.keys(params).sort()) data += key + params[key];
  return createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

const TOKEN = 'test_auth_token_123';
const URL_ = 'https://example.com/whatsapp/webhook';

describe('TwilioSignatureGuard', () => {
  let guard;
  beforeEach(() => {
    guard = new TwilioSignatureGuard();
    delete process.env.WEBHOOK_PUBLIC_URL;
  });
  afterEach(() => {
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.WEBHOOK_PUBLIC_URL;
  });

  it('deja pasar (con warning) si no hay TWILIO_AUTH_TOKEN (modo simulación)', () => {
    delete process.env.TWILIO_AUTH_TOKEN;
    assert.equal(guard.canActivate(ctx(makeReq())), true);
  });

  it('rechaza si falta X-Twilio-Signature', () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN;
    assert.throws(() => guard.canActivate(ctx(makeReq())), /X-Twilio-Signature/);
  });

  it('rechaza firma inválida', () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN;
    process.env.WEBHOOK_PUBLIC_URL = URL_;
    const req = makeReq({ headers: { 'x-twilio-signature': 'firma-falsa' }, body: { From: 'x' } });
    assert.throws(() => guard.canActivate(ctx(req)), /inválida/);
  });

  it('acepta firma válida calculada con el algoritmo de Twilio', () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN;
    process.env.WEBHOOK_PUBLIC_URL = URL_;
    const body = { From: 'whatsapp:+56911111111', Body: 'agendar', ProfileName: 'Ana' };
    const sig = twilioSign(TOKEN, URL_, body);
    const req = makeReq({ headers: { 'x-twilio-signature': sig }, body });
    assert.equal(guard.canActivate(ctx(req)), true);
  });

  it('firma válida para una URL distinta no sirve (previene replay a otra ruta)', () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN;
    process.env.WEBHOOK_PUBLIC_URL = URL_;
    const body = { From: 'x' };
    const sig = twilioSign(TOKEN, 'https://example.com/otra-ruta', body);
    const req = makeReq({ headers: { 'x-twilio-signature': sig }, body });
    assert.throws(() => guard.canActivate(ctx(req)), /inválida/);
  });
});
