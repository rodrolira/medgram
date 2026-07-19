'use client';

import { useState } from 'react';
import type { AnalyticsSummary } from '../../lib/api';
import { refreshAnalytics, TYPE_LABELS } from '../../lib/api';

const METRIC_LABELS: Record<string, string> = {
  impressions: 'Impresiones',
  reach: 'Alcance',
  likes: 'Likes',
  comments: 'Comentarios',
  shares: 'Compartidos',
  saved: 'Guardados',
};

export function AnalyticsSummaryClient({ summary }: { summary: AnalyticsSummary }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshAnalytics();
      setRefreshResult(result);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {summary.totals[key as keyof typeof summary.totals].toLocaleString('es-CL')}
            </p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Publicados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalPublished}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Con datos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.withAnalytics}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Engagement promedio</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">
            {summary.avgEngagementRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top posts */}
      {summary.topPosts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-700">Top 5 publicaciones</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {summary.topPosts.map((post, i) => (
              <li key={post.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-5 text-center text-sm font-medium text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{post.topic}</p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABELS[post.type as keyof typeof TYPE_LABELS] ?? post.type}
                    {post.publishedAt &&
                      ` · ${new Date(post.publishedAt).toLocaleDateString('es-CL')}`}
                  </p>
                </div>
                <div className="flex gap-4 text-right text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {post.reach.toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs text-slate-400">alcance</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">
                      {post.engagementRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">engagement</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? 'Actualizando…' : 'Actualizar desde Meta'}
        </button>
        {refreshResult && (
          <p className="text-sm text-slate-500">
            {refreshResult.success}/{refreshResult.total} actualizados
            {refreshResult.failed > 0 && `, ${refreshResult.failed} fallaron`}
          </p>
        )}
      </div>
    </div>
  );
}
