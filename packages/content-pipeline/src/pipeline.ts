import {
  ComplianceCheckResult,
  ContentType,
  RheumaCondition,
  hasBlockerFailures,
  runComplianceChecks,
} from '@medgram/shared-types';
import { GeneratedCopy, generateCopy } from './generator';

export interface PipelineResult {
  topic: string;
  type: ContentType;
  caption: string;
  hashtags: string[];
  /** Caption + hashtags: el texto final que se valida y persiste. */
  fullCopy: string;
  source: GeneratedCopy['source'];
  attempts: number;
  /** true si el copy final pasó el gate (sin violaciones blocker). */
  passedGate: boolean;
  complianceResults: ComplianceCheckResult[];
  /** Guión para reels (escenas con tiempos). Solo presente cuando type === 'reel'. */
  reelScript?: string;
}

export interface PipelineOptions {
  model?: string;
  apiKey?: string;
  maxAttempts?: number;
  log?: (message: string) => void;
  /** Feedback para el primer intento (p.ej. el comentario del doctor al pedir cambios). */
  initialFeedback?: string;
  /** Rheumatology condition for targeted hashtag pool injection. */
  condition?: RheumaCondition;
}

export function composeFullCopy(copy: GeneratedCopy): string {
  const tags = copy.hashtags.join(' ').trim();
  const caption = copy.caption.trim();
  return tags ? `${caption}\n\n${tags}` : caption;
}

function formatBlockerFeedback(results: ComplianceCheckResult[]): string {
  return results
    .filter((r) => !r.passed && r.severity === 'blocker')
    .map((r) => `- ${r.rule}: ${r.detail}`)
    .join('\n');
}

/**
 * Orquesta el paso 5 del blueprint:
 *   tema -> generar copy -> validar compliance -> (si falla blocker) reintentar con feedback.
 * Si pasa el gate, el copy queda listo para crear un ContentItem en pending_approval.
 * Si agota los intentos, devuelve passedGate=false para que el caller lo deje en draft y notifique.
 */
export async function runGenerationPipeline(
  topic: string,
  type: ContentType,
  opts: PipelineOptions = {},
): Promise<PipelineResult> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const log = opts.log ?? (() => undefined);

  let feedback: string | undefined = opts.initialFeedback?.trim() || undefined;
  let last: GeneratedCopy = { caption: '', hashtags: [], source: 'stub' };
  let results: ComplianceCheckResult[] = [];
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    last = await generateCopy(topic, type, {
      model: opts.model,
      apiKey: opts.apiKey,
      feedback,
      log,
      condition: opts.condition,
    });
    const fullCopy = composeFullCopy(last);
    results = runComplianceChecks(fullCopy);

    if (!hasBlockerFailures(results)) {
      log(`[pipeline] "${topic}" pasó el gate en el intento ${attempts} (fuente: ${last.source})`);
      return {
        topic,
        type,
        caption: last.caption,
        hashtags: last.hashtags,
        fullCopy,
        source: last.source,
        attempts,
        passedGate: true,
        complianceResults: results,
        reelScript: last.reelScript,
      };
    }

    feedback = formatBlockerFeedback(results);
    log(`[pipeline] "${topic}" intento ${attempts} falló compliance:\n${feedback}`);
  }

  log(
    `[pipeline] "${topic}" agotó ${maxAttempts} intentos sin pasar el gate; ` +
      `queda en draft para revisión/edición manual`,
  );
  return {
    topic,
    type,
    caption: last.caption,
    hashtags: last.hashtags,
    fullCopy: composeFullCopy(last),
    source: last.source,
    attempts,
    passedGate: false,
    complianceResults: results,
  };
}
