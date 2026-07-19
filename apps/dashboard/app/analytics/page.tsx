import { getAnalyticsSummary } from '../../lib/api';
import { AnalyticsSummaryClient } from './summary-client';

export const revalidate = 60;

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary(30).catch(() => null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <span className="text-xs text-slate-400">Últimas 30 publicaciones</span>
      </div>

      {summary === null ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No se pudo cargar el resumen. Verifica que la API esté activa.
        </div>
      ) : (
        <AnalyticsSummaryClient summary={summary} />
      )}
    </div>
  );
}
