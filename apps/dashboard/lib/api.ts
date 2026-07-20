export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const FALLBACK_EMAIL = 'doctor@medgram.local';

export interface ComplianceCheck {
  id: string;
  rule: string;
  severity: 'blocker' | 'warning';
  passed: boolean;
  detail: string | null;
}

export interface StatusLogEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actor: string;
  reason: string | null;
  createdAt: string;
}

export interface GeneratedMedia {
  url: string;
  source: 'huggingface' | 'pollinations' | string;
  prompt?: string;
}

export interface ContentItem {
  id: string;
  type: 'post' | 'carousel' | 'reel' | 'ad_creative';
  status: string;
  topic: string;
  generatedCopy: string | null;
  complianceFlags: string[];
  doctorComments: string | null;
  approvedAt: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  igMediaId: string | null;
  createdAt: string;
  generatedMedia?: GeneratedMedia[] | null;
  complianceChecks?: ComplianceCheck[];
  statusLog?: StatusLogEntry[];
}

export const TYPE_LABELS: Record<ContentItem['type'], string> = {
  post: 'Post',
  carousel: 'Carrusel',
  reel: 'Reel',
  ad_creative: 'Anuncio',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  needs_changes: 'Cambios solicitados',
  scheduled: 'Programado',
  published: 'Publicado',
};

export const RULE_LABELS: Record<string, string> = {
  NO_PERSONAL_ATTRIBUTES: 'Sin atributos personales (2ª persona + condición)',
  NO_DIAGNOSTIC_LANGUAGE: 'Sin lenguaje diagnóstico',
  NO_GUARANTEED_CLAIMS: 'Sin promesas garantizadas',
  NO_BEFORE_AFTER: 'Sin antes/después',
  NO_REMOTE_DIAGNOSIS: 'Sin diagnóstico a distancia',
  NO_MISLEADING_TESTIMONIALS: 'Sin testimonios engañosos',
  NO_FEAR_URGENCY: 'Sin miedo ni urgencia artificial',
  REQUIRED_EDUCATIONAL_DISCLAIMER: 'Disclaimer educativo presente',
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.message
      ? Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message
      : `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export function getPending(): Promise<ContentItem[]> {
  return fetch(`${API_URL}/content/pending-approval`, { cache: 'no-store' }).then((r) =>
    handle<ContentItem[]>(r),
  );
}

export function getByStatus(status: string): Promise<ContentItem[]> {
  return fetch(`${API_URL}/content?status=${encodeURIComponent(status)}`, {
    cache: 'no-store',
  }).then((r) => handle<ContentItem[]>(r));
}

export function getContent(id: string): Promise<ContentItem> {
  return fetch(`${API_URL}/content/${id}`, { cache: 'no-store' }).then((r) =>
    handle<ContentItem>(r),
  );
}

export type ReviewAction = 'approve' | 'reject' | 'request-changes';

export function review(
  id: string,
  action: ReviewAction,
  body: Record<string, string>,
  actorEmail: string = FALLBACK_EMAIL,
): Promise<ContentItem> {
  return fetch(`${API_URL}/content/${id}/${action}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-user-email': actorEmail },
    body: JSON.stringify(body),
  }).then((r) => handle<ContentItem>(r));
}

export interface GenerateResult {
  item: ContentItem;
  pipeline: {
    attempts: number;
    source: 'claude' | 'stub';
    passedGate: boolean;
    status: string;
  };
}

export function generateContent(
  topic: string,
  type: ContentItem['type'],
  actorEmail: string = FALLBACK_EMAIL,
): Promise<GenerateResult> {
  return fetch(`${API_URL}/content/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-email': actorEmail },
    body: JSON.stringify({ topic, type }),
  }).then((r) => handle<GenerateResult>(r));
}

export function regenerateContent(
  id: string,
  actorEmail: string = FALLBACK_EMAIL,
): Promise<GenerateResult> {
  return fetch(`${API_URL}/content/${id}/regenerate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-email': actorEmail },
  }).then((r) => handle<GenerateResult>(r));
}

export function scheduleContent(
  id: string,
  scheduledFor: string | undefined,
  actorEmail: string = FALLBACK_EMAIL,
): Promise<ContentItem> {
  return fetch(`${API_URL}/content/${id}/schedule`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-email': actorEmail },
    body: JSON.stringify(scheduledFor ? { scheduledFor } : {}),
  }).then((r) => handle<ContentItem>(r));
}

export interface DailyGenerationItem {
  id: string;
  topic: string;
  slot: number;
  status: string;
}

export interface DailyGenerationResult {
  date: string;
  generated: number;
  pending: number;
  drafts: number;
  items: DailyGenerationItem[];
}

export function triggerDailyGeneration(date?: string): Promise<DailyGenerationResult> {
  return fetch(`${API_URL}/scheduler/trigger-daily`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(date ? { date } : {}),
  }).then((r) => handle<DailyGenerationResult>(r));
}

export function getCalendarItems(): Promise<ContentItem[]> {
  return Promise.all([
    getByStatus('approved'),
    getByStatus('scheduled'),
    getByStatus('published'),
  ]).then((groups) => groups.flat());
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Analytics ---

export interface ContentAnalytics {
  id: string;
  contentItemId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saved: number;
  engagementRate: number;
  fetchedAt: string;
}

export interface AnalyticsSummary {
  totalPublished: number;
  withAnalytics: number;
  totals: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
  };
  avgEngagementRate: number;
  topPosts: Array<{
    id: string;
    topic: string;
    type: string;
    publishedAt: string | null;
    engagementRate: number;
    reach: number;
    likes: number;
  }>;
}

export function getAnalyticsSummary(limit = 30): Promise<AnalyticsSummary> {
  return fetch(`${API_URL}/analytics/summary?limit=${limit}`, { cache: 'no-store' }).then((r) =>
    handle<AnalyticsSummary>(r),
  );
}

export function getContentAnalytics(id: string): Promise<ContentAnalytics | null> {
  return fetch(`${API_URL}/analytics/content/${id}`, { cache: 'no-store' }).then((r) =>
    handle<ContentAnalytics | null>(r),
  );
}

export function refreshAnalytics(): Promise<{ total: number; success: number; failed: number }> {
  return fetch(`${API_URL}/analytics/refresh`, { method: 'POST' }).then((r) =>
    handle<{ total: number; success: number; failed: number }>(r),
  );
}

// --- Ads ---

export interface AdCampaign {
  campaignId: string;
  adsetId: string;
  adId: string;
  status: 'active' | 'simulated';
  previewUrl?: string;
}

export function promoteContent(
  contentItemId: string,
  dailyBudgetCents: number,
  durationDays: number,
): Promise<{ contentItemId: string; topic: string; campaign: AdCampaign }> {
  return fetch(`${API_URL}/ads/promote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contentItemId, dailyBudgetCents, durationDays }),
  }).then((r) => handle(r));
}
