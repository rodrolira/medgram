'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ContentItem,
  RULE_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  getContent,
  regenerateContent,
  review,
  scheduleContent,
} from '@/lib/api';
import { useRole } from '@/lib/session';

type ActionMode = 'reject' | 'request-changes' | null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, email } = useRole();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scheduledForInput, setScheduledForInput] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [regenNotice, setRegenNotice] = useState<string | null>(null);

  useEffect(() => {
    getContent(id)
      .then(setItem)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function act(action: 'approve' | 'reject' | 'request-changes') {
    setBusy(true);
    setActionError(null);
    try {
      const body: Record<string, string> =
        action === 'reject'
          ? { reason: comment }
          : action === 'request-changes'
            ? { comment }
            : {};
      const updated = await review(id, action, body, email);
      if (action === 'approve') {
        // Quedarse en el detalle: ahora aparece la sección de publicación.
        setItem(updated);
        setMode(null);
        setBusy(false);
        return;
      }
      router.push('/');
    } catch (e) {
      setActionError((e as Error).message);
      setBusy(false);
    }
  }

  async function schedule(when?: string) {
    setScheduling(true);
    setScheduleError(null);
    try {
      const updated = await scheduleContent(id, when, email);
      setItem(updated);
      // El worker (stub) publica en ~300ms; refrescamos hasta ver "published".
      for (let i = 0; i < 15; i++) {
        await sleep(400);
        const fresh = await getContent(id);
        setItem(fresh);
        if (fresh.status === 'published') break;
      }
    } catch (e) {
      setScheduleError((e as Error).message);
    } finally {
      setScheduling(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setRegenError(null);
    setRegenNotice(null);
    try {
      const res = await regenerateContent(id, email);
      setItem(res.item);
      setRegenNotice(
        res.pipeline.passedGate
          ? 'Regenerado y de vuelta en la cola de aprobación.'
          : `Regenerado pero no pasó el chequeo tras ${res.pipeline.attempts} intento(s); sigue en cambios.`,
      );
    } catch (e) {
      setRegenError((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error} — <Link href="/" className="underline">volver a la cola</Link>
      </div>
    );
  }

  if (!item) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />;
  }

  const isPending = item.status === 'pending_approval';
  const checks = item.complianceChecks ?? [];
  const failed = checks.filter((c) => !c.passed);

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver a la cola
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{item.topic}</h1>
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isPending
              ? 'bg-amber-100 text-amber-700'
              : item.status === 'approved'
                ? 'bg-emerald-100 text-emerald-700'
                : item.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
        >
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      {!isPending && item.doctorComments && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
          Comentario del doctor: “{item.doctorComments}”
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,400px)_1fr]">
        {/* Preview estilo Instagram */}
        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-500">Así se vería el post</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-amber-400 via-rose-500 to-violet-500 text-xs font-bold text-white">
                DR
              </span>
              <span className="text-sm font-semibold">dr.medgram</span>
            </div>
            {item.generatedMedia?.[0]?.url ? (
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={item.generatedMedia[0].url}
                  alt={item.topic}
                  fill
                  className="object-cover"
                  unoptimized={item.generatedMedia[0].source === 'pollinations'}
                />
                <span className="absolute bottom-1 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  {item.generatedMedia[0].source}
                </span>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-slate-400">
                <div className="text-center">
                  <div className="text-3xl">{item.type === 'reel' ? '▶' : '🖼'}</div>
                  <div className="mt-1 text-xs">Imagen generándose…</div>
                </div>
              </div>
            )}
            <div className="px-3 py-2 text-lg tracking-wide text-slate-700">♡&ensp;💬&ensp;↗</div>
            <div className="px-3 pb-4 text-sm leading-relaxed">
              <span className="font-semibold">dr.medgram</span>{' '}
              <span className="whitespace-pre-wrap text-slate-800">{item.generatedCopy}</span>
            </div>
          </div>
        </div>

        {/* Checklist + acciones + auditoría */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-slate-500">
              Checklist de compliance ({checks.length - failed.length}/{checks.length} OK)
            </h2>
            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${c.passed
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.severity === 'blocker'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                  >
                    {c.passed ? '✓' : '✗'}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800">
                      {RULE_LABELS[c.rule] ?? c.rule}
                    </span>
                    {!c.passed && c.detail && (
                      <p className="mt-0.5 text-xs text-slate-500">{c.detail}</p>
                    )}
                  </div>
                </li>
              ))}
              {checks.length === 0 && (
                <li className="text-sm text-slate-500">Aún no se corre el chequeo automático.</li>
              )}
            </ul>
          </section>

          {item.status === 'needs_changes' && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="mb-1 text-sm font-medium text-amber-900">Cambios solicitados</h2>
              {item.doctorComments && (
                <p className="mb-3 text-sm text-amber-800">“{item.doctorComments}”</p>
              )}
              {role === 'agency' ? (
                <>
                  <button
                    onClick={regenerate}
                    disabled={regenerating}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {regenerating ? 'Regenerando…' : 'Regenerar con estos comentarios'}
                  </button>
                  {regenNotice && <p className="mt-3 text-sm text-amber-900">{regenNotice}</p>}
                  {regenError && <p className="mt-3 text-sm text-red-600">{regenError}</p>}
                </>
              ) : (
                <p className="text-xs text-amber-700">
                  La agencia regenerará el contenido con tus comentarios.
                </p>
              )}
            </section>
          )}

          {/* Fase 2: publicación (tarea de la agencia sobre contenido aprobado) */}
          {item.status === 'approved' && role === 'doctor' && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Aprobado. La agencia lo programará para publicación.
            </section>
          )}

          {item.status === 'approved' && role === 'agency' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-medium text-slate-500">Publicación</h2>
              <p className="mb-3 text-xs text-slate-500">
                Publicación simulada (Fase 2). La integración real con Instagram requiere Meta App
                Review.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Programar para</label>
                  <input
                    type="datetime-local"
                    value={scheduledForInput}
                    onChange={(e) => setScheduledForInput(e.target.value)}
                    disabled={scheduling}
                    className="rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={() =>
                    schedule(scheduledForInput ? new Date(scheduledForInput).toISOString() : undefined)
                  }
                  disabled={scheduling || !scheduledForInput}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Programar
                </button>
                <button
                  onClick={() => schedule(undefined)}
                  disabled={scheduling}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {scheduling ? 'Publicando…' : 'Publicar ahora'}
                </button>
              </div>
              {scheduleError && <p className="mt-3 text-sm text-red-600">{scheduleError}</p>}
            </section>
          )}

          {item.status === 'scheduled' && (
            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              {scheduling ? 'Publicando…' : 'Programado'}
              {item.scheduledFor && !scheduling && ` para ${formatDate(item.scheduledFor)}`}
              {' '}— en cola de publicación.
            </section>
          )}

          {item.status === 'published' && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Publicado{item.publishedAt ? ` el ${formatDate(item.publishedAt)}` : ''}.</p>
              {item.igMediaId && (
                <p className="mt-1 text-xs text-emerald-700">ig_media_id: {item.igMediaId} (simulado)</p>
              )}
            </section>
          )}

          {isPending && role === 'agency' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              En espera de la revisión del doctor. Cambia a rol “Doctor” para aprobar o rechazar.
            </section>
          )}

          {isPending && role === 'doctor' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-500">Decisión</h2>

              {mode === null ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => act('approve')}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy ? 'Enviando…' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => setMode('request-changes')}
                    disabled={busy}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    Pedir cambios
                  </button>
                  <button
                    onClick={() => setMode('reject')}
                    disabled={busy}
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    {mode === 'reject' ? 'Motivo del rechazo (obligatorio)' : 'Qué hay que cambiar'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-500 focus:outline-none"
                    placeholder={
                      mode === 'reject' ? 'Ej.: el tono no me representa' : 'Ej.: suavizar el llamado a la acción'
                    }
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => act(mode)}
                      disabled={busy || comment.trim().length === 0}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${mode === 'reject'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                    >
                      {busy ? 'Enviando…' : mode === 'reject' ? 'Confirmar rechazo' : 'Enviar comentario'}
                    </button>
                    <button
                      onClick={() => {
                        setMode(null);
                        setComment('');
                      }}
                      disabled={busy}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
            </section>
          )}

          {(item.statusLog ?? []).length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-500">Historial (auditoría)</h2>
              <ul className="space-y-2">
                {item.statusLog!.map((l) => (
                  <li key={l.id} className="flex items-baseline gap-2 text-sm">
                    <span className="shrink-0 text-xs text-slate-400">{formatDate(l.createdAt)}</span>
                    <span className="text-slate-700">
                      {l.fromStatus ? `${STATUS_LABELS[l.fromStatus] ?? l.fromStatus} → ` : ''}
                      <span className="font-medium">{STATUS_LABELS[l.toStatus] ?? l.toStatus}</span>
                      <span className="text-slate-500"> · {l.actor}</span>
                      {l.reason && <span className="text-slate-500"> — “{l.reason}”</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
