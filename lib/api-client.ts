const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
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
    return apiFetch<import('./order-store').OrderRecord[]>(`/api/orders?${query}`)
  },
  detail: (id: number) => apiFetch<import('./order-store').OrderRecord>(`/api/orders/${id}`),
  create: (payload: unknown) => apiFetch<import('./order-store').OrderRecord>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  checkInventory: (id: number) => apiFetch<import('./order-store').OrderRecord>(`/api/orders/${id}/check-inventory`, { method: 'POST' }),
  recheckInventory: (id: number) => apiFetch<import('./order-store').OrderRecord>(`/api/orders/${id}/recheck-inventory`, { method: 'POST' }),
  cancel: (id: number) => apiFetch<import('./order-store').OrderRecord>(`/api/orders/${id}/cancel`, { method: 'POST' }),
}
