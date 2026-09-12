// Who is signed in, for the whole app. The token is kept in localStorage so a
// reload does not sign you out, but it is checked against the server on start:
// a token that has been revoked or has expired is discarded rather than
// trusted.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode
} from 'react'
import { api, setToken } from '../api/client'
import type { Account } from '../api/types'

const STORAGE_KEY = 'bookstore.token'

interface AuthValue {
  account: Account | null
  /** True until the stored token has been checked, so pages can wait. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const readStoredToken = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const storeToken = (value: string | null): void => {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing can refuse storage; the session just will not survive
    // a reload, which is not worth failing the sign in over.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStoredToken()
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    api.me()
      .then(setAccount)
      .catch(() => {
        // Expired or revoked: clear it instead of leaving a dead token around.
        setToken(null)
        storeToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const adopt = useCallback((session: { account: Account; token: string }) => {
    setToken(session.token)
    storeToken(session.token)
    setAccount(session.account)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    adopt(await api.login(email, password))
  }, [adopt])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    adopt(await api.register(fullName, email, password))
  }, [adopt])

  const signOut = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      // Even if the call fails, this browser should stop believing it is signed in.
      setToken(null)
      storeToken(null)
      setAccount(null)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ account, loading, signIn, register, signOut }),
    [account, loading, signIn, register, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside an AuthProvider')
  return value
}
