'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Pencil, Plus, RefreshCw, Search, ShieldCheck, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { adminUsersApi, type AdminRole, type AdminUser } from '@/lib/api/adminUsersClient'

const roleNames: Record<AdminRole, string> = {
  MANAGER: '负责人', SALES: '业务员', WAREHOUSE: '仓库人员',
}
type Draft = {
  username: string
  displayName: string
  password: string
  role: AdminRole
  enabled: boolean
}
const emptyDraft = (): Draft => ({
  username: '', displayName: '', password: '', role: 'SALES', enabled: true,
})

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<'create' | number | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [resetFor, setResetFor] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await adminUsersApi.list())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const filtered = useMemo(() => users.filter((user) =>
    `${user.username}${user.displayName}${roleNames[user.role]}`
      .toLowerCase().includes(query.trim().toLowerCase())
  ), [users, query])

  const openCreate = () => {
    setDraft(emptyDraft())
    setError('')
    setEditor('create')
  }
  const openEdit = (user: AdminUser) => {
    setDraft({ username: user.username, displayName: user.displayName,
      password: '', role: user.role, enabled: user.enabled })
    setError('')
    setEditor(user.id)
  }
  const saveUser = async () => {
    if (editor === null || saving || !draft.displayName.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editor === 'create') {
        if (!/^[A-Za-z0-9._-]{3,50}$/.test(draft.username) || draft.password.length < 8) {
          throw new Error('用户名须为 3–50 位字母、数字或 ._-，密码至少 8 位')
        }
        await adminUsersApi.create({
          username: draft.username.trim(),
          displayName: draft.displayName.trim(),
          password: draft.password,
          role: draft.role,
          enabled: draft.enabled,
        })
      } else {
        await adminUsersApi.update(editor, {
          displayName: draft.displayName.trim(), role: draft.role, enabled: draft.enabled,
        })
      }
      setEditor(null)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存用户失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user: AdminUser) => {
    setBusyId(user.id)
    setError('')
    try {
      const updated = await adminUsersApi.update(user.id, {
        displayName: user.displayName, role: user.role, enabled: !user.enabled,
      })
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改账号状态失败')
    } finally {
      setBusyId(null)
    }
  }

  const submitResetPassword = async () => {
    if (!resetFor || newPassword.length < 8 || saving) return
    setSaving(true)
    setError('')
    try {
      await adminUsersApi.resetPassword(resetFor.id, newPassword)
      setResetFor(null)
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-10 lg:pt-9">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">系统管理 / 权限中心</p>
            <h1 className="mt-2 text-2xl font-semibold">用户与权限</h1>
            <p className="mt-1 text-sm text-slate-500">用户数据来自后端 /api/admin/users</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
              <RefreshCw className="size-4" />刷新
            </Button>
            <Button onClick={openCreate}><Plus className="size-4" />新增用户</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">用户总数</p><p className="mt-2 text-2xl font-semibold">{users.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">正常使用</p><p className="mt-2 text-2xl font-semibold">{users.filter(user => user.enabled).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">角色数量</p><p className="mt-2 text-2xl font-semibold">{new Set(users.map(user => user.role)).size}</p></CardContent></Card>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b">
            <CardTitle>用户列表</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索用户名、姓名或角色" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="flex items-center gap-2 p-8 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />正在加载用户数据...</p> :
              filtered.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">暂无符合条件的用户</p> :
                <div className="divide-y">
                  {filtered.map(user => (
                    <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-slate-500">@{user.username}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-slate-400" />{roleNames[user.role]}</div>
                      <Badge variant={user.enabled ? 'secondary' : 'outline'}>{user.enabled ? '正常' : '已停用'}</Badge>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)}><Pencil className="size-4" />编辑</Button>
                        <Button variant="outline" size="sm" onClick={() => { setResetFor(user); setNewPassword(''); setError('') }}>重置密码</Button>
                        <Button variant="ghost" size="sm" disabled={busyId !== null} onClick={() => void toggleStatus(user)}>
                          {user.enabled ? <UserX className="size-4" /> : <CheckCircle2 className="size-4" />}
                          {user.enabled ? '停用' : '启用'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>}
          </CardContent>
        </Card>
        <Dialog open={editor !== null} onOpenChange={open => { if (!open && !saving) setEditor(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editor === 'create' ? '新增用户' : '编辑用户'}</DialogTitle>
              <DialogDescription>角色与启停状态将写入后端数据库。</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">用户名
                <Input value={draft.username} disabled={editor !== 'create'} maxLength={50}
                  onChange={event => setDraft(previous => ({ ...previous, username: event.target.value }))} />
              </label>
              <label className="block space-y-1 text-sm">显示名称
                <Input value={draft.displayName} maxLength={100}
                  onChange={event => setDraft(previous => ({ ...previous, displayName: event.target.value }))} />
              </label>
              {editor === 'create' && <label className="block space-y-1 text-sm">初始密码（至少 8 位）
                <Input type="password" value={draft.password} autoComplete="new-password"
                  onChange={event => setDraft(previous => ({ ...previous, password: event.target.value }))} />
              </label>}
              <label className="block space-y-1 text-sm">角色
                <select className="w-full rounded-md border border-slate-200 bg-white p-2" value={draft.role}
                  onChange={event => setDraft(previous => ({ ...previous, role: event.target.value as AdminRole }))}>
                  {Object.entries(roleNames).map(([role, name]) => <option key={role} value={role}>{name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.enabled}
                  onChange={event => setDraft(previous => ({ ...previous, enabled: event.target.checked }))} />启用账号
              </label>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setEditor(null)}>取消</Button>
              <Button disabled={saving || !draft.displayName.trim() || (editor === 'create' && (!draft.username.trim() || draft.password.length < 8))}
                onClick={() => void saveUser()}>{saving ? '保存中...' : '保存'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={resetFor !== null} onOpenChange={open => { if (!open && !saving) setResetFor(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重置用户密码</DialogTitle>
              <DialogDescription>{resetFor?.displayName} · @{resetFor?.username}</DialogDescription>
            </DialogHeader>
            <label className="block space-y-2 text-sm">新密码（至少 8 位）
              <Input type="password" value={newPassword} autoComplete="new-password"
                onChange={event => setNewPassword(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setResetFor(null)}>取消</Button>
              <Button disabled={saving || newPassword.length < 8} onClick={() => void submitResetPassword()}>
                {saving ? '提交中...' : '确认重置'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
