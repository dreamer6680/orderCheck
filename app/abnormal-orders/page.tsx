'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api/client'
import { apiFetch } from '@/lib/api-client'
import type { InventoryProjection, ItemResponse, OrderResponse } from '@/lib/api/generated'

type AbnormalType = 'STOCK_SHORTAGE' | 'SHORT_DELIVERY' | 'UNABLE_TO_DELIVER' | 'OUTBOUND_CANCELLED' | 'OTHER'
type AbnormalOrder = OrderResponse & { abnormalType?: AbnormalType | null }
const typeLabels: Record<AbnormalType, string> = {
  STOCK_SHORTAGE: '库存不足（待核查）',
  SHORT_DELIVERY: '缺货交付（实际出库不足）',
  UNABLE_TO_DELIVER: '无法交付（已确认）',
  OUTBOUND_CANCELLED: '出库任务取消',
  OTHER: '其他或历史异常',
}
const categories: AbnormalType[] = [
  'STOCK_SHORTAGE', 'SHORT_DELIVERY', 'UNABLE_TO_DELIVER', 'OUTBOUND_CANCELLED', 'OTHER',
]
function typeOf(order: AbnormalOrder): AbnormalType {
  return order.abnormalType && categories.includes(order.abnormalType) ? order.abnormalType : 'OTHER'
}

