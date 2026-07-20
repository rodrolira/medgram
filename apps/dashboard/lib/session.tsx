'use client'

import { createContext, useContext } from 'react'
import type { Role } from './auth'

export const ROLE_META: Record<Role, { label: string; initials: string }> = {
  agency: { label: 'Agencia', initials: 'AG' },
  doctor: { label: 'Doctor', initials: 'DR' },
}

interface SessionContextValue {
  role: Role
  email: string
}

const SessionContext = createContext<SessionContextValue>({
  role: 'doctor',
  email: 'doctor@medgram.local',
})

export function SessionProvider({
  role,
  email,
  children,
}: {
  role: Role
  email: string
  children: React.ReactNode
}) {
  return <SessionContext.Provider value={{ role, email }}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
