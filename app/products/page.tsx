'use client'

import { useMemo, useState } from 'react'
import { Package, Plus, Search, Pencil, Trash2, Boxes, AlertTriangle, CircleOff } from 'lucide-react'
import { useProductStore, type ProductStatus } from '@/lib/product-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const statusLabels: Record<ProductStatus, string> = { IN_STOCK: '库存正常', LOW_STOCK: '库存偏低', OUT_OF_STOCK: '缺货' }
const statusClasses: Record<ProductStatus, string> = { IN_STOCK: 'border-emerald-200 bg-emerald-50 text-emerald-700', LOW_STOCK: 'border-amber-200 bg-amber-50 text-amber-700', OUT_OF_STOCK: 'border-red-200 bg-red-50 text-red-700' }

export default function ProductsPage() {
  const { products, addProduct, updateProduct, removeProduct } = useProductStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部分类')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ sku: '', name: '', category: '连接件', unit: '件', price: '', available: '', reserved: '0', safetyStock: '0' })

  const categories = ['全部分类', ...Array.from(new Set(products.map((product) => product.category)))]
  const filteredProducts = useMemo(() => products.filter((product) => {
    const keyword = `${product.sku}${product.name}`.toLowerCase()
    return keyword.includes(search.toLowerCase()) && (category === '全部分类' || product.category === category)
  }), [products, search, category])
  const summary = { total: products.length, healthy: products.filter((p) => p.status === 'IN_STOCK').length, low: products.filter((p) => p.status === 'LOW_STOCK').length, out: products.filter((p) => p.status === 'OUT_OF_STOCK').length }

  const resetForm = () => setForm({ sku: '', name: '', category: '连接件', unit: '件', price: '', available: '', reserved: '0', safetyStock: '0' })
  const submitProduct = () => {
    if (!form.sku.trim() || !form.name.trim() || !form.available) return
    const data = { sku: form.sku.trim(), name: form.name.trim(), category: form.category, unit: form.unit, price: Number(form.price) || 0, available: Number(form.available) || 0, reserved: Number(form.reserved) || 0, safetyStock: Number(form.safetyStock) || 0 }
    if (editingId) updateProduct(editingId, data)
    else addProduct(data)
    setOpen(false); setEditingId(null); resetForm()
  }
  const startEdit = (product: (typeof products)[number]) => { setEditingId(product.id); setForm({ sku: product.sku, name: product.name, category: product.category, unit: product.unit, price: String(product.price), available: String(product.available), reserved: String(product.reserved), safetyStock: String(product.safetyStock) }); setOpen(true) }

  return <main className="min-h-screen bg-[#f7f8fa]"><div className="mx-auto max-w-[1440px] p-5 pb-24 sm:p-6 lg:p-9 lg:pb-9">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight">商品管理</h1><p className="mt-2 text-sm text-slate-500">维护商品资料、库存阈值与可用数量</p></div>
      <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setOpen(true)}><Plus data-icon="inline-start" />新增商品</Button></div><Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setEditingId(null); resetForm() } }}><DialogContent><DialogHeader><DialogTitle>{editingId ? '编辑商品' : '新增商品'}</DialogTitle><DialogDescription>商品数据会立即同步到库存核查页面</DialogDescription></DialogHeader><FieldGroup className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="sku">商品 SKU</FieldLabel><Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="如 AL-CN-024" /></Field><Field><FieldLabel htmlFor="name">商品名称</FieldLabel><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入商品名称" /></Field><Field><FieldLabel htmlFor="category">商品分类</FieldLabel><Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field><Field><FieldLabel htmlFor="unit">计量单位</FieldLabel><Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field><Field><FieldLabel htmlFor="available">可用库存</FieldLabel><Input id="available" type="number" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })} /></Field><Field><FieldLabel htmlFor="safety">安全库存</FieldLabel><Input id="safety" type="number" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: e.target.value })} /></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={submitProduct} className="bg-slate-900 hover:bg-slate-800">保存商品</Button></DialogFooter></DialogContent></Dialog>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Summary icon={Package} label="商品总数" value={summary.total} /><Summary icon={Boxes} label="库存正常" value={summary.healthy} tone="green" /><Summary icon={AlertTriangle} label="库存偏低" value={summary.low} tone="amber" /><Summary icon={CircleOff} label="缺货商品" value={summary.out} tone="red" /></div>
    <Card className="border-slate-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">商品列表</CardTitle><CardDescription>共 {filteredProducts.length} 个商品，支持实时维护</CardDescription></CardHeader><CardContent><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="搜索 SKU 或商品名称..." /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="px-3 py-3 font-medium">商品信息</th><th className="px-3 py-3 font-medium">分类</th><th className="px-3 py-3 font-medium">库存数量</th><th className="px-3 py-3 font-medium">安全库存</th><th className="px-3 py-3 font-medium">状态</th><th className="px-3 py-3 text-right font-medium">操作</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id} className="border-b border-slate-50 last:border-0"><td className="px-3 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Package size={17} /></div><div><p className="font-medium text-slate-800">{product.name}</p><p className="font-mono text-xs text-slate-400">{product.sku}</p></div></div></td><td className="px-3 py-4 text-slate-500">{product.category}</td><td className="px-3 py-4"><span className="font-semibold text-slate-800">{product.available.toLocaleString()}</span><span className="ml-1 text-xs text-slate-400">{product.unit}</span><p className="text-xs text-slate-400">已预留 {product.reserved.toLocaleString()}</p></td><td className="px-3 py-4 text-slate-500">{product.safetyStock.toLocaleString()} {product.unit}</td><td className="px-3 py-4"><Badge variant="outline" className={statusClasses[product.status]}>{statusLabels[product.status]}</Badge></td><td className="px-3 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => startEdit(product)} aria-label={`编辑 ${product.name}`}><Pencil data-icon="inline-start" />编辑</Button><Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)} aria-label={`删除 ${product.name}`} className="text-slate-400 hover:text-red-600"><Trash2 /></Button></td></tr>)}</tbody></table>{filteredProducts.length === 0 && <p className="py-12 text-center text-sm text-slate-400">没有匹配的商品</p>}</div></CardContent></Card>
  </div></main>
}

function Summary({ icon: Icon, label, value, tone = 'slate' }: { icon: typeof Package; label: string; value: number; tone?: string }) { const colors: Record<string, string> = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' }; return <Card className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-3 p-4"><div className={`flex size-9 items-center justify-center rounded-lg ${colors[tone]}`}><Icon size={17} /></div><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div></CardContent></Card> }
