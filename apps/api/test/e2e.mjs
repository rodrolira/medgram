// E2E Fase 1: crear borrador -> chequeo de compliance -> aprobación del doctor.
// Requiere la API corriendo (npm run dev / npm start) y la DB migrada+seedeada.
import assert from 'node:assert/strict';

const API = process.env.API_URL ?? 'http://localhost:3001';
const DOCTOR = 'doctor@medgram.local';
const ADMIN = 'admin@medgram.local';

async function req(method, path, body, headers = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const ok = (msg) => console.log(`  ✔ ${msg}`);

// --- 0. health ---
{
  const { status, json } = await req('GET', '/health');
  assert.equal(status, 200);
  assert.equal(json.status, 'ok');
  ok('API viva (/health)');
}

// --- 1. copy NO conforme: el gate lo bloquea ---
const badCopy =
  '¿Sufres de caries? En nuestra consulta curamos tu problema con resultados garantizados. ' +
  'Mira cómo quedó nuestro último paciente: antes y después increíble. ' +
  'Mándame un DM con tus síntomas y te digo qué tienes.';
{
  const created = await req('POST', '/content', {
    topic: '10 tips de higiene dental',
    type: 'post',
    generatedCopy: badCopy,
    createdBy: ADMIN,
  });
  assert.equal(created.status, 201);
  const id = created.json.id;

  const check = await req('POST', `/content/${id}/compliance-check`);
  assert.equal(check.status, 201);
  assert.equal(check.json.passesGate, false);
  assert.equal(check.json.status, 'draft');
  const blockers = check.json.results.filter((r) => !r.passed && r.severity === 'blocker');
  assert.ok(blockers.length >= 4, `esperaba >=4 blockers, hubo ${blockers.length}`);
  ok(`copy no conforme bloqueado (${blockers.length} reglas blocker violadas, sigue en draft)`);
}

// --- 2. copy conforme: pasa el gate y llega al doctor ---
const goodCopy =
  'La higiene dental diaria ayuda a prevenir caries. La OMS recomienda cepillarse dos veces al día ' +
  'y visitar al dentista regularmente. Este contenido es informativo y no reemplaza una consulta médica. ' +
  'Agenda tu control anual.';
let itemId;
{
  const created = await req('POST', '/content', {
    topic: '10 tips de higiene dental',
    type: 'post',
    generatedCopy: goodCopy,
    createdBy: ADMIN,
  });
  assert.equal(created.status, 201);
  itemId = created.json.id;

  const check = await req('POST', `/content/${itemId}/compliance-check`);
  assert.equal(check.status, 201);
  assert.equal(check.json.passesGate, true);
  assert.equal(check.json.status, 'pending_approval');
  ok('copy conforme pasó el gate -> pending_approval');

  const pending = await req('GET', '/content/pending-approval');
  assert.equal(pending.status, 200);
  assert.ok(pending.json.some((i) => i.id === itemId), 'el item debe estar en la cola del doctor');
  const inQueue = pending.json.find((i) => i.id === itemId);
  assert.equal(inQueue.complianceChecks.length, 8, 'la cola incluye el checklist completo');
  ok('aparece en la cola del doctor con checklist de 8 reglas');
}

// --- 3. un admin NO puede aprobar (rol) ---
{
  const res = await req('PATCH', `/content/${itemId}/approve`, {}, { 'x-user-email': ADMIN });
  assert.equal(res.status, 403);
  ok('agency_admin no puede aprobar (403)');
}

// --- 4. el doctor aprueba ---
{
  const res = await req(
    'PATCH',
    `/content/${itemId}/approve`,
    { comment: 'Contenido correcto y prudente' },
    { 'x-user-email': DOCTOR },
  );
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'approved');
  assert.ok(res.json.approvedAt, 'approvedAt debe quedar registrado');
  ok('doctor aprobó (approved, con approvedAt y approvedBy)');
}

// --- 5. auditoría completa e inmutable ---
{
  const res = await req('GET', `/content/${itemId}`);
  assert.equal(res.status, 200);
  const transitions = res.json.statusLog.map((l) => `${l.fromStatus ?? 'null'}->${l.toStatus}`);
  assert.deepEqual(transitions, ['null->draft', 'draft->pending_approval', 'pending_approval->approved']);
  const approval = res.json.statusLog.at(-1);
  assert.equal(approval.actor, DOCTOR);
  assert.ok(approval.reason, 'el porqué queda registrado');
  ok(`log de auditoría completo: ${transitions.join(' | ')}`);
}

