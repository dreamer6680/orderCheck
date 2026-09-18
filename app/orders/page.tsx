'use client'

import { useEffect, useState, useMemo } from 'react'
import { ChevronRight, Plus, Search, Filter, Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { api } from '@/lib/api/client'
import type { OrderResponse, ProductResponse } from '@/lib/api/generated'

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
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await api.listOrders({
        keyword: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter as 'PENDING_CHECK' | 'PENDING_OUTBOUND' | 'COMPLETED' | 'ABNORMAL' | 'CANCELLED',
      })
      setOrders(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 250)
    return () => window.clearTimeout(timer)
  }, [search, statusFilter])

  useEffect(() => {
    api.listProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const filteredOrders = useMemo(() => orders, [orders])

  const createOrder = async () => {
    const selectedProductId = Number(productId)
    const orderedQuantity = Number(quantity)
    if (!customerName.trim() || !selectedProductId || orderedQuantity <= 0) return
    await api.createOrder({
      customerName: customerName.trim(),
      items: [{ productId: selectedProductId, orderedQuantity }],
    })
    setIsCreateOpen(false)
    setCustomerName('')
    setProductId('')
    setQuantity('1')
    await loadOrders()
  }

  const runOrderAction = async (action: 'check' | 'recheck' | 'cancel', order: OrderResponse) => {
    if (!order.id) return
    if (action === 'check') await api.checkOrder(order.id)
    if (action === 'recheck') await api.recheckOrder(order.id)
    if (action === 'cancel') await api.cancelOrder(order.id)
    setSelectedOrder(null)
    await loadOrders()
  }

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
                  <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="输入客户名称" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="product">订购商品</FieldLabel>
                  <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">选择商品</option>
                    {products.filter((product) => product.id).map((product) => (
                      <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="quantity">订购数量</FieldLabel>
                  <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void createOrder()} disabled={!customerName.trim() || !productId || Number(quantity) <= 0}>创建订单</Button>
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
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {loading && <p className="mb-4 text-sm text-slate-400">正在加载订单...</p>}
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
                        {(order.items ?? []).map((item, i) => (
                          <div key={i} className="text-slate-600">
                            {item.productName} × {item.orderedQuantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell><StatusBadge status={order.status ?? "PENDING_CHECK"} /></TableCell>
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
                                    {(selectedOrder.items ?? []).map((item, i) => (
                                      <div key={i} className="rounded-lg border border-slate-200 p-3">
                                        <p className="text-sm font-medium">{item.productName}</p>
                                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                        <p className="mt-1 text-sm font-semibold">订购数量: {item.orderedQuantity}</p>
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
                                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => void runOrderAction("check", selectedOrder)}>核查库存</Button>
                                      <Button variant="outline" className="flex-1" onClick={() => void runOrderAction("cancel", selectedOrder)}>取消订单</Button>
                                    </>
                                  )}
                                  {selectedOrder.status === 'ABNORMAL' && (
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => void runOrderAction("recheck", selectedOrder)}>重新核查</Button>
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
