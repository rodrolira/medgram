'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DailyGenerationItem, DailyGenerationResult, STATUS_LABELS, triggerDailyGeneration } from '@/lib/api';
import { SLOT_LABELS } from '@/lib/slots';

const STATUS_BADGE: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  error: 'bg-red-100 text-red-700',
};

function ItemRow({ item }: { item: DailyGenerationItem }) {
  const isError = item.status === 'error';
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
        {item.slot}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{item.topic}</p>
        <p className="text-xs text-slate-400">{SLOT_LABELS[item.slot] ?? `Slot ${item.slot}`}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status] ?? 'bg-slate-100 text-slate-600'}`}
      >
        {STATUS_LABELS[item.status] ?? item.status}
      </span>
      {!isError && (
        <Link
          href={`/content/${item.id}`}
          className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Ver →
        </Link>
      )}
    </li>
  );
}

export default function DailyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DailyGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function trigger() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await triggerDailyGeneration(date);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver a la cola
      </Link>

      <h1 className="mt-3 text-xl font-semibold tracking-tight">Generación diaria</h1>
      <p className="mt-1 text-sm text-slate-500">
        Genera los 5 posts de reumatología del día desde el pool rotativo. Los que pasen el
        chequeo de compliance van directo a la cola de aprobación del doctor.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
            Fecha
          </label>
          <input
            id="date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
            className="rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={trigger}
          disabled={busy || !date}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Generando…' : 'Generar 5 publicaciones'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} — ¿Está corriendo la API?
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-500">
              Fecha: <strong className="text-slate-800">{result.date}</strong>
            </span>
            <span className="text-amber-700">
              En aprobación: <strong>{result.pending}</strong>
            </span>
            {result.drafts > 0 && (
              <span className="text-slate-500">
                Borradores: <strong>{result.drafts}</strong>
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {result.items.map((item) => (
              <ItemRow key={`${item.slot}-${item.id}`} item={item} />
            ))}
          </ul>
          {result.pending > 0 && (
            <div className="mt-4">
              <Link
                href="/"
                className="inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Ver cola de aprobación →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
