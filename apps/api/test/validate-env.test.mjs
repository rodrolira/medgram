/**
 * Unit tests para validateEnv (fail-fast de configuración en producción).
 * Corre sin DB. Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { validateEnv } = await import(
  new URL('../../../apps/api/dist/config/validate-env.js', import.meta.url)
);

const STRONG = 'x'.repeat(40);

describe('validateEnv', () => {
  it('no valida fuera de producción (development)', () => {
    assert.doesNotThrow(() => validateEnv({ NODE_ENV: 'development' }));
  });

  it('no valida cuando NODE_ENV no está seteado', () => {
    assert.doesNotThrow(() => validateEnv({}));
  });

  it('en producción lanza si falta SESSION_SECRET', () => {
    assert.throws(() => validateEnv({ NODE_ENV: 'production' }), /SESSION_SECRET/);
  });

  it('en producción lanza si SESSION_SECRET es el default inseguro', () => {
    assert.throws(
      () =>
        validateEnv({
          NODE_ENV: 'production',
          SESSION_SECRET: 'dev-insecure-secret-change-in-production',
        }),
      /inseguro/,
    );
  });

  it('en producción lanza si SESSION_SECRET es demasiado corto', () => {
    assert.throws(
      () => validateEnv({ NODE_ENV: 'production', SESSION_SECRET: 'corto' }),
      /corto/,
    );
  });

  it('en producción pasa con un SESSION_SECRET fuerte', () => {
    assert.doesNotThrow(() => validateEnv({ NODE_ENV: 'production', SESSION_SECRET: STRONG }));
  });
});
