'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { can, routePermission } from '@/lib/permissions'
import { useUserStore } from '@/lib/store/userStore'

export function AccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const restoreSession = useUserStore((state) => state.restoreSession)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    restoreSession()
    setReady(true)
  }, [restoreSession])

  const permission = routePermission(pathname)
  const allowed = pathname === '/login' || can(user?.role, permission ?? 'dashboard:view')

  useEffect(() => {
    if (!ready || pathname === '/login' || allowed) return
    router.replace(user ? '/' : '/login')
  }, [ready, pathname, allowed, user, router])

  if (pathname === '/login') return <>{children}</>
  if (!ready) return <main className="p-8 text-sm text-slate-500">正在验证登录状态...</main>
  if (!allowed) return <main className="p-8 text-sm text-slate-500">无权访问此页面，正在跳转...</main>
  return <>{children}</>
}
