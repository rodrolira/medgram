import Anthropic from '@anthropic-ai/sdk';
import { COMPLIANCE_RULES, ContentType } from '@medgram/shared-types';

// Regla de la skill claude-api: default claude-opus-4-8 salvo que se pida otro modelo.
// Configurable por si se quiere bajar a sonnet/haiku por costo (decisión del usuario).
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8';

export interface GeneratedCopy {
  caption: string;
  hashtags: string[];
  /** "claude" cuando se generó vía API; "stub" cuando no hay API key (Fase 1 sin key). */
  source: 'claude' | 'stub';
}

const TYPE_GUIDANCE: Record<ContentType, string> = {
  post: 'un post único de Instagram (1 imagen). Caption de 3 a 6 frases.',
  carousel: 'un carrusel educativo. El caption introduce 3-5 puntos, uno por línea.',
  reel: 'un reel corto. Caption breve (2-3 frases) que acompaña un video vertical.',
  ad_creative: 'un creativo para anuncio. Caption breve y claro, sin sensacionalismo.',
};

/** Convierte las reglas de compliance (fuente de verdad) en instrucciones duras del prompt. */
export function buildSystemPrompt(): string {
  const rules = COMPLIANCE_RULES.map(
    (r) => `- ${r.id} (${r.severity}): ${r.description}. Fuente: ${r.source}.`,
  ).join('\n');

  return `Eres un redactor de contenido médico para el Instagram de un médico general en Chile.
Escribes en español de Chile, con tono cercano, claro y prudente, sin sensacionalismo.

REGLAS DURAS DE COMPLIANCE (obligatorias — no son sugerencias de estilo):
${rules}

Instrucciones adicionales:
- Nunca uses segunda persona asumiendo que el lector tiene una condición ("¿Sufres de...?").
- Nunca prometas curas, resultados garantizados ni describas transformaciones "antes/después".
- Nunca ofrezcas diagnóstico por redes ni pidas síntomas por DM.
- SIEMPRE incluye una frase que aclare que el contenido es informativo y no reemplaza una consulta médica.
- Cierra con un llamado a la acción neutro (por ejemplo, "Agenda tu control").

Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma:
{"caption": "<texto del caption>", "hashtags": ["#tag1", "#tag2"]}
Incluye entre 5 y 8 hashtags relevantes y sobrios, sin promesas.`;
}

function buildUserPrompt(topic: string, type: ContentType, feedback?: string): string {
  let prompt = `Tema: "${topic}"\nFormato: ${TYPE_GUIDANCE[type]}`;
  if (feedback) {
    prompt +=
      `\n\nTen en cuenta esta retroalimentación (del validador de compliance o del doctor) para ` +
      `corregir el contenido:\n${feedback}\n\nReescribe el contenido atendiendo esa retroalimentación ` +
      `y respetando TODAS las reglas.`;
  }
  return prompt;
}

/**
 * Fallback determinista para Fase 1 sin ANTHROPIC_API_KEY: produce copy conforme
 * (pasa todos los blockers e incluye el disclaimer educativo) para que el sistema
 * sea demostrable y testeable end-to-end sin depender de la API.
 */
export function stubCopy(topic: string, type: ContentType): GeneratedCopy {
  void type;
  const caption =
    `${topic}: información general.\n\n` +
    `Mantener buenos hábitos y controles preventivos ayuda a cuidar la salud. ` +
    `Según fuentes como la OMS y el MINSAL, informarse con fuentes confiables es clave. ` +
    `Este contenido es informativo y no reemplaza una consulta médica. ` +
    `Agenda tu control con un profesional de la salud.`;
  const hashtags = [
    '#SaludGeneral',
    '#Bienestar',
    '#MedicinaPreventiva',
    '#SaludChile',
    '#EducacionEnSalud',
  ];
  return { caption, hashtags, source: 'stub' };
}

function parseCopy(raw: string): { caption: string; hashtags: string[] } {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    const obj = JSON.parse(trimmed) as { caption?: unknown; hashtags?: unknown };
    const caption = typeof obj.caption === 'string' ? obj.caption : raw;
    const hashtags = Array.isArray(obj.hashtags)
      ? obj.hashtags.filter((h): h is string => typeof h === 'string')
      : [];
    return { caption, hashtags };
  } catch {
    // Si el modelo no devolvió JSON limpio, usa el texto crudo como caption.
    return { caption: raw, hashtags: [] };
  }
}

export interface GenerateOptions {
  model?: string;
  apiKey?: string;
  /** Motivo del rechazo anterior, para que el modelo corrija en el reintento. */
  feedback?: string;
  log?: (message: string) => void;
}

/**
 * Genera copy con Claude. Endurecido para producción:
 *  - El SDK reintenta automáticamente errores transitorios (429 rate limit, 5xx) — maxRetries: 3.
 *  - Un `stop_reason: "refusal"` o una respuesta vacía degradan al stub (el doctor revisa igual).
 *  - Cualquier error no recuperable (API key inválida, etc.) se loguea y degrada al stub,
 *    para que un fallo de la API de Claude no tumbe el endpoint. Nunca lanza.
 */
export async function generateCopy(
  topic: string,
  type: ContentType,
  opts: GenerateOptions = {},
): Promise<GeneratedCopy> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const log = opts.log ?? (() => undefined);
  if (!apiKey) {
    return stubCopy(topic, type);
  }

  const client = new Anthropic({ apiKey, maxRetries: 3 });
  try {
    const response = await client.messages.create({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: 2000,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(topic, type, opts.feedback) }],
    });

    if (response.stop_reason === 'refusal') {
      log('[generator] Claude rechazó la solicitud (refusal); usando plantilla de respaldo');
      return stubCopy(topic, type);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    const parsed = parseCopy(raw);
    if (!parsed.caption.trim()) {
      log('[generator] respuesta vacía de Claude; usando plantilla de respaldo');
      return stubCopy(topic, type);
    }
    return { ...parsed, source: 'claude' };
  } catch (e) {
    // Aquí llegan errores tras agotar los reintentos del SDK, o errores no recuperables
    // (auth, request inválido, red). Degradar al stub mantiene el pipeline en pie.
    log(
      `[generator] fallo llamando a Claude: ${(e as Error).message}; usando plantilla de respaldo`,
    );
    return stubCopy(topic, type);
  }
}