export default function AbnormalOrdersPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AbnormalType | 'ALL'>('ALL')
  const [orders, setOrders] = useState<AbnormalOrder[]>([])
  const [inventory, setInventory] = useState<InventoryProjection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [recheckOrder, setRecheckOrder] = useState<AbnormalOrder | null>(null)
  const [unableOrder, setUnableOrder] = useState<AbnormalOrder | null>(null)
  const [unableReason, setUnableReason] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [orderData, inventoryData] = await Promise.all([
        api.abnormalOrders({ keyword: search.trim() || undefined }),
        api.listInventory(),
      ])
      // Orval types are regenerated from the backend OpenAPI; do not edit generated files.
      setOrders(orderData as AbnormalOrder[])
      setInventory(inventoryData)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '异常订单加载失败')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const filteredOrders = useMemo(
    () => orders.filter(order => typeFilter === 'ALL' || typeOf(order) === typeFilter),
    [orders, typeFilter],
  )

  const itemStock = (item: ItemResponse) => {
    const stock = inventory.find(row => row.productId === item.productId)
    const ordered = item.orderedQuantity ?? 0
    const available = stock?.availableQuantity ?? null
    return { ordered, available, shortage: available === null ? null : Math.max(0, ordered - available) }
  }

  const confirmRecheck = async () => {
    if (!recheckOrder?.id || saving) return
    setSaving(true)
    try {
      await api.recheckOrder(recheckOrder.id)
      setRecheckOrder(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新核查失败')
    } finally {
      setSaving(false)
    }
  }

  const confirmUnable = async () => {
    if (!unableOrder?.id || !unableReason.trim() || saving) return
    setSaving(true)
    try {
      await apiFetch(`/api/orders/${unableOrder.id}/unable-to-deliver`, {
        method: 'POST', body: JSON.stringify({ reason: unableReason.trim() }),
      })
      setUnableOrder(null)
      setUnableReason('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认无法交付失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] space-y-5 p-6 lg:p-9">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">异常订单</h1>
            <p className="mt-1 text-sm text-slate-500">区分核查时缺货、实际缺货交付与确认无法交付</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)}
                placeholder="搜索订单号、客户名称" />
            </div>
            <select aria-label="按异常类型筛选" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={typeFilter} onChange={event => setTypeFilter(event.target.value as AbnormalType | 'ALL')}>
              <option value="ALL">全部异常类型</option>
              {categories.map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}
            </select>
            <Button variant="outline" disabled={loading} onClick={() => void loadData()}>
              <RefreshCw className="size-4" />刷新
            </Button>
          </CardContent>
        </Card>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && <p className="text-sm text-slate-500">正在加载异常订单...</p>}
        {!loading && !error && filteredOrders.length === 0 && <p className="py-12 text-center text-sm text-slate-500">当前条件下没有异常订单</p>}
        {!loading && filteredOrders.map(order => {
          const kind = typeOf(order)
          const allRestocked = (order.items ?? []).every(item => {
            const stock = itemStock(item)
            return stock.shortage !== null && stock.shortage === 0
          })
          return (
            <Card key={order.id} className="border-slate-200">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{order.orderNo}</CardTitle>
                    <CardDescription>{order.customerName} · 交付日期 {order.deliveryDate ?? '未设置'}</CardDescription>
                  </div>
                  <Badge variant="outline" className={kind === 'UNABLE_TO_DELIVER'
                    ? 'border-red-300 bg-red-100 text-red-800' : 'border-amber-300 bg-amber-50 text-amber-800'}>
                    {typeLabels[kind]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">异常原因</p>
                  <p className="mt-1 whitespace-pre-wrap">{order.exceptionReason ?? '未记录原因，需人工核实'}</p>
                </div>

                {kind === 'STOCK_SHORTAGE' ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">当前库存快照（不是异常发生时的库存）</p>
                    {(order.items ?? []).map((item, index) => {
                      const stock = itemStock(item)
                      return (
                        <div key={item.id ?? index} className="rounded-md border bg-slate-50 p-3 text-sm">
                          <p className="font-medium">{item.productName} · {item.sku}</p>
                          <p className="mt-1 text-slate-600">订购 {stock.ordered} / 当前可用 {stock.available ?? '未知'} / 当前缺口 {stock.shortage ?? '未知'} {item.unit}</p>
                        </div>
                      )
                    })}
                    {allRestocked && (order.items ?? []).length > 0 &&
                      <p className="text-sm text-emerald-700">当前库存已能覆盖订购数量。异常记录来自此前核查；请重新核查以更新订单状态。</p>}
                  </div>
                ) : kind === 'SHORT_DELIVERY' ? (
                  <p className="text-sm text-slate-600">该订单已有实际出库记录，数量低于计划。上方显示的是出库时的差异原因，不应用当前库存推算已交付数量；不能重新核查生成重复任务。</p>
                ) : kind === 'UNABLE_TO_DELIVER' ? (
                  <p className="text-sm text-slate-600">业务人员已确认无法交付并登记原因，不会继续生成出库任务。</p>
                ) : (
                  <p className="text-sm text-slate-600">请按异常原因处理。历史或已取消出库任务不会自动重新生成任务。</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <span className="text-xs text-slate-500">创建于 {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '—'}</span>
                  <div className="flex flex-wrap gap-2">
                    {kind === 'STOCK_SHORTAGE' && (
                      <Button variant="outline" onClick={() => setRecheckOrder(order)}>
                        <RefreshCw className="size-4" />重新核查库存
                      </Button>
                    )}
                    {kind === 'STOCK_SHORTAGE' && (
                      <Button variant="outline" onClick={() => { setUnableReason(''); setUnableOrder(order) }}>
                        确认无法交付
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Dialog open={recheckOrder !== null} onOpenChange={open => { if (!open && !saving) setRecheckOrder(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重新核查库存</DialogTitle>
              <DialogDescription>重新核查后，如可用库存充足，将生成待出库任务。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setRecheckOrder(null)}>取消</Button>
              <Button disabled={saving} onClick={() => void confirmRecheck()}>{saving ? '处理中...' : '确认重新核查'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={unableOrder !== null} onOpenChange={open => { if (!open && !saving) setUnableOrder(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认无法交付</DialogTitle>
              <DialogDescription>仅在确认无法履约时使用。系统将记录原因，不会自动将普通缺货判定为无法交付。</DialogDescription>
            </DialogHeader>
            <label className="block space-y-2 text-sm">无法交付原因（必填）
              <Input maxLength={500} value={unableReason} onChange={event => setUnableReason(event.target.value)}
                placeholder="例如客户取消等待、供应商确认无法供货" />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setUnableOrder(null)}>取消</Button>
              <Button disabled={saving || !unableReason.trim()} onClick={() => void confirmUnable()}>
                {saving ? '提交中...' : '确认无法交付'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
