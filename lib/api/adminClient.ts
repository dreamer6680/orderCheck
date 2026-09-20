'use client'

import { can } from '../permissions'
import { useUserStore } from '../store/userStore'

export async function adminFetch<T>(options: RequestInit = {}): Promise<T> {
  const store = useUserStore.getState()
  if (!store.user) store.restoreSession()

  if (!can(useUserStore.getState().user?.role, 'admin:manage')) {
    throw new Error('无权访问系统管理')
  }

  const token = window.localStorage.getItem('token')
  if (!token) throw new Error('请先登录')

  const response = await fetch('/api/admin', {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(response.status === 403 ? '权限不足' : `请求失败（HTTP ${response.status}）`)
  }

  return response.json() as Promise<T>
}
