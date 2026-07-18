import assert from 'node:assert/strict';
import { test } from 'node:test';
// shared-types compila a CommonJS; importamos el default y desestructuramos.
import pkg from '../dist/index.js';

const { runComplianceChecks, hasBlockerFailures, COMPLIANCE_RULES } = pkg;

const byRule = (results, rule) => results.find((r) => r.rule === rule);

// Copy conforme de referencia: pasa todos los blockers e incluye el disclaimer.
const CLEAN =
  'La higiene dental diaria ayuda a prevenir caries. La OMS recomienda cepillarse dos veces al día. ' +
  'Este contenido es informativo y no reemplaza una consulta médica. Agenda tu control anual.';

// Un ejemplo que VIOLA cada regla blocker (alineado con los patrones de compliance.ts).
const BLOCKER_VIOLATIONS = {
  NO_PERSONAL_ATTRIBUTES: '¿Sufres de migrañas constantes?',
  NO_DIAGNOSTIC_LANGUAGE: 'Curamos tu insomnio en pocas sesiones.',
  NO_GUARANTEED_CLAIMS: 'Resultados garantizados en 7 días.',
  NO_BEFORE_AFTER: 'Mira cómo quedó nuestro paciente después de 3 sesiones.',
  NO_REMOTE_DIAGNOSIS: 'Cuéntame tus síntomas por DM y te digo qué tienes.',
  NO_MISLEADING_TESTIMONIALS: 'Mis pacientes dicen que les cambió la vida.',
};

test('COMPLIANCE_RULES tiene las 8 reglas esperadas', () => {
  assert.equal(COMPLIANCE_RULES.length, 8);
  const blockers = COMPLIANCE_RULES.filter((r) => r.severity === 'blocker');
  const warnings = COMPLIANCE_RULES.filter((r) => r.severity === 'warning');
  assert.equal(blockers.length, 6, '6 reglas blocker');
  assert.equal(warnings.length, 2, '2 reglas warning');
});

test('copy conforme pasa todas las reglas (sin blockers)', () => {
  const results = runComplianceChecks(CLEAN);
  assert.equal(hasBlockerFailures(results), false);
  assert.ok(
    results.every((r) => r.passed),
    'todas las reglas deben pasar en el copy conforme, incluida la del disclaimer',
  );
});

for (const [rule, text] of Object.entries(BLOCKER_VIOLATIONS)) {
  test(`${rule}: detecta la violación y bloquea el gate`, () => {
    const results = runComplianceChecks(text);
    const check = byRule(results, rule);
    assert.ok(check, `la regla ${rule} debe existir en los resultados`);
    assert.equal(check.passed, false, `${rule} debe fallar con: "${text}"`);
    assert.equal(check.severity, 'blocker');
    assert.equal(hasBlockerFailures(results), true, `${rule} debe bloquear el gate`);
  });
}

test('NO_FEAR_URGENCY es warning: falla pero NO bloquea el gate', () => {
  // Incluye el disclaimer para que no falle también la regla positiva.
  const text =
    'No esperes a que sea tarde. Este contenido es informativo y no reemplaza una consulta médica.';
  const results = runComplianceChecks(text);
  const check = byRule(results, 'NO_FEAR_URGENCY');
  assert.equal(check.passed, false, 'debe detectar la urgencia artificial');
  assert.equal(check.severity, 'warning');
  assert.equal(hasBlockerFailures(results), false, 'un warning no debe bloquear el gate');
});

test('REQUIRED_EDUCATIONAL_DISCLAIMER: falla (warning) si falta el disclaimer', () => {
  const text = 'La actividad física regular mejora la salud cardiovascular. Agenda tu control.';
  const results = runComplianceChecks(text);
  const check = byRule(results, 'REQUIRED_EDUCATIONAL_DISCLAIMER');
  assert.equal(check.passed, false, 'sin disclaimer, la regla positiva falla');
  assert.equal(check.severity, 'warning');
  assert.equal(hasBlockerFailures(results), false, 'la ausencia de disclaimer no bloquea el gate');
});

test('caso combinado: varias violaciones blocker en un mismo copy', () => {
  const text =
    '¿Sufres de acné? Curamos tu piel con resultados garantizados. ' +
    'Mira cómo quedó nuestro paciente.';
  const results = runComplianceChecks(text);
  const failed = results.filter((r) => !r.passed && r.severity === 'blocker').map((r) => r.rule);
  for (const expected of [
    'NO_PERSONAL_ATTRIBUTES',
    'NO_DIAGNOSTIC_LANGUAGE',
    'NO_GUARANTEED_CLAIMS',
    'NO_BEFORE_AFTER',
  ]) {
    assert.ok(failed.includes(expected), `esperaba ${expected} entre las violaciones`);
  }
  assert.equal(hasBlockerFailures(results), true);
});
