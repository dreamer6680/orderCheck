'use client'

import { useEffect, useState, useMemo } from 'react'
import { ArrowDownToLine, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { api } from '@/lib/api/client'
import type { InboundResult, InventoryProjection, ProductResponse } from '@/lib/api/generated'

type InventoryRow = {
  id: number
  sku: string
  name: string
  actual: number
  reserved: number
  available: number
  safety: number
  status: 'good' | 'low' | 'danger'
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  }
  const labels: Record<string, string> = {
    good: '充足',
    low: '低库存',
    danger: '需补货',
  }
  return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [isInboundOpen, setIsInboundOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryProjection[]>([])
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [inboundHistory, setInboundHistory] = useState<InboundResult[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [inventoryData, productData, inboundData] = await Promise.all([
        api.listInventory(),
        api.listProducts(),
        api.listInboundRecords(),
      ])
      setInventory(inventoryData)
      setProducts(productData)
      setInboundHistory(inboundData)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '库存数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const inventoryRows = useMemo<InventoryRow[]>(() => {
    const productMap = new Map(products.map((product) => [product.id, product]))
    return inventory.map((item) => {
      const product = productMap.get(item.productId)
      const safety = product?.safetyStock ?? 0
      const available = item.availableQuantity ?? 0
      const status: InventoryRow['status'] =
        safety > 0 && available < safety * 0.5 ? 'danger'
          : safety > 0 && available < safety ? 'low'
            : 'good'

      return {
        id: item.productId ?? product?.id ?? 0,
        sku: item.sku ?? product?.sku ?? '-',
        name: item.productName ?? product?.name ?? '-',
        actual: item.physicalQuantity ?? 0,
        reserved: item.pendingQuantity ?? 0,
        available,
        safety,
        status,
      }
    })
  }, [inventory, products])

  const filteredInventory = useMemo(() => {
    return inventoryRows.filter((item) =>
      `${item.sku}${item.name}`.toLowerCase().includes(search.toLowerCase()),
    )
  }, [inventoryRows, search])

  const lowStockItems = inventoryRows.filter((item) => item.safety > 0 && item.available < item.safety)
  const totalPhysical = inventoryRows.reduce((sum, item) => sum + item.actual, 0)
  const totalPending = inventoryRows.reduce((sum, item) => sum + item.reserved, 0)
  const totalAvailable = inventoryRows.reduce((sum, item) => sum + item.available, 0)

  const submitInbound = async () => {
    const selectedProductId = Number(productId)
    const inboundQuantity = Number(quantity)
    if (!selectedProductId || inboundQuantity <= 0) return
    await api.recordInbound({
      productId: selectedProductId,
      quantity: inboundQuantity,
      remark: remark.trim() || undefined,
    })
    setIsInboundOpen(false)
    setProductId('')
    setQuantity('1')
    setRemark('')
    await loadData()
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">库存与入库</h1>
            <p className="mt-2 text-sm text-slate-500">查看实时库存状态和登记入库</p>
          </div>
          <Dialog open={isInboundOpen} onOpenChange={setIsInboundOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus size={16} data-icon="inline-start" />
                登记入库
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>登记入库</DialogTitle>
                <DialogDescription>记录商品入库信息</DialogDescription>
              </DialogHeader>
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel>商品</FieldLabel>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">选择商品...</option>
                    {products.filter((item) => item.id).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} · {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="quantity">入库数量</FieldLabel>
                  <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="输入数量" min="1" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="remark">备注（可选）</FieldLabel>
                  <textarea
                    id="remark"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="输入入库备注"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInboundOpen(false)}>
                  取消
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void submitInbound()} disabled={!productId || Number(quantity) <= 0}>
                  确认入库
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">总库存</p>
              <p className="mt-3 text-3xl font-semibold">{totalPhysical.toLocaleString()}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp size={12} className="text-emerald-500" /> 较昨日 +280
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">待出库占用</p>
              <p className="mt-3 text-3xl font-semibold">{totalPending.toLocaleString()}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp size={12} className="text-amber-500" /> 今日新增
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">可用库存</p>
              <p className="mt-3 text-3xl font-semibold">{totalAvailable.toLocaleString()}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <TrendingDown size={12} className="text-red-500" /> 需关注补货
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">低库存商品</p>
              <p className="mt-3 text-3xl font-semibold">{lowStockItems.length}</p>
              <p className="mt-2 text-xs text-red-600">需补货 {lowStockItems.length} 件</p>
            </CardContent>
          </Card>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-400">正在加载库存数据...</p>}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="border-b border-slate-200 bg-transparent">
            <TabsTrigger value="inventory" className="border-b-2 border-transparent data-[state=active]:border-slate-900">
              库存一览
            </TabsTrigger>
            <TabsTrigger value="inbound" className="border-b-2 border-transparent data-[state=active]:border-slate-900">
              入库历史
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card className="mb-6 border-slate-200 shadow-none">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索 SKU 或商品名称..."
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs">商品名称</TableHead>
                        <TableHead className="text-right text-xs">实际库存</TableHead>
                        <TableHead className="text-right text-xs">待出库</TableHead>
                        <TableHead className="text-right text-xs">可用库存</TableHead>
                        <TableHead className="text-right text-xs">安全库存</TableHead>
                        <TableHead className="text-xs">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow key={item.id} className="border-slate-100">
                          <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                          <TableCell className="text-xs text-slate-600">{item.name}</TableCell>
                          <TableCell className="text-right text-xs font-medium">{item.actual.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs text-amber-700">
                            {item.reserved > 0 ? item.reserved.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium text-emerald-700">
                            {item.available.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-500">{item.safety.toLocaleString()}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbound">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">最近入库记录</CardTitle>
                <CardDescription>最新 10 条入库记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">入库记录号</TableHead>
                        <TableHead className="text-xs">商品</TableHead>
                        <TableHead className="text-right text-xs">入库数量</TableHead>
                        <TableHead className="text-xs">操作人</TableHead>
                        <TableHead className="text-xs">时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inboundHistory.map((record) => (
                        <TableRow key={record.id} className="border-slate-100">
                          <TableCell className="font-mono text-xs font-medium">{record.recordNo}</TableCell>
                          <TableCell className="text-xs text-slate-600">{products.find((product) => product.id === record.productId)?.name ?? `商品 #${record.productId ?? '-'}`}</TableCell>
                          <TableCell className="text-right text-xs font-medium">{record.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-slate-500">{record.operatorUsername ?? "-"}</TableCell>
                          <TableCell className="text-xs text-slate-400">-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
