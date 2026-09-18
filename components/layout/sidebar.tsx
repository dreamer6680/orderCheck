'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Boxes,
  Truck,
  Settings,
  Users,
  PackageCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/lib/store'

const navItems = [
  { label: '工作台', href: '/', icon: LayoutDashboard, roles: ['SALES', 'WAREHOUSE', 'MANAGER'] },
  { label: '客户订单', href: '/orders', icon: ClipboardList, roles: ['SALES', 'MANAGER'] },
  { label: '异常订单', href: '/abnormal-orders', icon: AlertTriangle, roles: ['SALES', 'MANAGER'] },
  { label: '库存与入库', href: '/inventory', icon: Boxes, roles: ['SALES', 'WAREHOUSE', 'MANAGER'] },
  { label: '待出库任务', href: '/outbound-tasks', icon: Truck, roles: ['WAREHOUSE', 'MANAGER'] },
]

const systemItems = [
  { label: '用户与权限', href: '/users', icon: Users, roles: ['MANAGER'] },
  { label: '系统设置', href: '/settings', icon: Settings, roles: ['MANAGER'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  if (pathname === '/login') return null

  const currentRole = user?.role || 'MANAGER'
  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentRole))
  const mobileNavItems = [...visibleNavItems, ...systemItems.filter((item) => item.roles.includes(currentRole))]
  const visibleSystemItems = systemItems.filter((item) => item.roles.includes(currentRole))

  return (
    <>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <Link href="/" className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6 hover:bg-slate-50">
        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          <PackageCheck size={20} />
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight">栖云贸易</p>
          <p className="text-[11px] text-slate-400">订单库存核查系统</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-3 py-5">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          业务管理
        </p>
        <nav className="flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-slate-900 font-medium text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} data-icon="inline-start" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {visibleSystemItems.length > 0 && (
          <>
            <Separator className="my-6" />
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              系统
            </p>
            <nav className="flex flex-col gap-1">
              {visibleSystemItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${
                      isActive
                        ? 'bg-slate-900 font-medium text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} data-icon="inline-start" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </>
        )}
      </div>

      <div className="m-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#dce8f3] text-xs font-semibold text-slate-700">
          {user?.displayName.charAt(0) || '用'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{user?.displayName || '用户'}</p>
          <p className="text-[11px] text-slate-400">{user?.role === 'SALES' ? '业务员' : user?.role === 'WAREHOUSE' ? '仓库人员' : '负责人'}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
        >
          <LogOut size={14} />
        </Button>
      </div>
    </aside>
    <nav aria-label="移动端主导航" className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-start gap-1 overflow-x-auto border-t border-slate-200 bg-white/95 px-1 pb-safe shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return <Link key={item.label} href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] ${isActive ? 'font-semibold text-slate-900' : 'text-slate-400'}`}><Icon className="size-5" /><span className="truncate">{item.label}</span></Link>
      })}
    </nav>
    </>
  )
}
