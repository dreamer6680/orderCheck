import { NextResponse } from 'next/server'

const users = [
  { id: 1, username: 'admin', displayName: '林晓峰', email: 'lin.xiaofeng@qiyun.cn', role: 'MANAGER', status: 'ACTIVE', lastLogin: '2026-09-19 09:42' },
  { id: 2, username: 'li.na', displayName: '李娜', email: 'li.na@qiyun.cn', role: 'SALES', status: 'ACTIVE', lastLogin: '2026-09-19 08:26' },
  { id: 3, username: 'zhang.wei', displayName: '张伟', email: 'zhang.wei@qiyun.cn', role: 'WAREHOUSE', status: 'ACTIVE', lastLogin: '2026-09-18 17:10' },
  { id: 4, username: 'chen.jing', displayName: '陈静', email: 'chen.jing@qiyun.cn', role: 'SALES', status: 'DISABLED', lastLogin: '2026-09-12 14:03' },
]

export async function GET() {
  return NextResponse.json({ users, roles: [
    { id: 'MANAGER', name: '负责人', description: '查看全部数据、用户与系统设置' },
    { id: 'SALES', name: '业务员', description: '管理客户订单与异常订单' },
    { id: 'WAREHOUSE', name: '仓库人员', description: '管理库存与出库任务' },
  ], settings: { companyName: '栖云贸易', timezone: 'Asia/Shanghai', orderAutoCheck: true, lowStockAlert: true, alertThreshold: 10 } })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, ...body, updatedAt: new Date().toISOString() })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, user: { id: Date.now(), ...body, status: 'ACTIVE', lastLogin: '暂无登录记录' } }, { status: 201 })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  return NextResponse.json({ success: true, deletedId: id })
}
