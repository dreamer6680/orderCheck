'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

const mockAbnormalOrders = [
  {
    id: 1,
    orderNo: 'SO-20260918021',
    customerName: '宁波精工制造',
    items: [{ sku: 'SE-PA-086', name: '密封圈套装', ordered: 86, available: 42, shortage: 44 }],
    exceptionReason: '库存不足：密封圈套装 需要86件，可用库存仅42件，缺货44件',
    createdAt: '2026-09-17 16:36',
  },
  {
    id: 2,
    orderNo: 'SO-20260918015',
    customerName: '江苏工业集团',
    items: [
      { sku: 'AL-CN-024', name: '铝合金连接件', ordered: 500, available: 180, shortage: 320 },
      { sku: 'SS-BL-120', name: '不锈钢螺栓', ordered: 600, available: 150, shortage: 450 },
    ],
    exceptionReason: '多个商品库存不足：铝合金连接件 缺货320件；不锈钢螺栓 缺货450件',
    createdAt: '2026-09-17 14:22',
  },
]

export default function AbnormalOrdersPage() {
  const [search, setSearch] = useState('')
  const [isRecheckOpen, setIsRecheckOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<typeof mockAbnormalOrders[0] | null>(null)

  const filteredOrders = useMemo(() => {
    return mockAbnormalOrders.filter((order) =>
      `${order.orderNo}${order.customerName}`.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search])

  const handleRecheck = (order: typeof mockAbnormalOrders[0]) => {
    setSelectedOrder(order)
    setIsRecheckOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">异常订单</h1>
              <p className="mt-1 text-sm text-slate-500">库存不足或出库差异订单处理</p>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="border-slate-200 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <AlertTriangle size={24} className="text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-slate-900">暂无异常订单</p>
              <p className="mt-1 text-sm text-slate-500">保持库存充足，所有订单运行顺畅</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6 border-slate-200 shadow-none">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索订单号、客户名称..."
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-slate-200 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">{order.orderNo}</CardTitle>
                        <CardDescription>{order.customerName}</CardDescription>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">
                        异常
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-xs text-red-700">
                        {order.exceptionReason}
                      </AlertDescription>
                    </Alert>

                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-900">缺货商品明细</p>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">订购 / 可用 / 缺货</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                  {item.ordered} / {item.available} / <span className="text-red-600">{item.shortage}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="bg-emerald-500"
                                style={{ width: `${(item.available / item.ordered) * 100}%` }}
                              />
                              <div
                                className="bg-red-500"
                                style={{ width: `${(item.shortage / item.ordered) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
                      <span>创建于 {order.createdAt}</span>
                      <Dialog open={isRecheckOpen && selectedOrder?.id === order.id} onOpenChange={setIsRecheckOpen}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleRecheck(order)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <RefreshCw size={16} data-icon="inline-start" />
                            重新核查库存
                          </Button>
                        </DialogTrigger>
                        {selectedOrder?.id === order.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>重新核查库存</DialogTitle>
                              <DialogDescription>
                                系统将重新检查 {selectedOrder.items.length} 件商品的库存
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              {selectedOrder.items.map((item, i) => (
                                <div key={i} className="rounded-lg border border-slate-200 p-3">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <p className="text-slate-500">订购</p>
                                      <p className="font-semibold">{item.ordered}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">可用</p>
                                      <p className="font-semibold">{item.available}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">缺货</p>
                                      <p className="font-semibold text-red-600">{item.shortage}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsRecheckOpen(false)}>
                                取消
                              </Button>
                              <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setIsRecheckOpen(false)}>
                                确认重新核查
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
