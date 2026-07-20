'use client'

import { createContext, useContext } from 'react'
import type { Role } from './auth'

export type { Role }

export const ROLE_META: Record<Role, { label: string; email: string; initials: string }> = {
  agency: { label: 'Agencia', email: 'admin@medgram.local', initials: 'AG' },
  doctor: { label: 'Doctor', email: 'doctor@medgram.local', initials: 'DR' },
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
export const useRole = useSession
