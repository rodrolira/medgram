'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ContentItem,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  getByStatus,
  getPending,
} from '@/lib/api';
import { useSession } from '@/lib/session';

const TYPE_STYLES: Record<string, string> = {
  post: 'bg-sky-100 text-sky-700',
  carousel: 'bg-violet-100 text-violet-700',
  reel: 'bg-rose-100 text-rose-700',
  ad_creative: 'bg-orange-100 text-orange-700',
};

const TABS: { key: string; label: string }[] = [
  { key: 'pending_approval', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'scheduled', label: 'Programados' },
  { key: 'published', label: 'Publicados' },
  { key: 'needs_changes', label: 'Cambios' },
  { key: 'rejected', label: 'Rechazados' },
];

const EMPTY_HINT: Record<string, string> = {
  pending_approval: 'Cuando el pipeline genere un borrador que pase el chequeo, aparecerá acá.',
  approved: 'Los contenidos aprobados por el doctor, listos para programar, aparecen acá.',
  scheduled: 'Los contenidos en cola de publicación aparecen acá.',
  published: 'El historial de contenidos publicados aparece acá.',
  needs_changes: 'Contenidos que el doctor devolvió con comentarios.',
  rejected: 'Contenidos rechazados por el doctor.',
};

export default function QueuePage() {
  const { role } = useSession();
  const [status, setStatus] = useState<string>('pending_approval');
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(null);
    setError(null);
    // Los pendientes traen el checklist (para el badge de advertencias); el resto no lo necesita.
    const load = status === 'pending_approval' ? getPending() : getByStatus(status);
    load.then(setItems).catch((e: Error) => setError(e.message));
  }, [status]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Contenido</h1>
        {role === 'agency' && (
          <Link
            href="/generate"
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            + Generar contenido
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              status === t.key
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
            {status === t.key && items ? ` (${items.length})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar: {error}. ¿Está corriendo la API en el puerto 3001?
        </div>
      )}

      {!error && items === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">
            Nada en “{STATUS_LABELS[status] ?? status}”
          </p>
          <p className="mt-1 text-sm text-slate-500">{EMPTY_HINT[status]}</p>
          {status === 'pending_approval' && role === 'agency' && (
            <Link
              href="/generate"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Generar el primero
            </Link>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => {
            const warnings = (item.complianceChecks ?? []).filter((c) => !c.passed).length;
            const stamp =
              item.status === 'published' && item.publishedAt
                ? item.publishedAt
                : item.status === 'scheduled' && item.scheduledFor
                  ? item.scheduledFor
                  : item.createdAt;
            return (
              <li key={item.id}>
                <Link
                  href={`/content/${item.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    {warnings > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {warnings} advertencia{warnings > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400">{formatDate(stamp)}</span>
                  </div>
                  <p className="mt-2 font-medium text-slate-900">{item.topic}</p>
                  {item.generatedCopy && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.generatedCopy}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
