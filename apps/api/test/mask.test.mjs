/**
 * Unit tests para maskPhone (enmascarado de PHI en logs).
 * Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { maskPhone } = await import(new URL('../../../apps/api/dist/common/mask.js', import.meta.url));

describe('maskPhone', () => {
  it('deja visibles solo los últimos 4 dígitos', () => {
    assert.equal(maskPhone('+56911112222'), '***2222');
  });

  it('ignora el prefijo whatsapp: y los no-dígitos', () => {
    assert.equal(maskPhone('whatsapp:+56 9 1111 3333'), '***3333');
  });

  it('devuelve placeholder para null/undefined/vacío', () => {
    assert.equal(maskPhone(null), '(sin teléfono)');
    assert.equal(maskPhone(undefined), '(sin teléfono)');
    assert.equal(maskPhone(''), '(sin teléfono)');
  });

  it('enmascara del todo si hay menos de 4 dígitos', () => {
    assert.equal(maskPhone('12'), '***');
  });

  it('no filtra los dígitos iniciales del número', () => {
    const masked = maskPhone('+56911112222');
    assert.ok(!masked.includes('5691111'), 'no debe exponer el prefijo');
  });
});
