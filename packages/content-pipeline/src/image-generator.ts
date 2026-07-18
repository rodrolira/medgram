import { RheumaCondition } from '@medgram/shared-types';

export interface GeneratedImage {
  url: string;
  source: 'huggingface' | 'pollinations' | 'stub';
  prompt: string;
}

export interface ImageGeneratorOptions {
  hfToken?: string;
  log?: (msg: string) => void;
}

const CONDITION_VISUAL_CONTEXT: Record<RheumaCondition | 'general', string> = {
  artritis_reumatoide: 'inflamed joints anatomy, rheumatoid arthritis, joint inflammation',
  lupus: 'immune system illustration, lupus erythematosus, medical infographic',
  osteoartritis: 'knee joint anatomy, cartilage, osteoarthritis cross section',
  espondilitis: 'spine anatomy, sacroiliac joint, ankylosing spondylitis',
  bienestar: 'healthy lifestyle wellness, anti-inflammatory foods, exercise',
  general: 'medical health illustration, clinical infographic',
};

/**
 * Builds a safe, medically appropriate image prompt.
 * No people, no before/after, educational style only.
 */
export function buildImagePrompt(topic: string, condition?: RheumaCondition): string {
  const visualCtx = CONDITION_VISUAL_CONTEXT[condition ?? 'general'];
  return (
    `Medical educational illustration, clean minimal design, professional infographic style. ` +
    `Theme: ${topic}. Context: ${visualCtx}. ` +
    `Color palette: blue, white, light gray. ` +
    `No people, no faces, no before/after, no text overlay. ` +
    `Educational, clinical, modern aesthetic.`
  );
}

/**
 * Builds a Pollinations.ai image URL.
 * Returns a stable deterministic URL based on the prompt — the image is rendered
 * lazily by Pollinations CDN when someone fetches the URL.
 * Free tier: ~2 req/min; sufficient for 5 posts/day.
 */
export function buildPollinationsUrl(prompt: string, width = 1080, height = 1080): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;
}

/**
 * Tries HuggingFace Inference API (FLUX.1-schnell) if HF_TOKEN is available.
 * Returns binary PNG as a base64 data URL, or null on any failure.
 * HF free tier allows a handful of requests per minute per token.
 */
async function tryHuggingFace(
  prompt: string,
  hfToken: string,
  log: (m: string) => void,
): Promise<string | null> {
  const url =
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
  try {
    log('[image-generator] HuggingFace: enviando solicitud...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt, parameters: { width: 1024, height: 1024 } }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const body = await res.text();
      log(`[image-generator] HuggingFace respondió ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    log('[image-generator] HuggingFace: imagen generada exitosamente');
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    log(`[image-generator] HuggingFace falló: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Generates a medical illustration for a content item.
 * Priority:
 *   1. HuggingFace FLUX.1-schnell (if HUGGINGFACE_API_TOKEN is set)
 *   2. Pollinations.ai (free CDN, no auth)
 *   3. Stub placeholder URL
 */
export async function generateMedicalImage(
  topic: string,
  opts: ImageGeneratorOptions & { condition?: RheumaCondition } = {},
): Promise<GeneratedImage> {
  const log = opts.log ?? (() => undefined);
  const prompt = buildImagePrompt(topic, opts.condition);

  const hfToken = opts.hfToken ?? process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    const dataUrl = await tryHuggingFace(prompt, hfToken, log);
    if (dataUrl) {
      return { url: dataUrl, source: 'huggingface', prompt };
    }
    log('[image-generator] Usando Pollinations.ai como fallback');
  }

  const pollinationsUrl = buildPollinationsUrl(prompt);
  log(`[image-generator] Pollinations.ai URL generada (lazy render): ${pollinationsUrl.slice(0, 80)}...`);
  return { url: pollinationsUrl, source: 'pollinations', prompt };
}
