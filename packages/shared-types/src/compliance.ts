// Reglas de compliance como código. Fuente de verdad conceptual: docs/COMPLIANCE.md
// Cada regla nueva se documenta primero allá y se implementa acá.

export type ComplianceSeverity = 'blocker' | 'warning';

export interface ComplianceCheckResult {
  rule: string;
  severity: ComplianceSeverity;
  passed: boolean;
  detail: string;
}

export interface ComplianceRuleDef {
  id: string;
  severity: ComplianceSeverity;
  description: string;
  source: string;
  /** Patrones prohibidos: si alguno aparece en el copy, la regla falla. */
  forbidden?: RegExp[];
  /** Patrones requeridos: si ninguno aparece, la regla falla (regla positiva). */
  required?: RegExp[];
  /** Detalle a mostrar cuando falla una regla `required`. */
  missingDetail?: string;
}

export const COMPLIANCE_RULES: ComplianceRuleDef[] = [
  {
    id: 'NO_PERSONAL_ATTRIBUTES',
    severity: 'blocker',
    description:
      'No asumir ni implicar que el lector padece una condición de salud (Meta prohíbe 2da persona + síntoma/condición)',
    source: 'Meta Personal Attributes Policy',
    forbidden: [
      /(sufres|padeces)\b/iu,
      /(sufre|padece)\s+usted\b/iu,
      /si\s+(tienes|tenés|sufres|padeces|presentas)\b/iu,
      /¿\s*(tienes|tenés|sientes|sentís|presentas)\b/iu,
      /(cansad[oa]|hart[oa]|aburrid[oa])\s+de\s+(tu|tus|vivir\s+con|luchar)/iu,
      /tus?\s+(acné|migrañas?|ansiedad|insomnio|diabetes|hipertensión|sobrepeso|obesidad|depresión|colesterol|alergias?|dolores?|síntomas?)\b/iu,
    ],
  },
  {
    id: 'NO_DIAGNOSTIC_LANGUAGE',
    severity: 'blocker',
    description:
      'No usar lenguaje diagnóstico ni prometer curas o tratamientos como resultado del servicio',
    source: 'Meta Health Ads + Colegio Médico + Ley 20.584',
    forbidden: [
      /\bcuramos\b/iu,
      /\bcura\s+(definitiva|total|garantizada|para\s+siempre)\b/iu,
      /\bdiagnosticamos\b/iu,
      /diagnóstico\s+(inmediato|instantáneo|online|en\s+línea|por\s+(dm|chat|whatsapp|instagram|redes))/iu,
      /(tratamos|eliminamos|quitamos)\s+(los?\s+|tus?\s+)?(síntomas?|enfermedades?|dolencias?)/iu,
      /elimina\s+(tu|el|la)\s+\S+\s+(para\s+siempre|de\s+raíz)/iu,
    ],
  },
  {
    id: 'NO_GUARANTEED_CLAIMS',
    severity: 'blocker',
    description:
      'No prometer resultados garantizados, inmediatos ni respaldo clínico sin evidencia citable',
    source: 'Meta Health Ads + Colegio Médico',
    forbidden: [
      /garantizad[oa]s?\b/iu,
      /100\s*%\s*(efectiv|segur|natural|garantizad)/iu,
      /resultados?\s+(inmediatos?|instantáneos?|asegurados?)/iu,
      /clínicamente\s+(probad|comprobad|demostrad)/iu,
      /sin\s+(ningún\s+)?riesgos?\b/iu,
      /milagros[oa]s?\b|\bmilagro\b/iu,
      /\binfalible\b/iu,
    ],
  },
  {
    id: 'NO_BEFORE_AFTER',
    severity: 'blocker',
    description:
      'No mostrar ni describir transformaciones antes/después, incluidas las implícitas (Meta 2026)',
    source: 'Meta Health Ads 2026',
    forbidden: [
      /antes\s*(y|\/|vs\.?|→|->|-)\s*después/iu,
      /mira\s+c[óo]mo\s+qued[óo]/iu,
      /as[íi]\s+qued[óo]\s+(mi\s+|nuestr[oa]\s+)?paciente/iu,
      /transformaci[óo]n\b/iu,
      /despu[ée]s\s+de\s+\d+\s+(sesion|d[íi]as?|semanas?|mes)/iu,
      /resultados?\s+(visibles?\s+)?(en|desde)\s+la\s+primera\s+sesi[óo]n/iu,
    ],
  },
  {
    id: 'NO_REMOTE_DIAGNOSIS',
    severity: 'blocker',
    description:
      'No ofrecer evaluación ni diagnóstico por redes/DM ni contenido que sustituya la consulta médica',
    source: 'Ley 20.584',
    forbidden: [
      /(m[áa]ndame|env[íi]ame|escr[íi]beme|mandame|enviame|escribeme)\s+(un\s+)?(dm|mensaje|inbox|wsp|whatsapp)?\s*(con\s+)?tus?\s+s[íi]ntomas/iu,
      /te\s+digo\s+(qu[ée]|lo\s+que)\s+tienes/iu,
      /cu[ée]ntame\s+tus\s+s[íi]ntomas/iu,
      /diagn[óo]stico\s+por\s+(dm|redes|mensaje|comentarios)/iu,
      /consulta\s+(gratis\s+)?por\s+(dm|instagram|comentarios|inbox)/iu,
    ],
  },
  {
    id: 'NO_MISLEADING_TESTIMONIALS',
    severity: 'blocker',
    description: 'No usar testimonios de pacientes como evidencia de resultados',
    source: 'Colegio Médico de Chile — Código de Ética',
    forbidden: [
      /mis\s+pacientes\s+(dicen|aseguran|afirman|cuentan)/iu,
      /testimonios?\b/iu,
      /les?\s+cambi[óo]\s+la\s+vida/iu,
      /pacientes?\s+(100\s*%\s+)?satisfech[oa]s/iu,
      /casos?\s+de\s+[ée]xito/iu,
    ],
  },
  {
    id: 'NO_FEAR_URGENCY',
    severity: 'warning',
    description: 'No apelar al miedo ni crear urgencia artificial para empujar la consulta',
    source: 'Buenas prácticas + espíritu del Código de Ética',
    forbidden: [
      /no\s+esperes\s+(a\s+)?que\s+(sea\s+(demasiado\s+)?tarde|empeore)/iu,
      /podr[íi]a\s+ser\s+(algo\s+)?(grave|serio|peor)/iu,
      /antes\s+de\s+que\s+(sea\s+tarde|empeore)/iu,
      /[úu]ltimos\s+cupos/iu,
      /solo\s+por\s+hoy/iu,
      /agenda\s+YA\b/u,
    ],
  },
  {
    id: 'REQUIRED_EDUCATIONAL_DISCLAIMER',
    severity: 'warning',
    description:
      'El contenido educativo debe aclarar que es informativo y no reemplaza una consulta médica',
    source: 'Mitigación Ley 20.584',
    required: [
      /no\s+reemplaza\s+(una\s+|la\s+)?(consulta|atenci[óo]n|evaluaci[óo]n)\s+(m[ée]dica|profesional)/iu,
      /contenido\s+(es\s+)?(meramente\s+)?informativ/iu,
      /consulta\s+(siempre\s+)?(a|con)\s+(tu|un)\s+(m[ée]dico|profesional|especialista)/iu,
    ],
    missingDetail:
      'Falta el disclaimer educativo (ej.: "este contenido es informativo y no reemplaza una consulta médica")',
  },
];

export function runComplianceChecks(copy: string): ComplianceCheckResult[] {
  return COMPLIANCE_RULES.map((rule) => {
    if (rule.forbidden) {
      for (const pattern of rule.forbidden) {
        const match = copy.match(pattern);
        if (match) {
          return {
            rule: rule.id,
            severity: rule.severity,
            passed: false,
            detail: `Frase detectada: "${match[0].trim()}" — ${rule.description}`,
          };
        }
      }
      return { rule: rule.id, severity: rule.severity, passed: true, detail: rule.description };
    }

    const found = (rule.required ?? []).some((p) => p.test(copy));
    return {
      rule: rule.id,
      severity: rule.severity,
      passed: found,
      detail: found ? rule.description : (rule.missingDetail ?? rule.description),
    };
  });
}

export function hasBlockerFailures(results: ComplianceCheckResult[]): boolean {
  return results.some((r) => r.severity === 'blocker' && !r.passed);
}
