import { can, type Permission } from './permissions'
import { useUserStore } from './store/userStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/backend'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const permission: Permission = path.startsWith('/api/orders')
    ? (method === 'GET' ? 'orders:read' : 'orders:write')
    : path.startsWith('/api/outbound-records')
      ? (method === 'GET' ? 'outbound:read' : 'outbound:write')
      : 'dashboard:view'
  const userStore = useUserStore.getState()
  if (!userStore.user && typeof window !== 'undefined') userStore.restoreSession()
  if (!can(useUserStore.getState().user?.role, permission)) throw new ApiError('无权执行此操作', 403)
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
  const authorization = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
      ...init?.headers,
    },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body ? String(body.message) : `请求失败（${response.status}）`
    throw new ApiError(message, response.status)
  }
  return body as T
}

export const orderApi = {
  list: (params: { status?: string; keyword?: string; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => value && query.set(key, String(value)))
    return apiFetch<import('./store/orderStore').OrderRecord[]>(`/api/orders?${query}`)
  },
  detail: (id: number) => apiFetch<import('./store/orderStore').OrderRecord>(`/api/orders/${id}`),
  create: (payload: unknown) => apiFetch<import('./store/orderStore').OrderRecord>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  checkInventory: (id: number) => apiFetch<import('./store/orderStore').OrderRecord>(`/api/orders/${id}/check-inventory`, { method: 'POST' }),
  recheckInventory: (id: number) => apiFetch<import('./store/orderStore').OrderRecord>(`/api/orders/${id}/recheck-inventory`, { method: 'POST' }),
  cancel: (id: number) => apiFetch<import('./store/orderStore').OrderRecord>(`/api/orders/${id}/cancel`, { method: 'POST' }),
}
