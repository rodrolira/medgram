/**
 * Unit tests para SessionGuard: parseo de cookie, verificación de firma y RBAC.
 * Corre sin DB ni NestJS DI real (Reflector y ExecutionContext se stubean).
 * Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHmac } from 'node:crypto';

const { SessionGuard } = await import(
  new URL('../../../apps/api/dist/auth/session.guard.js', import.meta.url)
);

const SECRET = 'dev-insecure-secret-change-in-production';

function sign(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Reflector stub: devuelve isPublic y roles configurados por clave de metadata. */
function reflector({ isPublic = undefined, roles = undefined } = {}) {
  return {
    getAllAndOverride: (key) => {
      if (key === 'isPublic') return isPublic;
      if (key === 'roles') return roles;
      return undefined;
    },
  };
}

/** ExecutionContext stub con el request dado. */
function ctx(req) {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
}

function reqWithCookie(token) {
  return { headers: token ? { cookie: `medgram-session=${token}` } : {} };
}

describe('SessionGuard', () => {
  it('deja pasar rutas públicas sin cookie', () => {
    const guard = new SessionGuard(reflector({ isPublic: true }));
    assert.equal(guard.canActivate(ctx(reqWithCookie(null))), true);
  });

  it('rechaza (401) si no hay cookie', () => {
    const guard = new SessionGuard(reflector({}));
    assert.throws(() => guard.canActivate(ctx(reqWithCookie(null))), /Sesión inválida o ausente/);
  });

  it('rechaza (401) si la cookie tiene firma inválida', () => {
    const guard = new SessionGuard(reflector({}));
    const forged = 'eyJyb2xlIjoiYWdlbmN5In0.firmafalsa';
    assert.throws(() => guard.canActivate(ctx(reqWithCookie(forged))), /Sesión inválida/);
  });

  it('acepta sesión válida sin @Roles y setea x-user-email verificado', () => {
    const guard = new SessionGuard(reflector({}));
    const req = reqWithCookie(sign({ role: 'agency', email: 'admin@medgram.local' }));
    assert.equal(guard.canActivate(ctx(req)), true);
    assert.equal(req.headers['x-user-email'], 'admin@medgram.local');
  });

  it('adjunta la sesión verificada al request', () => {
    const guard = new SessionGuard(reflector({}));
    const req = reqWithCookie(sign({ role: 'doctor', email: 'doctor@medgram.local' }));
    guard.canActivate(ctx(req));
    assert.deepEqual(req.session, { role: 'doctor', email: 'doctor@medgram.local' });
  });

  it('rechaza (403) si el rol no está en @Roles', () => {
    const guard = new SessionGuard(reflector({ roles: ['agency'] }));
    const req = reqWithCookie(sign({ role: 'doctor', email: 'doctor@medgram.local' }));
    assert.throws(() => guard.canActivate(ctx(req)), /Rol sin permiso/);
  });

  it('acepta (200) si el rol coincide con @Roles', () => {
    const guard = new SessionGuard(reflector({ roles: ['agency'] }));
    const req = reqWithCookie(sign({ role: 'agency', email: 'admin@medgram.local' }));
    assert.equal(guard.canActivate(ctx(req)), true);
  });

  it('un doctor NO puede acceder a un endpoint @Roles(agency) aunque tenga sesión válida', () => {
    const guard = new SessionGuard(reflector({ roles: ['agency'] }));
    const req = reqWithCookie(sign({ role: 'doctor', email: 'doctor@medgram.local' }));
    assert.throws(() => guard.canActivate(ctx(req)), /Rol sin permiso/);
  });

  it('sobreescribe un x-user-email falsificado por el cliente con el verificado', () => {
    const guard = new SessionGuard(reflector({}));
    const token = sign({ role: 'doctor', email: 'doctor@medgram.local' });
    const req = { headers: { cookie: `medgram-session=${token}`, 'x-user-email': 'attacker@evil.com' } };
    guard.canActivate(ctx(req));
    assert.equal(req.headers['x-user-email'], 'doctor@medgram.local');
  });
});
