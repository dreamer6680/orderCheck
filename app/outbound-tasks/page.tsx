'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, RefreshCw, Search, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { outboundApi, type OutboundRecord } from '@/lib/api/outboundClient'
import { can } from '@/lib/permissions'
import { useUserStore } from '@/lib/store/userStore'

export default function OutboundTasksPage() {
  const role = useUserStore((state) => state.user?.role)
  const canRead = can(role, 'outbound:read')
  const canWrite = can(role, 'outbound:write')
  const [tasks, setTasks] = useState<OutboundRecord[]>([])
  const [search, setSearch] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'today' | 'date'>('all')
  const [specifiedDate, setSpecifiedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<OutboundRecord | null>(null)
  const [actualQuantity, setActualQuantity] = useState('')
  const [differenceReason, setDifferenceReason] = useState('')
  const [scheduleDates, setScheduleDates] = useState<Record<number, string>>({})
  const [schedulingId, setSchedulingId] = useState<number | null>(null)

  const loadTasks = useCallback(async () => {
    if (!canRead) return
    setLoading(true)
    try {
      setTasks(await outboundApi.list())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '出库任务加载失败')
    } finally {
      setLoading(false)
    }
  }, [canRead])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  // Delivery date is a customer commitment, not a restriction on early outbound execution.
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const filteredTasks = useMemo(() => {
    const date = deliveryFilter === 'today' ? today : deliveryFilter === 'date' ? specifiedDate : null
    return tasks.filter((task) => {
      const matchesSearch = `${task.orderNo}${task.customerName}${task.sku}${task.productName}`
        .toLowerCase().includes(search.trim().toLowerCase())
      // Today/specified date views show tasks that are still actionable.
      return matchesSearch && (deliveryFilter === 'all' ||
        (Boolean(date) && task.status === 'PENDING' && task.deliveryDate === date))
    }).sort((a, b) =>
      (a.deliveryDate ?? '9999-12-31').localeCompare(b.deliveryDate ?? '9999-12-31') ||
      (a.status === 'PENDING' ? -1 : 1) - (b.status === 'PENDING' ? -1 : 1) ||
      a.id - b.id
    )
  }, [tasks, search, deliveryFilter, specifiedDate, today])

  const pendingCount = tasks.filter((task) => task.status === 'PENDING').length
  const completedCount = tasks.filter((task) => task.status === 'COMPLETED').length
  const differenceCount = tasks.filter((task) =>
    task.status === 'COMPLETED' && task.actualQuantity !== task.plannedQuantity
  ).length

  const openComplete = (task: OutboundRecord) => {
    if (!canWrite || task.status !== 'PENDING') return
    setSelected(task)
    setActualQuantity(String(task.plannedQuantity))
    setDifferenceReason('')
    setError('')
  }

  const saveSchedule = async (task: OutboundRecord) => {
    const date = scheduleDates[task.id] ?? task.plannedOutboundDate
    if (!canWrite || task.status !== 'PENDING' || !date || date === task.plannedOutboundDate) return
    setSchedulingId(task.id)
    try {
      const updated = await outboundApi.reschedule(task.id, date)
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '计划出库日期保存失败')
    } finally {
      setSchedulingId(null)
    }
  }

  const quantity = Number(actualQuantity)
  const hasDifference = selected !== null && quantity !== selected.plannedQuantity
  const validQuantity = selected !== null &&
    Number.isFinite(quantity) && quantity > 0 && quantity <= selected.plannedQuantity
  const canSubmit = canWrite && validQuantity &&
    (!hasDifference || differenceReason.trim().length > 0) && !saving

  const completeTask = async () => {
    if (!selected || !canSubmit) return
    setSaving(true)
    try {
      await outboundApi.complete(selected.id, quantity, hasDifference ? differenceReason.trim() : undefined)
      setSelected(null)
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认出库失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 sm:p-6 lg:p-9">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">待出库任务</h1>
            <p className="mt-2 text-sm text-slate-500">仓库人员核实实际出库数量并确认扣减库存</p>
          </div>
          <Button variant="outline" onClick={() => void loadTasks()} disabled={loading}>
            <RefreshCw className="size-4" />刷新数据
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-xs text-slate-500">待处理任务</p><p className="mt-3 text-3xl font-semibold">{pendingCount}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs text-slate-500">已完成任务</p><p className="mt-3 text-3xl font-semibold">{completedCount}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs text-slate-500">数量差异记录</p><p className="mt-3 text-3xl font-semibold">{differenceCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索订单、客户、商品或 SKU" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                交付日期
                <select
                  aria-label="按交付日期筛选"
                  className="h-9 rounded-md border border-slate-200 bg-white px-3"
                  value={deliveryFilter}
                  onChange={(event) => setDeliveryFilter(event.target.value as 'all' | 'today' | 'date')}
                >
                  <option value="all">全部日期</option>
                  <option value="today">今天需交付</option>
                  <option value="date">指定日期</option>
                </select>
              </label>
              {deliveryFilter === 'date' && (
                <Input
                  aria-label="选择交付日期"
                  type="date"
                  className="w-44"
                  value={specifiedDate}
                  onChange={(event) => setSpecifiedDate(event.target.value)}
                />
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">默认按客户交付日期从近到远排列，未设置交付日期的历史任务排在最后；允许提前出库。</p>
          </CardContent>
        </Card>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />正在加载出库任务...</div> :
          filteredTasks.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">当前筛选条件下暂无待出库任务</p> :
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{task.orderNo}</CardTitle>
                    <CardDescription>{task.customerName} · {task.recordNo}</CardDescription>
                  </div>
                  <Badge variant="outline">{task.status === 'PENDING' ? '待出库' : task.status === 'COMPLETED' ? '已完成' : '已取消'}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2"><Truck className="size-4 text-slate-400" />{task.productName} · {task.sku}</div>
                  <div className="flex flex-wrap gap-6 text-slate-600">
                    <span>计划数量：{task.plannedQuantity} {task.unit}</span>
                    <span>交付日期：{task.deliveryDate ?? "未设置（历史订单）"}</span>
                    <span>计划出库日期：{task.plannedOutboundDate}</span>
                    <span>实际数量：{task.actualQuantity ?? '—'} {task.unit}</span>
                  </div>
                  {task.differenceReason && <p className="text-amber-700">差异说明：{task.differenceReason}</p>}
                  {canWrite && task.status === 'PENDING' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor={`planned-date-${task.id}`} className="text-xs text-slate-500">调整计划出库日期</label>
                      <Input
                        id={`planned-date-${task.id}`}
                        type="date"
                        className="w-44"
                        value={scheduleDates[task.id] ?? task.plannedOutboundDate}
                        onChange={(event) => setScheduleDates((current) => ({ ...current, [task.id]: event.target.value }))}
                        disabled={schedulingId !== null}
                      />
                      <Button
                        variant="outline"
                        disabled={schedulingId !== null || !scheduleDates[task.id] || scheduleDates[task.id] === task.plannedOutboundDate}
                        onClick={() => void saveSchedule(task)}
                      >保存日期</Button>
                      <Button onClick={() => openComplete(task)} disabled={schedulingId !== null}><Check className="size-4" />确认出库</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        }

        <Dialog open={selected !== null} onOpenChange={(open) => { if (!open && !saving) setSelected(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认出库</DialogTitle>
              <DialogDescription>{selected?.productName} · 计划出库 {selected?.plannedQuantity} {selected?.unit}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block space-y-2 text-sm">
                <span>实际出库数量</span>
                <Input type="number" min="0.001" step="0.001" max={selected?.plannedQuantity} value={actualQuantity} onChange={(event) => setActualQuantity(event.target.value)} />
              </label>
              {hasDifference &&
                <label className="block space-y-2 text-sm">
                  <span>差异原因（必填）</span>
                  <Input value={differenceReason} onChange={(event) => setDifferenceReason(event.target.value)} maxLength={500} placeholder="请输入实际出库与计划数量不同的原因" />
                </label>}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setSelected(null)}>取消</Button>
              <Button disabled={!canSubmit} onClick={() => void completeTask()}>
                {saving ? '提交中...' : '确认出库'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
