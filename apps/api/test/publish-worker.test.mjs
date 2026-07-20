/**
 * Unit tests para la lógica de fallos de PublishWorker.
 * Verifica que markPublishFailed se marca como definitivo SOLO al agotar los reintentos.
 * Corre sin Redis ni DB. Requiere build previo (importa desde dist/).
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

const { PublishWorker } = await import(
  new URL('../../../apps/api/dist/publishing/publish.worker.js', import.meta.url)
);

class ContentStub {
  constructor() {
    this.calls = [];
  }
  async markPublishFailed(id, reason, final) {
    this.calls.push({ id, reason, final });
  }
}

function makeWorker() {
  const content = new ContentStub();
  const worker = new PublishWorker(content, { publish: async () => ({ igMediaId: 'x' }) });
  // Silenciar logger
  worker['logger'] = { error() {}, warn() {}, log() {} };
  return { worker, content };
}

function jobStub({ attemptsMade, attempts, id = 'job1', contentItemId = 'c1' }) {
  return { id, attemptsMade, opts: { attempts }, data: { contentItemId } };
}

describe('PublishWorker.onJobFailed', () => {
  let worker, content;
  beforeEach(() => {
    ({ worker, content } = makeWorker());
  });

  it('intento intermedio (1/3): marca fallo NO definitivo', async () => {
    await worker['onJobFailed'](jobStub({ attemptsMade: 1, attempts: 3 }), new Error('boom'));
    assert.equal(content.calls.length, 1);
    assert.equal(content.calls[0].final, false);
  });

  it('segundo intento (2/3): sigue NO definitivo', async () => {
    await worker['onJobFailed'](jobStub({ attemptsMade: 2, attempts: 3 }), new Error('boom'));
    assert.equal(content.calls[0].final, false);
  });

  it('último intento (3/3): marca fallo DEFINITIVO', async () => {
    await worker['onJobFailed'](jobStub({ attemptsMade: 3, attempts: 3 }), new Error('boom'));
    assert.equal(content.calls[0].final, true);
  });

  it('propaga la razón del error', async () => {
    await worker['onJobFailed'](jobStub({ attemptsMade: 3, attempts: 3 }), new Error('rate limited'));
    assert.equal(content.calls[0].reason, 'rate limited');
  });

  it('job undefined no revienta y no marca nada', async () => {
    await worker['onJobFailed'](undefined, new Error('boom'));
    assert.equal(content.calls.length, 0);
  });

  it('sin attempts en opts asume 1 y marca definitivo al primer fallo', async () => {
    await worker['onJobFailed'](jobStub({ attemptsMade: 1, attempts: undefined }), new Error('x'));
    assert.equal(content.calls[0].final, true);
  });
});
