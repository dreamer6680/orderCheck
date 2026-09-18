'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/api/client'

const DEMO_ACCOUNTS = [
  { username: 'sales01', password: 'demo123', name: '业务员', role: 'SALES' },
  { username: 'warehouse01', password: 'demo123', name: '仓库人员', role: 'WAREHOUSE' },
  { username: 'manager01', password: 'demo123', name: '负责人', role: 'MANAGER' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await api.login({ username, password })

      if (!data?.user || !data?.token) {
        throw new Error('登录服务返回了无效数据')
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(account.username)
    setPassword(account.password)
  }

  return (
    <div className="login-page min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <PackageCheck size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">栖云贸易</h1>
            <p className="mt-1 text-sm text-slate-500">订单库存核查系统</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>登录账户</CardTitle>
            <CardDescription>输入用户名和密码登录系统</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">用户名</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="输入用户名"
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </Field>
              </FieldGroup>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">演示账号</span>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                >
                  <p className="text-sm font-medium text-slate-900">{account.name}</p>
                  <p className="text-xs text-slate-500">{account.username} · {account.role}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          演示系统 · 请勿用于生产环境
        </p>
      </div>
    </div>
  )
}
