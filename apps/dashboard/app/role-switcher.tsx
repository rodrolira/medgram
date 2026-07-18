'use client';

import { Role, ROLE_META, useRole } from '@/lib/session';

const ROLES: Role[] = ['agency', 'doctor'];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-slate-400 sm:inline">Rol:</span>
      <div className="flex rounded-lg border border-slate-200 p-0.5">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              role === r ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {ROLE_META[r].label}
          </button>
        ))}
      </div>
    </div>
  );
}
