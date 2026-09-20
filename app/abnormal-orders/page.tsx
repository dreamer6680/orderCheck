'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { apiFetch } from '@/lib/api-client'
import { fulfillmentApi, type FulfillmentLine, type FulfillmentOrder } from '@/lib/api/orderFulfillmentClient'
import type { InventoryProjection } from '@/lib/api/generated'

type AbnormalType = NonNullable<FulfillmentOrder['abnormalType']>
const typeLabels: Record<AbnormalType, string> = {
  STOCK_SHORTAGE: '库存不足 · 待处理',
  SHORT_DELIVERY: '部分出库 · 待补发',
  UNABLE_TO_DELIVER: '确认无法交付',
  OUTBOUND_CANCELLED: '出库任务取消',
  OTHER: '其他或历史异常',
}
const eventLabels: Record<string, string> = {
  STOCK_SHORTAGE: '库存核查不足',
  PARTIAL_SHIPMENT_PLANNED: '安排分批发货',
  OUTBOUND_SHORTAGE: '实际出库不足',
  SUPPLEMENTAL_PLANNED: '创建补发任务',
  SHIPMENT_COMPLETED: '出库完成',
  SHIPMENT_CANCELLED: '取消出库任务',
  CUSTOMER_ACCEPTED_SHORTAGE: '客户接受少交',
  UNABLE_TO_DELIVER: '确认无法交付',
  FULFILLMENT_COMPLETED: '履约完成',
}
type Action = { type: 'partial' | 'supplemental' | 'accept' | 'recheck' | 'unable'; order: FulfillmentOrder; item?: FulfillmentLine }
const number = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 3 })
const typeOf = (order: FulfillmentOrder): AbnormalType =>
  order.abnormalType && order.abnormalType in typeLabels ? order.abnormalType : 'OTHER'

