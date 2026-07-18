'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ContentItem, TYPE_LABELS, generateContent } from '@/lib/api';
import { useRole } from '@/lib/session';

const TYPES: ContentItem['type'][] = ['post', 'carousel', 'reel', 'ad_creative'];

const SUGGESTIONS = [
  '10 tips de higiene dental',
  'Mitos y verdades sobre la hidratación',
  '5 hábitos para cuidar el corazón',
  'Qué es la presión arterial y cómo se controla',
];

export default function GeneratePage() {
  const router = useRouter();
  const { email } = useRole();
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ContentItem['type']>('post');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await generateContent(topic.trim(), type, email);
      if (res.pipeline.passedGate) {
        // Copy conforme -> pending_approval: ir directo a revisarlo.
        router.push(`/content/${res.item.id}`);
      } else {
        // Agotó los reintentos sin pasar el gate: quedó en borrador.
        setNotice(
          `El contenido se generó pero no pasó el chequeo de compliance tras ${res.pipeline.attempts} intento(s); quedó como borrador y no llegó a la cola del doctor.`,
        );
        setBusy(false);
      }
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver a la cola
      </Link>

      <h1 className="mt-3 text-xl font-semibold tracking-tight">Generar contenido</h1>
      <p className="mt-1 text-sm text-slate-500">
        El pipeline redacta el copy respetando las reglas de compliance y, si las cumple, lo envía a
        la cola de aprobación del doctor.
      </p>

      <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="topic" className="mb-1 block text-sm font-medium text-slate-700">
            Tema
          </label>
          <input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={busy}
            autoFocus
            placeholder="Ej.: 10 tips de higiene dental"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTopic(s)}
                disabled={busy}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Formato</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={busy}
                className={`rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                  type === t
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy || topic.trim().length === 0}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Generando…' : 'Generar y enviar a revisión'}
        </button>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {notice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {notice}{' '}
            <Link href="/" className="font-medium underline">
              Ir a la cola
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
