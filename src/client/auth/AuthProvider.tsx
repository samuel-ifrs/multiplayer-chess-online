import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { PublicUser } from '@shared/types'
import { api } from '../api'

interface AuthContextValue {
  user: PublicUser | null
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser | null
  children: ReactNode
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser)

  const value = useMemo<AuthContextValue>(() => {
    const handle = async (
      fn: (u: string, p: string) => ReturnType<typeof api.login>,
      username: string,
      password: string,
    ) => {
      try {
        const res = await fn(username, password)
        if (res.ok && res.data.user) {
          setUser(res.data.user)
          try {
            localStorage.setItem('chess.lastUsername', res.data.user.username)
          } catch {
            /* ignore */
          }
          return { ok: true }
        }
        return { ok: false, error: res.data.error ?? 'auth_err_generic' }
      } catch {
        return { ok: false, error: 'auth_err_generic' }
      }
    }
    return {
      user,
      login: (u, p) => handle(api.login, u, p),
      register: (u, p) => handle(api.register, u, p),
      logout: async () => {
        await api.logout().catch(() => undefined)
        setUser(null)
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
