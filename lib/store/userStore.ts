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
      set({
        user: data.user,
        token: data.token,
        isLoading: false,
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
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
}))

