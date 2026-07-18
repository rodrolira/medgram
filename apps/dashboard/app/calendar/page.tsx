'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ContentItem, TYPE_LABELS, getByStatus } from '@/lib/api';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Fecha relevante para el calendario: publicados por publishedAt, programados por scheduledFor. */
function itemDate(item: ContentItem): Date | null {
  const iso =
    item.status === 'published'
      ? item.publishedAt
      : item.status === 'scheduled'
        ? item.scheduledFor
        : null;
  return iso ? new Date(iso) : null;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Semanas (arranca en lunes) que cubren el mes; descarta semanas totalmente fuera del mes. */
function buildMonth(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const weeks: Date[][] = [];
  let cursor = new Date(year, month, 1 - startOffset);
  for (let w = 0; w < 6; w++) {
    const days: Date[] = [];
    for (let d = 0; d < 7; d++) {
      days.push(cursor);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks.filter((week) => week.some((d) => d.getMonth() === month));
}

const CHIP_STYLE: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-800 hover:bg-sky-200',
  published: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
};

export default function CalendarPage() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setView({ y: now.getFullYear(), m: now.getMonth() });
    setToday(dayKey(now));
  }, []);

  useEffect(() => {
    Promise.all([getByStatus('scheduled'), getByStatus('published')])
      .then(([s, p]) => setItems([...s, ...p]))
      .catch((e: Error) => setError(e.message));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const it of items ?? []) {
      const d = itemDate(it);
      if (!d) continue;
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const weeks = useMemo(() => (view ? buildMonth(view.y, view.m) : []), [view]);

  function shiftMonth(delta: number) {
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Calendario de contenido</h1>
        <Link
          href="/generate"
          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + Generar contenido
        </Link>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => shiftMonth(-1)}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <span className="min-w-40 text-center text-sm font-medium capitalize text-slate-700">
          {view ? `${MONTHS[view.m]} ${view.y}` : '—'}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
          aria-label="Mes siguiente"
        >
          →
        </button>
        <button
          onClick={() => {
            const now = new Date();
            setView({ y: now.getFullYear(), m: now.getMonth() });
          }}
          className="rounded-lg px-2.5 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          Hoy
        </button>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Programado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Publicado
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el calendario: {error}
        </div>
      )}

      {!error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>

          {view === null || items === null ? (
            <div className="h-96 animate-pulse bg-slate-100" />
          ) : (
            weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                {week.map((day) => {
                  const inMonth = day.getMonth() === view.m;
                  const key = dayKey(day);
                  const dayItems = byDay.get(key) ?? [];
                  const isToday = key === today;
                  return (
                    <div
                      key={key}
                      className={`min-h-24 border-r border-slate-100 p-1.5 last:border-r-0 ${
                        inMonth ? 'bg-white' : 'bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? 'bg-slate-800 font-semibold text-white'
                            : inMonth
                              ? 'text-slate-700'
                              : 'text-slate-300'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map((it) => (
                          <Link
                            key={it.id}
                            href={`/content/${it.id}`}
                            title={`${TYPE_LABELS[it.type]}: ${it.topic}`}
                            className={`block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight transition ${CHIP_STYLE[it.status] ?? 'bg-slate-100 text-slate-700'}`}
                          >
                            {it.topic}
                          </Link>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="px-1.5 text-[11px] text-slate-400">
                            +{dayItems.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
