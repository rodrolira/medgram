'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'agency' | 'doctor';

export const ROLE_META: Record<Role, { label: string; email: string; initials: string }> = {
  agency: { label: 'Agencia', email: 'admin@medgram.local', initials: 'AG' },
  doctor: { label: 'Doctor', email: 'doctor@medgram.local', initials: 'DR' },
};

interface RoleContextValue {
  role: Role;
  email: string;
  setRole: (r: Role) => void;
  ready: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'doctor',
  email: ROLE_META.doctor.email,
  setRole: () => undefined,
  ready: false,
});

const STORAGE_KEY = 'medgram-role';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('doctor');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'agency' || saved === 'doctor') setRoleState(saved);
    setReady(true);
  }, []);

  const setRole = (r: Role) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };

  return (
    <RoleContext.Provider value={{ role, email: ROLE_META[role].email, setRole, ready }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
