/**
 * Unit tests for WhatsAppBookingService.
 * Runs without DB, Redis, or Twilio credentials.
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal NestJS Logger stub: collects log/error calls for assertions */
class LoggerStub {
  constructor() {
    this.logs = [];
    this.errors = [];
  }
  log(msg) { this.logs.push(msg); }
  error(msg) { this.errors.push(msg); }
  warn() {}
  debug() {}
  verbose() {}
}

/**
 * Build a WhatsAppBookingService-like object using the same pure logic
 * extracted from the service, without loading NestJS DI.
 * We import the compiled JS from dist/.
 */
const DIST = new URL(
  '../../../apps/api/dist/whatsapp/whatsapp-booking.service.js',
  import.meta.url,
);

// ── Load compiled service ─────────────────────────────────────────────────────

let WhatsAppBookingService;
try {
  const mod = await import(DIST.href);
  WhatsAppBookingService = mod.WhatsAppBookingService;
} catch (e) {
  console.error('Could not load compiled WhatsAppBookingService:', e.message);
  process.exit(1);
}

// ── Fixture factory ───────────────────────────────────────────────────────────

function makeService() {
  const svc = new WhatsAppBookingService();
  // Replace NestJS logger with stub to inspect output
  svc['logger'] = new LoggerStub();
  return svc;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WhatsAppBookingService — booking intent detection', () => {
  let svc;
  beforeEach(() => { svc = makeService(); });

  const BOOKING_KEYWORDS = [
    'agendar', 'agenda', 'cita', 'hora', 'turno',
    'reservar', 'reserva', 'consulta', 'appointment', 'book', 'schedule',
  ];

  for (const kw of BOOKING_KEYWORDS) {
    it(`detectBookingIntent returns true for "${kw}"`, () => {
      const result = svc['detectBookingIntent'](kw);
      assert.equal(result, true, `expected "${kw}" to trigger booking intent`);
    });
  }

  it('detectBookingIntent is case-insensitive (body is pre-lowercased)', () => {
    // The service lowercases body before calling detectBookingIntent
    assert.equal(svc['detectBookingIntent']('agendar consulta'), true);
  });

  it('detectBookingIntent returns false for unrelated text', () => {
    assert.equal(svc['detectBookingIntent']('hola buen día'), false);
    assert.equal(svc['detectBookingIntent']('gracias doctor'), false);
    assert.equal(svc['detectBookingIntent'](''), false);
  });
});

describe('WhatsAppBookingService — reply building', () => {
  let svc;
  beforeEach(() => {
    svc = makeService();
    delete process.env.DOCTOR_WHATSAPP_NUMBER;
  });
  afterEach(() => {
    delete process.env.DOCTOR_WHATSAPP_NUMBER;
  });

  it('buildBookingReply includes the patient name', () => {
    const reply = svc['buildBookingReply']('María');
    assert.ok(reply.includes('María'), 'reply should include patient name');
  });

  it('buildBookingReply includes reumatología keyword', () => {
    const reply = svc['buildBookingReply']('Pedro');
    assert.ok(
      reply.toLowerCase().includes('reumatología') || reply.toLowerCase().includes('reumatologia'),
      'reply should mention reumatología',
    );
  });

  it('buildBookingReply includes DOCTOR_WHATSAPP_NUMBER when set', () => {
    process.env.DOCTOR_WHATSAPP_NUMBER = '+56912345678';
    const reply = svc['buildBookingReply']('Ana');
    assert.ok(reply.includes('+56912345678'), 'reply should include doctor phone');
  });

  it('buildBookingReply uses fallback phone when env var not set', () => {
    const reply = svc['buildBookingReply']('Luis');
    assert.ok(reply.includes('(número del consultorio)') || reply.includes('+'),
      'reply should include a phone placeholder or number');
  });

  it('buildDefaultReply includes patient name and instructions to write "agendar cita"', () => {
    const reply = svc['buildDefaultReply']('Carlos');
    assert.ok(reply.includes('Carlos'), 'reply should include name');
    assert.ok(reply.includes('agendar'), 'reply should mention agendar');
  });
});

describe('WhatsAppBookingService — handleIncomingMessage (no Twilio creds)', () => {
  let svc;
  beforeEach(() => {
    svc = makeService();
    // Ensure Twilio is NOT configured → falls back to logger
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
  });

  it('returns booking reply when body contains booking keyword', async () => {
    const reply = await svc.handleIncomingMessage({
      From: 'whatsapp:+56911111111',
      Body: 'Quiero agendar una cita',
      ProfileName: 'Sofía',
    });
    assert.ok(reply.toLowerCase().includes('sofía') || reply.includes('Sof'),
      'reply should be personalized');
    assert.ok(reply.toLowerCase().includes('agend') || reply.toLowerCase().includes('consulta'),
      'reply should acknowledge booking intent');
  });

  it('returns default reply when body has no booking keyword', async () => {
    const reply = await svc.handleIncomingMessage({
      From: 'whatsapp:+56922222222',
      Body: 'Hola, ¿cómo están?',
      ProfileName: 'Juan',
    });
    assert.ok(reply.includes('Juan'), 'reply should include name');
  });

  it('logs the message (simulated mode)', async () => {
    const logger = svc['logger'];
    await svc.handleIncomingMessage({
      From: 'whatsapp:+56933333333',
      Body: 'agendar',
      ProfileName: 'Test',
    });
    const logOutput = logger.logs.join(' ');
    assert.ok(logOutput.includes('whatsapp'), 'should log whatsapp activity');
  });

  it('handles missing From and Body gracefully', async () => {
    const reply = await svc.handleIncomingMessage({});
    assert.ok(typeof reply === 'string', 'should return a string even with empty payload');
  });

  it('handles missing ProfileName (uses "Paciente" default)', async () => {
    const reply = await svc.handleIncomingMessage({
      From: 'whatsapp:+56944444444',
      Body: 'cita',
    });
    assert.ok(reply.includes('Paciente'), 'should use "Paciente" as default name');
  });
});

describe('WhatsAppBookingService — sendBookingConfirmation (no Twilio creds)', () => {
  let svc;
  beforeEach(() => {
    svc = makeService();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
  });

  it('resolves without throwing when Twilio is not configured', async () => {
    await assert.doesNotReject(
      () => svc.sendBookingConfirmation({
        patientPhone: '+56955555555',
        name: 'Rosa',
        scheduledFor: '2025-02-15T14:00:00.000Z',
      }),
    );
  });

  it('logs the confirmation message (simulated mode)', async () => {
    const logger = svc['logger'];
    await svc.sendBookingConfirmation({
      patientPhone: '+56966666666',
      name: 'Tomás',
    });
    const logOutput = logger.logs.join(' ');
    assert.ok(
      logOutput.includes('whatsapp simulado') || logOutput.includes('whatsapp'),
      'should log that message was simulated',
    );
  });
});