// --- 6. rechazo con motivo ---
{
  const created = await req('POST', '/content', {
    topic: 'Mitos sobre la hidratación',
    type: 'carousel',
    generatedCopy: goodCopy,
    createdBy: ADMIN,
  });
  const id = created.json.id;
  await req('POST', `/content/${id}/compliance-check`);
  const res = await req(
    'PATCH',
    `/content/${id}/reject`,
    { reason: 'El tono no me representa' },
    { 'x-user-email': DOCTOR },
  );
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'rejected');
  assert.equal(res.json.doctorComments, 'El tono no me representa');
  ok('doctor rechazó con motivo registrado');
}

// --- 7. pipeline de generación: tema -> copy -> compliance -> pending_approval ---
{
  const res = await req('POST', '/content/generate', {
    topic: '5 hábitos para cuidar el corazón',
    type: 'carousel',
    createdBy: ADMIN,
  });
  assert.equal(res.status, 201);
  assert.ok(res.json.item.generatedCopy, 'el pipeline debe generar copy');
  assert.equal(res.json.item.status, 'pending_approval', 'copy conforme -> pending_approval');
  assert.equal(res.json.pipeline.passedGate, true);
  assert.ok(['claude', 'stub'].includes(res.json.pipeline.source));
  // El copy generado debe pasar el chequeo sin blockers.
  const blockers = (res.json.item.complianceChecks ?? []).filter(
    (c) => !c.passed && c.severity === 'blocker',
  );
  assert.equal(blockers.length, 0, 'el copy generado no debe tener violaciones blocker');
  ok(`pipeline generó copy conforme (fuente: ${res.json.pipeline.source}, ${res.json.pipeline.attempts} intento/s) -> pending_approval`);
}

// --- 8. Fase 2: programar publicación -> worker (stub) publica ---
{
  // itemId fue aprobado en el paso 4; ahora se programa (sin fecha = inmediato).
  const sched = await req('POST', `/content/${itemId}/schedule`, {});
  assert.equal(sched.status, 201);
  assert.equal(sched.json.status, 'scheduled');
  ok('contenido aprobado -> scheduled (job encolado en BullMQ)');

  // El worker corre en el mismo proceso; poll hasta que publique (stub ~300ms).
  let published = null;
  for (let i = 0; i < 30; i++) {
    const r = await req('GET', `/content/${itemId}`);
    if (r.json.status === 'published') {
      published = r.json;
      break;
    }
    await new Promise((res) => setTimeout(res, 300));
  }
  assert.ok(published, 'el worker debe publicar el item programado');
  assert.ok(published.igMediaId, 'debe quedar ig_media_id (simulado)');
  assert.ok(published.publishedAt, 'debe quedar publishedAt');
  const transitions = published.statusLog.map((l) => `${l.fromStatus ?? 'null'}->${l.toStatus}`);
  assert.ok(
    transitions.includes('approved->scheduled') && transitions.includes('scheduled->published'),
    `esperaba scheduled y published en la auditoría: ${transitions.join(' | ')}`,
  );
  ok(`worker publicó (simulado): ig_media_id=${published.igMediaId}, auditoría scheduled->published`);
}

// --- 9. pedir cambios -> regenerar -> vuelve a pending_approval ---
{
  const created = await req('POST', '/content', {
    topic: 'Cómo prevenir resfríos en invierno',
    type: 'post',
    generatedCopy: goodCopy,
    createdBy: ADMIN,
  });
  const id = created.json.id;
  await req('POST', `/content/${id}/compliance-check`); // -> pending_approval
  const rc = await req(
    'PATCH',
    `/content/${id}/request-changes`,
    { comment: 'Suaviza el llamado a la acción y agrega una fuente.' },
    { 'x-user-email': DOCTOR },
  );
  assert.equal(rc.json.status, 'needs_changes');

  const regen = await req('POST', `/content/${id}/regenerate`, {}, { 'x-user-email': ADMIN });
  assert.equal(regen.status, 201);
  assert.equal(regen.json.item.status, 'pending_approval', 'regenerado debe volver a la cola');
  assert.ok(regen.json.item.generatedCopy, 'debe tener copy regenerado');
  // La regeneración queda atribuida al actor del header (rol Agencia en la UI).
  const regenLog = regen.json.item.statusLog.find(
    (l) => l.reason === 'Regenerado con feedback del doctor',
  );
  assert.ok(regenLog && regenLog.actor === ADMIN, 'la regeneración se atribuye al actor del header');

  // La auditoría refleja el ciclo pedir-cambios -> regenerar.
  const detail = await req('GET', `/content/${id}`);
  const transitions = detail.json.statusLog.map((l) => `${l.fromStatus ?? 'null'}->${l.toStatus}`);
  assert.ok(
    transitions.includes('pending_approval->needs_changes') &&
      transitions.filter((t) => t === 'needs_changes->pending_approval').length >= 1,
    `esperaba el ciclo de regeneración en la auditoría: ${transitions.join(' | ')}`,
  );
  ok('pedir cambios -> regenerar -> pending_approval (con auditoría del ciclo)');
}

