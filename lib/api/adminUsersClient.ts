import { apiFetch } from '@/lib/api-client'

// DTOs mirror /api/admin/users until Orval is regenerated from the current backend OpenAPI.
// Never edit lib/api/generated/index.ts by hand.
export type AdminRole = 'MANAGER' | 'SALES' | 'WAREHOUSE'
export interface AdminUser {
  id: number
  username: string
  displayName: string
  role: AdminRole
  enabled: boolean
}
export interface CreateUserRequest {
  username: string
  password: string
  displayName: string
  role: AdminRole
  enabled: boolean
}
export type UpdateUserRequest = Pick<AdminUser, 'displayName' | 'role' | 'enabled'>

export const adminUsersApi = {
  list: () => apiFetch<AdminUser[]>('/api/admin/users?size=200', { cache: 'no-store' }),
  create: (body: CreateUserRequest) =>
    apiFetch<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateUserRequest) =>
    apiFetch<AdminUser>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  resetPassword: (id: number, newPassword: string) =>
    apiFetch<void>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
}
