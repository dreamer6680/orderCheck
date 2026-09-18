'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, Plus, Search, Filter, Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

const mockOrders = [
  {
    id: 1,
    orderNo: 'SO-20260918024',
    customerName: '杭州云川贸易有限公司',
    status: 'PENDING_CHECK',
    statusLabel: '待核查',
    items: [{ sku: 'AL-CN-024', name: '铝合金连接件', quantity: 240 }],
    createdAt: '2026-09-18 10:42',
  },
  {
    id: 2,
    orderNo: 'SO-20260918023',
    customerName: '上海远洋工业',
    status: 'PENDING_OUTBOUND',
    statusLabel: '待出库',
    items: [{ sku: 'SS-BL-120', name: '不锈钢螺栓', quantity: 1200 }],
    createdAt: '2026-09-18 09:18',
  },
  {
    id: 3,
    orderNo: 'SO-20260918021',
    customerName: '宁波精工制造',
    status: 'ABNORMAL',
    statusLabel: '异常',
    items: [{ sku: 'SE-PA-086', name: '密封圈套装', quantity: 86 }],
    createdAt: '2026-09-17 16:36',
    exceptionReason: '库存不足：密封圈套装 需要86件，可用库存仅42件',
  },
  {
    id: 4,
    orderNo: 'SO-20260918019',
    customerName: '苏州新材料科技',
    status: 'COMPLETED',
    statusLabel: '已完成',
    items: [{ sku: 'CF-FL-048', name: '碳钢法兰', quantity: 48 }],
    createdAt: '2026-09-17 14:05',
  },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING_CHECK: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_OUTBOUND: 'bg-blue-50 text-blue-700 border-blue-200',
    ABNORMAL: 'bg-red-50 text-red-700 border-red-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  const labels: Record<string, string> = {
    PENDING_CHECK: '待核查',
    PENDING_OUTBOUND: '待出库',
    ABNORMAL: '异常',
    COMPLETED: '已完成',
  }
  return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesSearch = `${order.orderNo}${order.customerName}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">客户订单</h1>
            <p className="mt-2 text-sm text-slate-500">管理和核查客户订单库存</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus size={16} data-icon="inline-start" />
                创建订单
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新客户订单</DialogTitle>
                <DialogDescription>输入客户信息和订购商品</DialogDescription>
              </DialogHeader>
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="customer">客户名称</FieldLabel>
                  <Input id="customer" placeholder="输入客户名称" />
                </Field>
                <Field>
                  <FieldLabel>订购商品</FieldLabel>
                  <p className="text-sm text-slate-500">功能开发中...</p>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                <Button className="bg-slate-900 hover:bg-slate-800">创建订单</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6 border-slate-200 shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索订单号、客户名称..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="ALL">全部状态</option>
                  <option value="PENDING_CHECK">待核查</option>
                  <option value="PENDING_OUTBOUND">待出库</option>
                  <option value="ABNORMAL">异常</option>
                  <option value="COMPLETED">已完成</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">订单列表</CardTitle>
            <CardDescription>共 {filteredOrders.length} 个订单</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">订单号</TableHead>
                    <TableHead className="text-xs">客户名称</TableHead>
                    <TableHead className="text-xs">商品信息</TableHead>
                    <TableHead className="text-xs">状态</TableHead>
                    <TableHead className="text-xs">创建时间</TableHead>
                    <TableHead className="text-right text-xs">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-slate-100">
                      <TableCell className="font-mono text-xs font-medium">{order.orderNo}</TableCell>
                      <TableCell className="text-xs text-slate-500">{order.customerName}</TableCell>
                      <TableCell className="text-xs">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-slate-600">
                            {item.name} × {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-xs text-slate-400">{order.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye size={16} />
                            </Button>
                          </DialogTrigger>
                          {selectedOrder && selectedOrder.id === order.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{selectedOrder.orderNo}</DialogTitle>
                                <DialogDescription>{selectedOrder.customerName}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">订购商品</p>
                                  <div className="mt-2 space-y-2">
                                    {selectedOrder.items.map((item, i) => (
                                      <div key={i} className="rounded-lg border border-slate-200 p-3">
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                        <p className="mt-1 text-sm font-semibold">订购数量: {item.quantity}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {selectedOrder.exceptionReason && (
                                  <div className="rounded-lg bg-red-50 p-3">
                                    <p className="text-xs font-medium text-red-700">异常原因</p>
                                    <p className="mt-1 text-xs text-red-600">{selectedOrder.exceptionReason}</p>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                  {selectedOrder.status === 'PENDING_CHECK' && (
                                    <>
                                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">核查库存</Button>
                                      <Button variant="outline" className="flex-1">取消订单</Button>
                                    </>
                                  )}
                                  {selectedOrder.status === 'ABNORMAL' && (
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700">重新核查</Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
