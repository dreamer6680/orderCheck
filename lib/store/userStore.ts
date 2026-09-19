import { api } from '../api/client'
import { create } from 'zustand'

export interface User {
  id: number
  username: string
  displayName: string
  role: 'SALES' | 'WAREHOUSE' | 'MANAGER'
}

export interface UserState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setError: (error: string | null) => void
  hasRole: (role: User['role']) => boolean
  restoreSession: () => void
  verifySession: () => Promise<boolean>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.login({ username, password })
      const account = data.user
      if (!data.token || !account ||
          typeof account.id !== 'number' ||
          typeof account.username !== 'string' ||
          typeof account.displayName !== 'string' ||
          !['SALES', 'WAREHOUSE', 'MANAGER'].includes(String(account.role))) {
        throw new Error('登录服务返回的用户信息无效')
      }
      const user: User = {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        role: account.role!,
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token: data.token, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  setError: (error: string | null) => {
    set({ error })
  },

  hasRole: (role) => get().user?.role === role,

  verifySession: async () => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('token')
    if (!token) {
      set({ user: null, token: null })
      return false
    }
    try {
      const response = await fetch('/backend/api/auth/me', {
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`Session verification failed: ${response.status}`)
      const user: unknown = await response.json()
      if (typeof user !== 'object' || user === null ||
          !('id' in user) || typeof user.id !== 'number' ||
          !('username' in user) || typeof user.username !== 'string' ||
          !('displayName' in user) || typeof user.displayName !== 'string' ||
          !('role' in user) || !['SALES', 'WAREHOUSE', 'MANAGER'].includes(String(user.role))) {
        throw new Error('Invalid current-user response')
      }
      set({ token, user: user as User })
      localStorage.setItem('user', JSON.stringify(user))
      return true
    } catch {
      set({ user: null, token: null })
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return false
    }
  },

  restoreSession: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (!token || !savedUser) return
    try {
      const user: unknown = JSON.parse(savedUser)
      if (
        typeof user !== 'object' || user === null ||
        !('id' in user) || typeof user.id !== 'number' ||
        !('username' in user) || typeof user.username !== 'string' ||
        !('displayName' in user) || typeof user.displayName !== 'string' ||
        !('role' in user) || !['SALES', 'WAREHOUSE', 'MANAGER'].includes(String(user.role))
      ) throw new Error('Invalid saved user')
      set({ token, user: user as User })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null })
    }
  },
}))