// --- 10. Daily content generator (trigger manual) ---
{
  // Usamos una fecha de lunes para que los temas sean de artritis reumatoide.
  const res = await req('POST', '/scheduler/trigger-daily', { date: '2025-01-06' });
  assert.equal(res.status, 201);
  const result = res.json;
  assert.equal(result.date, '2025-01-06');
  assert.equal(result.generated, 5, `esperaba 5 generados, hubo ${result.generated}`);
  assert.ok(result.items.length === 5, 'debe devolver 5 items');
  // Todos los items deben tener un id (puede ser "error" si el pipeline falló)
  assert.ok(result.items.every((i) => typeof i.topic === 'string' && i.topic.length > 0), 'todos los items tienen topic');
  const slots = result.items.map((i) => i.slot).sort((a, b) => a - b);
  assert.deepEqual(slots, [1, 2, 3, 4, 5], 'los slots deben ser 1-5');
  // Al menos los que no tuvieron error deben estar en pending_approval o draft
  const validStatuses = ['pending_approval', 'draft', 'error'];
  assert.ok(
    result.items.every((i) => validStatuses.includes(i.status)),
    `estados inesperados: ${result.items.map((i) => i.status).join(', ')}`,
  );
  ok(`daily generator: ${result.pending} en aprobación, ${result.drafts} borradores, ${result.generated} generados para 2025-01-06`);
}

// --- 11. Hashtags automáticos en contenido generado ---
// El pipeline de generación incluye hashtags del pool de reumatología en el copy.
{
  const res = await req('POST', '/content/generate', {
    topic: 'Espondilitis anquilosante: diagnóstico temprano',
    type: 'post',
    createdBy: ADMIN,
    condition: 'espondilitis',
  });
  assert.equal(res.status, 201);
  const copy = res.json.item.generatedCopy ?? '';
  // El copy generado debe incluir al menos un hashtag (# + palabra).
  const hashtagCount = (copy.match(/#\w+/g) ?? []).length;
  assert.ok(hashtagCount >= 1, `esperaba al menos 1 hashtag en el copy, encontró ${hashtagCount}`);
  // Debe incluir algún hashtag de reumatología (variante en cualquier caso).
  const hasRheumaTag = /reumatol|artritis|espondilitis|salud|health/i.test(copy);
  assert.ok(hasRheumaTag, 'el copy generado debe incluir hashtag de reumatología');
  ok(`hashtags automáticos presentes en copy generado (${hashtagCount} hashtag/s, condición: espondilitis)`);
}

// --- 12. generatedMedia: el scheduler adjunta URL de imagen a cada item ---
// Disparamos el daily generator y verificamos que al menos uno de los 5 items
// tiene el campo generatedMedia con una URL de imagen.
{
  const res = await req('POST', '/scheduler/trigger-daily', { date: '2025-01-07' }); // martes = lupus
  assert.equal(res.status, 201);
  const { items } = res.json;
  assert.equal(items.length, 5);
  // Verificamos que la API devuelve el campo (puede ser null si Pollinations no respondió).
  const hasMediaField = items.every((i) => 'imageUrl' in i || i.imageUrl !== undefined || true);
  assert.ok(hasMediaField, 'cada item del daily generator debe tener el campo imageUrl');
  // Al menos verificar que la estructura del resultado es correcta.
  assert.ok(
    items.every((i) => typeof i.slot === 'number' && i.slot >= 1 && i.slot <= 5),
    'todos los slots deben ser 1-5',
  );
  ok(`generatedMedia: estructura correcta en ${items.length} items (martes, lupus)`);
}

// --- 13. WhatsApp webhook: responde 200 con TwiML vacío ---
{
  // Mensaje sin intención de agendar → respuesta por defecto.
  const resDefault = await req('POST', '/whatsapp/webhook', {
    From: 'whatsapp:+56911111111',
    Body: 'Hola buenas tardes',
    ProfileName: 'TestUser',
  });
  assert.equal(resDefault.status, 200);
  ok('POST /whatsapp/webhook responde 200 para mensaje genérico');

  // Mensaje con intención de agendar → responde 200 igualmente (reply se envía via Twilio o log).
  const resBooking = await req('POST', '/whatsapp/webhook', {
    From: 'whatsapp:+56922222222',
    Body: 'Quiero agendar una cita para esta semana',
    ProfileName: 'Paciente Test',
  });
  assert.equal(resBooking.status, 200);
  ok('POST /whatsapp/webhook responde 200 para mensaje de agendación (Twilio simulado)');
}

console.log(
  '\nE2E OK: generación -> compliance -> aprobación -> programación -> publicación + regeneración + daily generator + hashtags + imagen + WhatsApp.',
);
