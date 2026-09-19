'use client'

import { create } from 'zustand'
import type { User } from './authStore'

export interface AdminUser extends User {
  email: string
  status: 'ACTIVE' | 'DISABLED'
  lastLogin: string
}

interface UserState {
  users: AdminUser[]
  selectedUserId: number | null
  setUsers: (users: AdminUser[]) => void
  selectUser: (id: number | null) => void
  updateUserStatus: (id: number, status: AdminUser['status']) => void
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  selectedUserId: null,
  setUsers: (users) => set({ users }),
  selectUser: (selectedUserId) => set({ selectedUserId }),
  updateUserStatus: (id, status) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, status } : user) })),
}))
