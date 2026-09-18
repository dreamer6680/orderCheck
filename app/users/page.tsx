'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, ShieldCheck, MoreHorizontal, UserRound, CheckCircle2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotificationStore } from '@/lib/store'

type AdminUser = { id:number; username:string; displayName:string; email:string; role:string; status:string; lastLogin:string }
const roleNames: Record<string,string> = { MANAGER:'负责人', SALES:'业务员', WAREHOUSE:'仓库人员' }

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const addNotification = useNotificationStore((s) => s.addNotification)
  useEffect(() => { fetch('/api/admin').then((r) => r.json()).then((d) => setUsers(d.users)).finally(() => setLoading(false)) }, [])
  const filtered = users.filter((u) => `${u.displayName}${u.email}${roleNames[u.role]}`.toLowerCase().includes(query.toLowerCase()))
  const toggleStatus = async (user: AdminUser) => { const status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'; await fetch('/api/admin', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:user.id, status }) }); setUsers((prev) => prev.map((u) => u.id === user.id ? {...u, status} : u)); addNotification('success', `${user.displayName} 已${status === 'ACTIVE' ? '启用' : '停用'}`) }
  return <main className="min-h-screen bg-[#f7f8fa] px-4 pb-24 pt-6 sm:px-8 lg:ml-[238px] lg:px-10 lg:pb-10 lg:pt-9"><div className="mx-auto max-w-6xl"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">系统管理 / 权限中心</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">用户与权限</h1><p className="mt-1 text-sm text-slate-500">管理员可以查看并管理所有系统用户</p></div><Button className="w-full sm:w-auto"><Plus data-icon="inline-start" />新增用户</Button></div><div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-slate-500">用户总数</p><p className="mt-2 text-2xl font-semibold">{users.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-slate-500">正常使用</p><p className="mt-2 text-2xl font-semibold text-emerald-600">{users.filter(u=>u.status==='ACTIVE').length}</p></CardContent></Card><Card className="col-span-2 sm:col-span-1"><CardContent className="p-4"><p className="text-xs text-slate-500">角色数量</p><p className="mt-2 text-2xl font-semibold">3</p></CardContent></Card></div><Card><CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between"><CardTitle>用户列表</CardTitle><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 size-4 text-slate-400"/><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="搜索姓名、邮箱或角色" className="pl-9"/></div></CardHeader><CardContent className="p-0">{loading ? <div className="p-8 text-center text-sm text-slate-400">正在加载用户数据...</div> : <div className="divide-y">{filtered.map((user)=><div key={user.id} className="flex flex-col gap-4 p-4 sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_auto] sm:items-center sm:px-6"><div className="flex items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{user.displayName[0]}</div><div><p className="text-sm font-medium">{user.displayName}</p><p className="text-xs text-slate-400">{user.email}</p></div></div><div className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck className="size-4 text-slate-400"/>{roleNames[user.role]}</div><div className="flex items-center justify-between text-xs text-slate-400 sm:block"><span>最近登录 {user.lastLogin}</span><Badge variant={user.status==='ACTIVE'?'secondary':'outline'} className="ml-3">{user.status==='ACTIVE'?'正常':'已停用'}</Badge></div><Button variant="ghost" size="sm" onClick={()=>toggleStatus(user)} className="justify-start text-xs text-slate-500">{user.status==='ACTIVE'?<UserX data-icon="inline-start"/>:<CheckCircle2 data-icon="inline-start"/>}{user.status==='ACTIVE'?'停用账号':'启用账号'}<MoreHorizontal className="ml-auto size-4 sm:hidden"/></Button></div>)}</div>}</CardContent></Card></div></main>
}