export default function AbnormalOrdersPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([])
  const [inventory, setInventory] = useState<InventoryProjection[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AbnormalType | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<Action | null>(null)
  const [reason, setReason] = useState('')
  const [quantity, setQuantity] = useState('')
  const [approved, setApproved] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [orderData, inventoryData] = await Promise.all([
        api.abnormalOrders({ keyword: search.trim() || undefined }),
        api.listInventory(),
      ])
      setOrders(orderData as FulfillmentOrder[])
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
    () => orders.filter(order => filter === 'ALL' || typeOf(order) === filter),
    [orders, filter],
  )
  const stockOf = (item: FulfillmentLine) =>
    inventory.find(stock => stock.productId === item.productId)?.availableQuantity ?? null

  const showAction = (type: Action['type'], order: FulfillmentOrder, item?: FulfillmentLine) => {
    setAction({ type, order, item })
    setReason('')
    setApproved(false)
    setQuantity(item ? String(Math.max(0, item.remainingQuantity - item.pendingQuantity)) : '')
    setError('')
  }
  const submit = async () => {
    if (!action?.order.id || saving) return
    setSaving(true)
    setError('')
    try {
      if (action.type === 'partial') {
        if (!approved) throw new Error('必须先确认客户同意分批交付')
        await fulfillmentApi.partial(action.order.id)
      } else if (action.type === 'supplemental') {
        if (!action.item?.id || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
          throw new Error('请输入有效的补发数量')
        }
        await fulfillmentApi.supplemental(action.order.id, action.item.id, Number(quantity))
      } else if (action.type === 'accept') {
        if (!reason.trim()) throw new Error('请填写客户确认原因')
        await fulfillmentApi.acceptShortDelivery(action.order.id, reason.trim())
      } else if (action.type === 'unable') {
        if (!reason.trim()) throw new Error('请填写无法交付的原因')
        await apiFetch(`/api/orders/${action.order.id}/unable-to-deliver`, {
          method: 'POST', body: JSON.stringify({ reason: reason.trim() }),
        })
      } else {
        await api.recheckOrder(action.order.id)
      }
      setAction(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单处理失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-9">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">异常订单</h1>
            <p className="mt-1 text-sm text-slate-500">查看累计已出库、待履约数量及异常处理历史；入库与补发是不同操作。</p>
          </div>
        </div>

        <Card><CardContent className="flex flex-col gap-3 p-5 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)}
              placeholder="搜索订单号、客户名称" />
          </div>
          <select aria-label="筛选异常类型" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={filter} onChange={event => setFilter(event.target.value as AbnormalType | 'ALL')}>
            <option value="ALL">全部异常类型</option>
            {(Object.keys(typeLabels) as AbnormalType[]).map(type =>
              <option key={type} value={type}>{typeLabels[type]}</option>)}
          </select>
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className="size-4" />刷新
          </Button>
        </CardContent></Card>

        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && <p className="text-sm text-slate-500">正在加载异常订单...</p>}
        {!loading && !error && filteredOrders.length === 0 &&
          <p className="py-10 text-center text-sm text-slate-500">当前条件下暂无异常订单</p>}
        {!loading && filteredOrders.map(order => {
          const kind = typeOf(order)
          const lines = order.items
          const supported = Array.isArray(lines) && lines.every(line =>
            typeof line.shippedQuantity === 'number' &&
            typeof line.remainingQuantity === 'number' &&
            typeof line.pendingQuantity === 'number' &&
            typeof line.waivedQuantity === 'number')
          const pending = supported && lines.some(line => line.pendingQuantity > 0)
          const allAvailable = supported && lines.every(line =>
            stockOf(line) !== null && (stockOf(line) as number) >= line.orderedQuantity)
          const canPartial = supported && kind === 'STOCK_SHORTAGE' &&
            lines.some(line => (stockOf(line) ?? 0) > 0)
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
                {!supported ? (
                  <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                    后端尚未返回累计出库及待履约数量，请更新后端至包含 V8 迁移的 dev 版本后刷新。
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium">订单明细与履约进度</p>
                    <div className="space-y-2">
                      {lines.map((item, index) => {
                        const available = stockOf(item)
                        const unplanned = Math.max(0, item.remainingQuantity - item.pendingQuantity)
                        const canSupplement = (kind === 'SHORT_DELIVERY' || kind === 'OUTBOUND_CANCELLED')
                          && item.id && unplanned > 0 && available !== null
                          && available > 0
                        return (
                          <div key={item.id ?? index} className="rounded-md border bg-slate-50 p-3 text-sm">
                            <p className="font-medium">{item.productName} · {item.sku}</p>
                            <p className="mt-1 text-slate-600">
                              订购 {number(item.orderedQuantity ?? 0)} / 累计已出库 {number(item.shippedQuantity)}
                              / 待履约 {number(item.remainingQuantity)} {item.unit}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              已安排待出库 {number(item.pendingQuantity)} · 可安排数量 {number(unplanned)}
                              · 客户接受不再补发 {number(item.waivedQuantity)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              当前可用库存：{available === null ? '未知' : number(available)} {item.unit}（实时快照）
                            </p>
                            {canSupplement && (
                              <Button className="mt-2" variant="outline" size="sm"
                                onClick={() => showAction('supplemental', order, item)}>
                                创建补发任务
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {kind === 'STOCK_SHORTAGE' && allAvailable &&
                      <p className="text-sm text-emerald-700">目前库存可覆盖订购数量；请重新核查，原有缺货原因仍保留在历史记录中。</p>}
                    {kind === 'SHORT_DELIVERY' && pending &&
                      <p className="text-sm text-blue-700">已有待执行的出库任务，请由仓库执行后再安排剩余补发，避免重复预留。</p>}
                  </>
                )}

                <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">当前异常与处理说明</p>
                  {kind === 'STOCK_SHORTAGE' && <p className="mt-1">库存核查时无法一次安排全部出库。可等待入库、重新核查，或在客户同意后先安排部分出库。</p>}
                  {kind === 'SHORT_DELIVERY' && <p className="mt-1">订单已有实际出库，但仍存在未履约数量。可在补货后创建补发任务，或与客户确认不再补发的部分。</p>}
                  {kind === 'UNABLE_TO_DELIVER' && <p className="mt-1">业务人员确认无法履约。不能仅凭当前缺货自动作出该判断。</p>}
                  {kind !== 'STOCK_SHORTAGE' && kind !== 'SHORT_DELIVERY' && kind !== 'UNABLE_TO_DELIVER' &&
                    <p className="mt-1">请检查出库任务状态及原始异常原因，历史任务不会自动重新生成。</p>}
                  {order.exceptionReason && <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">原始异常记录</summary>
                    <p className="mt-2 whitespace-pre-wrap">{order.exceptionReason}</p>
                  </details>}
                </div>

                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">履约处理记录</p>
                  {Array.isArray(order.events) && order.events.length > 0 ?
                    <ol className="mt-2 space-y-2 text-xs text-slate-600">
                      {order.events.map(event => (
                        <li key={event.id} className="border-l-2 border-slate-200 pl-3">
                          <span className="font-medium">{eventLabels[event.eventType] ?? event.eventType}</span>
                          {' · '}{event.createdAt ? new Date(event.createdAt).toLocaleString('zh-CN') : '—'}
                          <p className="mt-1 whitespace-pre-wrap">{event.description}</p>
                        </li>
                      ))}
                    </ol> : <p className="mt-2 text-xs text-slate-500">无可用历史事件；旧订单的原始异常说明见上方。</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <span className="text-xs text-slate-500">创建于 {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '—'}</span>
                  <div className="flex flex-wrap gap-2">
                    <Link className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50" href="/inventory">查看库存 / 联系仓库补货</Link>
                    {kind === 'STOCK_SHORTAGE' && <Button variant="outline" size="sm" onClick={() => showAction('recheck', order)}>重新核查库存</Button>}
                    {canPartial && <Button variant="outline" size="sm" onClick={() => showAction('partial', order)}>客户同意后先发部分</Button>}
                    {kind === 'STOCK_SHORTAGE' && <Button variant="outline" size="sm" onClick={() => showAction('unable', order)}>确认无法交付</Button>}
                    {kind === 'SHORT_DELIVERY' && supported && !pending &&
                      lines.some(line => line.remainingQuantity > 0) &&
                      <Button size="sm" variant="outline" onClick={() => showAction('accept', order)}>客户接受少交</Button>}
                    {kind === 'SHORT_DELIVERY' && <Link className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50" href="/outbound-tasks">查看待出库任务</Link>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Dialog open={action !== null} onOpenChange={open => { if (!open && !saving) setAction(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{action?.type === 'partial' ? '安排首次部分出库'
                : action?.type === 'supplemental' ? '创建补发任务'
                : action?.type === 'accept' ? '客户接受剩余少交'
                : action?.type === 'unable' ? '确认无法交付' : '重新核查库存'}</DialogTitle>
              <DialogDescription>
                {action?.type === 'partial' ? '按当前可用库存安排部分货品；尚未出库的剩余数量继续跟踪，客户必须已同意分批交付。'
                  : action?.type === 'supplemental' ? '核查当前库存并预留补发数量；请避免同一剩余数量重复安排出库。'
                  : action?.type === 'accept' ? '须有客户明确确认；未补发的剩余数量将记录为不再履约，实际已出库数量不会增加。'
                  : action?.type === 'unable' ? '仅适用于尚无实际出库的订单，确认原因后不再自动安排出库。'
                  : '核查当前库存，库存充足后安排出库。'}
              </DialogDescription>
            </DialogHeader>
            {action?.type === 'partial' && <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={approved} onChange={event => setApproved(event.target.checked)} />
              已与客户确认可以分批交付
            </label>}
            {action?.type === 'supplemental' && <label className="block space-y-2 text-sm">
              补发数量（{action.item?.unit}）
              <Input type="number" min={0.001} step={0.001} value={quantity}
                onChange={event => setQuantity(event.target.value)} />
              <span className="block text-xs text-slate-500">待履约 {action.item?.remainingQuantity}，已安排待出库 {action.item?.pendingQuantity}；不足可先联系仓库补货。</span>
            </label>}
            {(action?.type === 'accept' || action?.type === 'unable') && <label className="block space-y-2 text-sm">
              客户确认或无法交付原因（必填）
              <Input maxLength={500} value={reason} onChange={event => setReason(event.target.value)} />
            </label>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setAction(null)}>取消</Button>
              <Button disabled={saving || (action?.type === 'partial' && !approved)
                || ((action?.type === 'accept' || action?.type === 'unable') && !reason.trim())
                || (action?.type === 'supplemental' && (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0))}
                onClick={() => void submit()}>{saving ? '提交中...' : '确认'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
