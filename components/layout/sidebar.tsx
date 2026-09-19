'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ClipboardList, AlertTriangle, Boxes, Truck, Settings, Users, PackageCheck, LogOut, PanelLeftClose, PanelLeftOpen, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/lib/store/userStore'
import { can, type Permission } from '@/lib/permissions'

const navItems: { label: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { label: '工作台', href: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
  { label: '客户订单', href: '/orders', icon: ClipboardList, permission: 'orders:read' },
  { label: '异常订单', href: '/abnormal-orders', icon: AlertTriangle, permission: 'orders:read' },
  { label: '库存一览', href: '/inventory', icon: Boxes, permission: 'inventory:read' },
  { label: '商品管理', href: '/products', icon: PackageCheck, permission: 'products:write' },
  { label: '待出库任务', href: '/outbound-tasks', icon: Truck, permission: 'outbound:read' },
]
const systemItems: { label: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { label: '用户与权限', href: '/users', icon: Users, permission: 'admin:manage' },
  { label: '系统设置', href: '/settings', icon: Settings, permission: 'admin:manage' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const currentRole = user?.role
  const visibleNavItems = navItems.filter((item) => can(currentRole, item.permission))
  const visibleSystemItems = systemItems.filter((item) => can(currentRole, item.permission))

  useEffect(() => {
    document.body.dataset.sidebarCollapsed = String(collapsed)
  }, [collapsed])

  if (pathname === '/login') return null
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const primaryMobileItems = visibleNavItems.slice(0, 4)
  const mobileMoreItems = [...visibleNavItems.slice(4), ...visibleSystemItems]

  const NavLink = ({ item, compact = false }: { item: typeof navItems[number]; compact?: boolean }) => {
    const Icon = item.icon
    return <Link href={item.href} title={compact ? item.label : undefined} className={`flex h-10 items-center rounded-lg text-[13px] transition-colors ${compact ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive(item.href) ? 'bg-slate-900 font-medium text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={16} />{!compact && item.label}</Link>
  }

  return <>
    <aside className={`fixed inset-y-0 left-0 z-20 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? 'w-[72px]' : 'w-[238px]'}`}>
      <Link href="/" title={collapsed ? '栖云贸易' : undefined} className={`flex h-[76px] items-center border-b border-slate-100 hover:bg-slate-50 ${collapsed ? 'justify-center' : 'gap-3 px-6'}`}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><PackageCheck size={20} /></div>
        {!collapsed && <div><p className="text-[15px] font-semibold tracking-tight">栖云贸易</p><p className="text-[11px] text-slate-400">订单库存核查系统</p></div>}
      </Link>
      <div className="flex flex-1 flex-col px-3 py-5">
        {!collapsed && <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">业务管理</p>}
        <nav className="flex flex-col gap-1">{visibleNavItems.map((item) => <NavLink key={item.label} item={item} compact={collapsed} />)}</nav>
        {visibleSystemItems.length > 0 && <><Separator className="my-6" />{!collapsed && <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">系统</p>}<nav className="flex flex-col gap-1">{visibleSystemItems.map((item) => <NavLink key={item.label} item={item} compact={collapsed} />)}</nav></>}
      </div>
      <div className={`m-3 flex items-center rounded-xl bg-slate-50 p-2 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dce8f3] text-xs font-semibold text-slate-700">{user?.displayName.charAt(0) || '用'}</div>
        {!collapsed && <><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{user?.displayName || '用户'}</p><p className="text-[11px] text-slate-400">{user?.role === 'SALES' ? '业务员' : user?.role === 'WAREHOUSE' ? '仓库人员' : user?.role === 'MANAGER' ? '负责人' : '未登录'}</p></div><Button variant="ghost" size="sm" onClick={logout} className="size-6 p-0 text-slate-400 hover:text-red-600"><LogOut size={14} /></Button></>}
      </div>
      <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="mx-3 mb-3 justify-center text-slate-400 hover:text-slate-900">{collapsed ? <PanelLeftOpen /> : <><PanelLeftClose /><span>收起导航</span></>}</Button>
    </aside>

    <nav aria-label="移动端主导航" className="fixed inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-safe shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
      {primaryMobileItems.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${isActive(item.href) ? 'font-semibold text-slate-900' : 'text-slate-400'}`}><Icon className="size-5" /><span>{item.label}</span></Link> })}
      <button type="button" onClick={() => setMobileMoreOpen(!mobileMoreOpen)} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${mobileMoreOpen || mobileMoreItems.some((item) => isActive(item.href)) ? 'font-semibold text-slate-900' : 'text-slate-400'}`}><MoreHorizontal className="size-5" /><span>更多</span></button>
    </nav>
    {mobileMoreOpen && <div className="fixed inset-x-3 bottom-[76px] z-30 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl lg:hidden">{mobileMoreItems.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} onClick={() => setMobileMoreOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${isActive(item.href) ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600'}`}><Icon size={18} />{item.label}</Link> })}</div>}
  </>
}
