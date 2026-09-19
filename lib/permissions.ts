import type { User } from './store/userStore'

export type Role = User['role']
export type Permission =
  | 'dashboard:view'
  | 'orders:read'
  | 'orders:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'products:read'
  | 'products:write'
  | 'outbound:read'
  | 'outbound:write'
  | 'admin:manage'

const permissions: Record<Role, readonly Permission[]> = {
  SALES: ['dashboard:view', 'orders:read', 'orders:write', 'inventory:read', 'products:read'],
  WAREHOUSE: ['dashboard:view', 'inventory:read', 'inventory:write', 'products:read', 'outbound:read', 'outbound:write'],
  MANAGER: ['dashboard:view', 'orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'products:read', 'products:write', 'outbound:read', 'outbound:write', 'admin:manage'],
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return role != null && permissions[role]?.includes(permission) === true
}

export function routePermission(pathname: string): Permission | null {
  const routes: { path: string; permission: Permission }[] = [
    { path: '/orders', permission: 'orders:read' },
    { path: '/abnormal-orders', permission: 'orders:read' },
    { path: '/outbound-tasks', permission: 'outbound:read' },
    { path: '/inventory', permission: 'inventory:read' },
    { path: '/products', permission: 'products:write' },
    { path: '/settings', permission: 'admin:manage' },
    { path: '/users', permission: 'admin:manage' },
  ]
  return routes.find(({ path }) => pathname === path || pathname.startsWith(path + '/'))?.permission ?? 'dashboard:view'
}
