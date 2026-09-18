'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, CircleOff, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import type { InventoryProjection, ProductRequest, ProductResponse } from '@/lib/api/generated'

type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

type ProductRow = {
  id: number
  sku: string
  name: string
  unit: string
  safetyStock: number
  enabled: boolean
  physical: number
  reserved: number
  available: number
  status: ProductStatus
}

const statusLabels: Record<ProductStatus, string> = {
  IN_STOCK: '库存正常',
  LOW_STOCK: '库存偏低',
  OUT_OF_STOCK: '缺货',
}

const statusClasses: Record<ProductStatus, string> = {
  IN_STOCK: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LOW_STOCK: 'border-amber-200 bg-amber-50 text-amber-700',
  OUT_OF_STOCK: 'border-red-200 bg-red-50 text-red-700',
}

const emptyForm = {
  sku: '',
  name: '',
  unit: '件',
  safetyStock: '0',
  enabled: true,
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [inventory, setInventory] = useState<InventoryProjection[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [productData, inventoryData] = await Promise.all([
        api.listProducts(),
        api.listInventory(),
      ])
      setProducts(productData ?? [])
      setInventory(inventoryData ?? [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const rows = useMemo<ProductRow[]>(() => {
    const inventoryMap = new Map(inventory.map((item) => [item.productId, item]))

    return products
      .filter((product): product is ProductResponse & { id: number } => typeof product.id === 'number')
      .map((product) => {
        const stock = inventoryMap.get(product.id)
        const physical = stock?.physicalQuantity ?? 0
        const reserved = stock?.pendingQuantity ?? 0
        const available = stock?.availableQuantity ?? 0
        const safetyStock = product.safetyStock ?? 0
        const status: ProductStatus =
          available <= 0
            ? 'OUT_OF_STOCK'
            : safetyStock > 0 && available <= safetyStock
              ? 'LOW_STOCK'
              : 'IN_STOCK'

        return {
          id: product.id,
          sku: product.sku ?? '-',
          name: product.name ?? '-',
          unit: product.unit ?? '-',
          safetyStock,
          enabled: product.enabled ?? true,
          physical,
          reserved,
          available,
          status,
        }
      })
  }, [products, inventory])

  const filteredProducts = useMemo(
    () =>
      rows.filter((product) =>
        `${product.sku}${product.name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  )

  const summary = {
    total: rows.length,
    healthy: rows.filter((p) => p.status === 'IN_STOCK').length,
    low: rows.filter((p) => p.status === 'LOW_STOCK').length,
    out: rows.filter((p) => p.status === 'OUT_OF_STOCK').length,
  }

  const resetForm = () => setForm(emptyForm)

  const submitProduct = async () => {
    if (!form.sku.trim() || !form.name.trim() || !form.unit.trim()) return

    const payload: ProductRequest = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit.trim(),
      safetyStock: Math.max(0, Number(form.safetyStock) || 0),
      enabled: form.enabled,
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.updateProduct(editingId, payload)
      } else {
        await api.createProduct(payload)
      }

      setOpen(false)
      setEditingId(null)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存商品失败')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (product: ProductRow) => {
    setEditingId(product.id)
    setForm({
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      safetyStock: String(product.safetyStock),
      enabled: product.enabled,
    })
    setOpen(true)
  }

  const removeProduct = async (product: ProductRow) => {
    if (!window.confirm(`确定删除商品「${product.name}」吗？`)) return

    try {
      await api.deleteProduct(product.id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除商品失败')
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] p-5 pb-24 sm:p-6 lg:p-9 lg:pb-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">商品管理</h1>
            <p className="mt-2 text-sm text-slate-500">维护商品主数据、安全库存与启用状态</p>
          </div>
          <Button
            className="bg-slate-900 hover:bg-slate-800"
            onClick={() => {
              setEditingId(null)
              resetForm()
              setOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            新增商品
          </Button>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value)
            if (!value) {
              setEditingId(null)
              resetForm()
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑商品' : '新增商品'}</DialogTitle>
              <DialogDescription>保存后将同步到订单、库存和核查流程</DialogDescription>
            </DialogHeader>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sku">商品 SKU</FieldLabel>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="如 BOX-001"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">商品名称</FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="输入商品名称"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="unit">计量单位</FieldLabel>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="safety">安全库存</FieldLabel>
                <Input
                  id="safety"
                  type="number"
                  min="0"
                  value={form.safetyStock}
                  onChange={(e) => setForm({ ...form, safetyStock: e.target.value })}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="enabled">商品状态</FieldLabel>
                <select
                  id="enabled"
                  value={form.enabled ? 'enabled' : 'disabled'}
                  onChange={(e) => setForm({ ...form, enabled: e.target.value === 'enabled' })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="enabled">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                onClick={() => void submitProduct()}
                className="bg-slate-900 hover:bg-slate-800"
                disabled={saving || !form.sku.trim() || !form.name.trim() || !form.unit.trim()}
              >
                {saving ? '保存中...' : '保存商品'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Summary icon={Package} label="商品总数" value={summary.total} />
          <Summary icon={Boxes} label="库存正常" value={summary.healthy} tone="green" />
          <Summary icon={AlertTriangle} label="库存偏低" value={summary.low} tone="amber" />
          <Summary icon={CircleOff} label="缺货商品" value={summary.out} tone="red" />
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 shadow-none">
            <CardContent className="flex items-center justify-between gap-4 py-4 text-sm text-red-700">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => void loadData()}>
                重试
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">商品列表</CardTitle>
            <CardDescription>
              {loading ? '正在从后端加载...' : `共 ${filteredProducts.length} 个商品`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="搜索 SKU 或商品名称..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="px-3 py-3 font-medium">商品信息</th>
                    <th className="px-3 py-3 font-medium">实际库存</th>
                    <th className="px-3 py-3 font-medium">待出库</th>
                    <th className="px-3 py-3 font-medium">可用库存</th>
                    <th className="px-3 py-3 font-medium">安全库存</th>
                    <th className="px-3 py-3 font-medium">状态</th>
                    <th className="px-3 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Package size={17} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">{product.name}</p>
                              {!product.enabled && (
                                <Badge variant="outline" className="border-slate-200 text-slate-500">
                                  已停用
                                </Badge>
                              )}
                            </div>
                            <p className="font-mono text-xs text-slate-400">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-800">
                        {product.physical.toLocaleString()} {product.unit}
                      </td>
                      <td className="px-3 py-4 text-amber-700">
                        {product.reserved.toLocaleString()} {product.unit}
                      </td>
                      <td className="px-3 py-4 font-semibold text-emerald-700">
                        {product.available.toLocaleString()} {product.unit}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {product.safetyStock.toLocaleString()} {product.unit}
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant="outline" className={statusClasses[product.status]}>
                          {statusLabels[product.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(product)}
                          aria-label={`编辑 ${product.name}`}
                        >
                          <Pencil data-icon="inline-start" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void removeProduct(product)}
                          aria-label={`删除 ${product.name}`}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredProducts.length === 0 && (
                <p className="py-12 text-center text-sm text-slate-400">没有匹配的商品</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function Summary({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: typeof Package
  label: string
  value: number
  tone?: string
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-9 items-center justify-center rounded-lg ${colors[tone]}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
