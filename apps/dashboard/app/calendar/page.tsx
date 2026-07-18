'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ContentItem, STATUS_LABELS, TYPE_LABELS, getCalendarItems } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-amber-400',
  scheduled: 'bg-blue-400',
  published: 'bg-emerald-400',
};

const STATUS_PILL: Record<string, string> = {
  approved: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function itemDate(item: ContentItem): string {
  const raw = item.scheduledFor ?? item.approvedAt ?? item.createdAt;
  return raw.slice(0, 10);
}

function buildGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCalendarItems()
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const item of items) {
      const key = itemDate(item);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const selectedItems = selectedDay ? (byDate[selectedDay] ?? []) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Calendario</h1>
        {!loading && !error && (
          <span className="text-sm text-slate-500">
            {items.length} publicación{items.length !== 1 ? 'es' : ''} (aprobadas · programadas · publicadas)
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} — ¿Está corriendo la API?
        </div>
      )}

      {/* Month nav */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          ‹
        </button>
        <span className="min-w-[160px] text-center text-sm font-medium text-slate-800">
          {MONTH_LABELS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          ›
        </button>
        <button
          onClick={() => {
            setYear(now.getFullYear());
            setMonth(now.getMonth());
            setSelectedDay(null);
          }}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
        >
          Hoy
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DOW_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[72px] border-b border-r border-slate-100 bg-slate-50/50"
                />
              );
            }
            const key = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayItems = byDate[key] ?? [];
            const isToday = key === today;
            const isSelected = key === selectedDay;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`min-h-[72px] border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-slate-50 ${
                  isSelected ? 'bg-slate-100' : ''
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? 'bg-slate-800 text-white' : 'text-slate-600'
                  }`}
                >
                  {day}
                </span>
                {loading && (
                  <div className="mt-1 h-1.5 w-8 animate-pulse rounded bg-slate-200" />
                )}
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayItems.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className={`h-2 w-2 rounded-full ${STATUS_COLOR[item.status] ?? 'bg-slate-300'}`}
                      title={item.topic}
                    />
                  ))}
                  {dayItems.length > 5 && (
                    <span className="text-[10px] text-slate-400">+{dayItems.length - 5}</span>
                  )}
                </div>
                {dayItems.length > 0 && (
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {dayItems.length} post{dayItems.length !== 1 ? 's' : ''}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {(['approved', 'scheduled', 'published'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s]}`} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-800">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
          </div>
          {selectedItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Sin publicaciones este día
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selectedItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_PILL[item.status] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.topic}</p>
                    <p className="text-xs text-slate-400">
                      {TYPE_LABELS[item.type]} ·{' '}
                      {item.scheduledFor
                        ? new Date(item.scheduledFor).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Sin horario definido'}
                    </p>
                  </div>
                  <Link
                    href={`/content/${item.id}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Ver →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
