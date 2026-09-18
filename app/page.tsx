'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Truck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const navItems = [
  { label: '工作台', icon: LayoutDashboard },
  { label: '客户订单', icon: ClipboardList, count: 12 },
  { label: '异常订单', icon: AlertTriangle, count: 3 },
  { label: '库存与入库', icon: Boxes },
  { label: '待出库任务', icon: Truck, count: 8 },
]

const orders = [
  { no: 'SO-20260918024', customer: '杭州云川贸易有限公司', items: '铝合金连接件 × 240', status: '待核查', time: '今天 10:42', type: 'pending' },
  { no: 'SO-20260918023', customer: '上海远洋工业', items: '不锈钢螺栓 × 1,200', status: '待出库', time: '今天 09:18', type: 'outbound' },
  { no: 'SO-20260918021', customer: '宁波精工制造', items: '密封圈套装 × 86', status: '异常', time: '昨天 16:36', type: 'error' },
  { no: 'SO-20260918019', customer: '苏州新材料科技', items: '碳钢法兰 × 48', status: '已完成', time: '昨天 14:05', type: 'done' },
]

const inventory = [
  { sku: 'AL-CN-024', name: '铝合金连接件', actual: '1,280', reserved: '240', available: '1,040', safety: '500', status: '充足' },
  { sku: 'SS-BL-120', name: '不锈钢螺栓', actual: '1,850', reserved: '1,200', available: '650', safety: '800', status: '低库存' },
  { sku: 'SE-PA-086', name: '密封圈套装', actual: '42', reserved: '0', available: '42', safety: '100', status: '需补货' },
]



function StatusBadge({ type, children }: { type: string; children: React.ReactNode }) {
  const styles: Record<string, string> = { pending: 'bg-amber-50 text-amber-700 border-amber-200', outbound: 'bg-blue-50 text-blue-700 border-blue-200', error: 'bg-red-50 text-red-700 border-red-200', done: 'bg-emerald-50 text-emerald-700 border-emerald-200', good: 'bg-emerald-50 text-emerald-700 border-emerald-200', low: 'bg-amber-50 text-amber-700 border-amber-200', danger: 'bg-red-50 text-red-700 border-red-200' }
  return <Badge variant="outline" className={styles[type] ?? ''}>{children}</Badge>
}

export default function Page() {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const filteredOrders = useMemo(() => orders.filter((order) => `${order.no}${order.customer}`.includes(search)), [search])

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <main className="lg:pl-[238px]">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-9"><div><p className="text-xs text-slate-400">周四，2026年9月18日</p><h1 className="mt-1 text-xl font-semibold tracking-tight">工作台</h1></div><div className="flex items-center gap-3"><div className="relative hidden sm:block"><Search className="absolute left-3 top-2.5 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索订单、客户或 SKU" className="h-9 w-64 border-slate-200 bg-slate-50 pl-9 text-xs" /></div><button className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Bell /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" /></button></div></header>
        <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm text-slate-500">早上好，陈思远。这里是今日业务概览。</p><h2 className="text-2xl font-semibold tracking-tight">运营概览</h2></div><Button className="bg-slate-900 text-white hover:bg-slate-800"><Plus data-icon="inline-start" />创建客户订单</Button></div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="待核查订单" value="12" note="较昨日 +4" icon={ClipboardList} tone="amber"/><MetricCard label="待出库任务" value="8" note="今日需处理" icon={Truck} tone="blue"/><MetricCard label="异常订单" value="3" note="需人工介入" icon={AlertTriangle} tone="red"/><MetricCard label="低库存商品" value="6" note="低于安全库存" icon={Boxes} tone="violet"/></section>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card className="border-slate-200 shadow-none"><CardHeader className="flex flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">近期客户订单</CardTitle><p className="mt-1 text-xs text-slate-400">最近创建和更新的订单</p></div><Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="text-xs text-slate-500">查看全部 <ArrowUpRight data-icon="inline-end" /></Button></CardHeader><CardContent className="px-0"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-6 text-[11px]">订单号 / 客户</TableHead><TableHead className="text-[11px]">商品明细</TableHead><TableHead className="text-[11px]">状态</TableHead><TableHead className="pr-6 text-right text-[11px]">创建时间</TableHead></TableRow></TableHeader><TableBody>{filteredOrders.slice(0, showAll ? 4 : 4).map((order) => <TableRow key={order.no} className="border-slate-100"><TableCell className="pl-6"><p className="font-mono text-xs font-medium">{order.no}</p><p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">{order.customer}</p></TableCell><TableCell className="text-xs text-slate-500">{order.items}</TableCell><TableCell><StatusBadge type={order.type}>{order.status}</StatusBadge></TableCell><TableCell className="pr-6 text-right text-xs text-slate-400">{order.time}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
            <Card className="border-slate-200 shadow-none"><CardHeader className="flex flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">库存健康度</CardTitle><p className="mt-1 text-xs text-slate-400">重点关注商品库存状态</p></div><Button variant="ghost" size="icon" className="text-slate-400"><MoreHorizontal data-icon="inline-start" /></Button></CardHeader><CardContent className="flex flex-col gap-4">{inventory.map((item) => <div key={item.sku} className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><PackageOpen data-icon="inline-start" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-medium">{item.name}</p><span className="text-xs font-semibold">{item.available}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.status === '充足' ? 'w-4/5 bg-emerald-500' : item.status === '低库存' ? 'w-2/5 bg-amber-400' : 'w-1/6 bg-red-500'}`} /></div><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>可用库存 · {item.sku}</span><span>{item.status}</span></div></div></div>)}</CardContent></Card>
          </div>
          <Card className="mt-6 border-slate-200 shadow-none"><CardHeader className="flex flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">仓库执行进度</CardTitle><p className="mt-1 text-xs text-slate-400">今日入库与出库任务动态</p></div><Button variant="outline" size="sm" className="text-xs"><RefreshCw data-icon="inline-start" />刷新数据</Button></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><ProgressItem icon={ArrowDownToLine} label="今日入库" value="24" unit="笔" progress="72%" color="bg-blue-500" /><ProgressItem icon={ArrowUpRight} label="今日出库" value="18" unit="笔" progress="58%" color="bg-emerald-500" /><ProgressItem icon={FilePlus2} label="待处理差异" value="2" unit="笔" progress="15%" color="bg-amber-500" /></div></CardContent></Card>
          <p className="mt-8 text-center text-[11px] text-slate-400">数据每 5 分钟自动同步 · 最后更新于 10:45</p>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: React.ElementType; tone: string }) { const tones: Record<string, string> = { amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-600' }; return <Card className="border-slate-200 shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-[11px] text-slate-400">{note}</p></div><div className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon data-icon="inline-start" /></div></div></CardContent></Card> }
function ProgressItem({ icon: Icon, label, value, unit, progress, color }: { icon: React.ElementType; label: string; value: string; unit: string; progress: string; color: string }) { return <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Icon data-icon="inline-start" />{label}<Check className="ml-auto text-emerald-500" /></div><div className="mt-4 flex items-end justify-between"><span className="text-2xl font-semibold">{value}<small className="ml-1 text-xs font-normal text-slate-400">{unit}</small></span><span className="text-xs text-slate-400">{progress}</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-200"><div className={`h-full rounded-full ${color}`} style={{ width: progress }} /></div></div> }
