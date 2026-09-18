import { NextResponse } from 'next/server'

const accounts = [
  { id: 1, username: 'sales01', password: 'demo123', displayName: '业务员', role: 'SALES' as const },
  { id: 2, username: 'warehouse01', password: 'demo123', displayName: '仓库人员', role: 'WAREHOUSE' as const },
  { id: 3, username: 'manager01', password: 'demo123', displayName: '负责人', role: 'MANAGER' as const },
  { id: 4, username: 'admin', password: 'demo123', displayName: '系统管理员', role: 'MANAGER' as const },
]

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const account = accounts.find((item) => item.username === username && item.password === password)

  if (!account) {
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }

  const { password: _password, ...user } = account
  return NextResponse.json({
    token: `demo-token-${user.id}-${Date.now()}`,
    user,
  })
}
