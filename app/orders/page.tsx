'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, Plus, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOrderStore, type OrderStatus } from '@/lib/store/orderStore'
import { api } from '@/lib/api/client'
import type { ProductResponse } from '@/lib/api/generated'

const statusLabels: Record<OrderStatus, string> = { PENDING_CHECK: '待核查', PENDING_OUTBOUND: '待出库', ABNORMAL: '异常', COMPLETED: '已完成' }
const statusStyles: Record<OrderStatus, string> = { PENDING_CHECK: 'border-amber-200 bg-amber-50 text-amber-700', PENDING_OUTBOUND: 'border-blue-200 bg-blue-50 text-blue-700', ABNORMAL: 'border-red-200 bg-red-50 text-red-700', COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700' }

function StatusBadge({ status }: { status: OrderStatus }) { return <Badge variant="outline" className={statusStyles[status]}>{statusLabels[status]}</Badge> }

export default function OrdersPage() {
  const { orders, isLoading, error, hasLoaded, loadOrders, createOrder, selectedOrderId, selectOrder, checkInventory, cancelOrder } = useOrderStore()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [customerName, setCustomerName] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const selectedOrder = orders.find((order) => order.id === selectedOrderId)
  const filteredOrders = useMemo(() => keyword ? orders.filter((order) => `${order.orderNo}${order.customerName}`.toLowerCase().includes(keyword.toLowerCase())) : orders, [orders, keyword])

  useEffect(() => { if (!hasLoaded) void loadOrders() }, [hasLoaded, loadOrders])

  useEffect(() => {
    if (!createOpen) return
    void api.listProducts()
      .then((data) => setProducts((data ?? []).filter((item) => item.enabled !== false)))
      .catch((err) => setCreateError(err instanceof Error ? err.message : '商品加载失败'))
  }, [createOpen])

  const submitCreateOrder = async () => {
    const selectedProductId = Number(productId)
    const orderedQuantity = Number(quantity)
    if (!customerName.trim() || !selectedProductId || orderedQuantity < 1) return

    setCreating(true)
    setCreateError('')
    try {
      await createOrder({
        customerName: customerName.trim(),
        items: [{ productId: selectedProductId, orderedQuantity }],
      })
      setCreateOpen(false)
      setCustomerName('')
      setProductId('')
      setQuantity('1')
      await loadOrders({ status: status || undefined, keyword: keyword || undefined })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '创建订单失败')
    } finally {
      setCreating(false)
    }
  }

  return <main className="min-w-0 bg-[#f7f8fa]"><div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-9">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight">客户订单</h1><p className="mt-2 text-sm text-slate-500">数据来自 /api/orders，支持状态和关键词查询</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadOrders({ status: status || undefined, keyword: keyword || undefined })} disabled={isLoading}><RefreshCw data-icon="inline-start" />刷新数据</Button><Button className="bg-slate-900 hover:bg-slate-800" onClick={() => { setCreateError(''); setCreateOpen(true) }}><Plus data-icon="inline-start" />创建订单</Button></div></div>
    <Card className="mb-6 border-slate-200 shadow-none"><CardContent className="pt-6"><div className="flex flex-col gap-3 md:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void loadOrders({ status: status || undefined, keyword }) }} placeholder="搜索订单号、客户名称..." className="pl-9" /></div><select value={status} onChange={(event) => { setStatus(event.target.value); void loadOrders({ status: event.target.value || undefined, keyword: keyword || undefined }) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">全部状态</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></CardContent></Card>
    {error && <Card className="mb-6 border-red-200 bg-red-50 shadow-none"><CardContent className="flex flex-col gap-3 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadOrders({ status: status || undefined, keyword: keyword || undefined })}>重试</Button></CardContent></Card>}
    <Card className="border-slate-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">订单列表</CardTitle><CardDescription>{isLoading ? '正在从服务端加载...' : `共 ${filteredOrders.length} 个订单`}</CardDescription></CardHeader><CardContent>{isLoading && !orders.length ? <div className="flex justify-center py-14"><Loader2 className="animate-spin text-slate-400" /></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>客户名称</TableHead><TableHead>商品信息</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredOrders.map((order) => <TableRow key={order.id}><TableCell className="font-mono text-xs font-medium">{order.orderNo}</TableCell><TableCell className="text-sm text-slate-600">{order.customerName}</TableCell><TableCell className="text-xs">{order.items.map((item) => <div key={item.sku}>{item.name} × {item.quantity}</div>)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell><TableCell className="text-xs text-slate-400">{order.createdAt}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => selectOrder(order.id)} aria-label={`查看订单 ${order.orderNo}`}><Eye data-icon="inline-start" />查看</Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>创建客户订单</DialogTitle><DialogDescription>选择真实商品并填写订购数量，提交后将创建待核查订单。</DialogDescription></DialogHeader><div className="space-y-4"><div><label className="mb-1.5 block text-sm font-medium">客户名称</label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="请输入客户名称" /></div><div><label className="mb-1.5 block text-sm font-medium">商品</label><select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">请选择商品</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name ?? '-'} · {product.sku ?? '-'}</option>)}</select>{products.length === 0 && <p className="mt-1.5 text-xs text-slate-400">暂无可用商品，请先到商品管理创建并启用商品。</p>}</div><div><label className="mb-1.5 block text-sm font-medium">订购数量</label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>{createError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{createError}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button><Button onClick={() => void submitCreateOrder()} disabled={creating || !customerName.trim() || !productId || Number(quantity) < 1} className="bg-slate-900 hover:bg-slate-800">{creating ? '创建中...' : '创建订单'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && selectOrder(null)}><DialogContent>{selectedOrder && <><DialogHeader><DialogTitle>{selectedOrder.orderNo}</DialogTitle><DialogDescription>{selectedOrder.customerName} · {selectedOrder.createdAt}</DialogDescription></DialogHeader><div className="flex flex-col gap-3">{selectedOrder.items.map((item) => <div key={item.sku} className="rounded-lg border p-3 text-sm"><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">SKU: {item.sku}，数量：{item.quantity}</div></div>)}<StatusBadge status={selectedOrder.status} />{selectedOrder.exceptionReason && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{selectedOrder.exceptionReason}</p>}</div><DialogFooter>{selectedOrder.status === 'PENDING_CHECK' && <Button onClick={async () => { await checkInventory(selectedOrder.id); selectOrder(null) }}>核查库存</Button>}{selectedOrder.status === 'ABNORMAL' && <Button onClick={async () => { await checkInventory(selectedOrder.id, true); selectOrder(null) }}>重新核查</Button>}{selectedOrder.status !== 'COMPLETED' && <Button variant="outline" onClick={async () => { await cancelOrder(selectedOrder.id); selectOrder(null) }}>取消订单</Button>}</DialogFooter></>}</DialogContent></Dialog>
  </div></main>
}
