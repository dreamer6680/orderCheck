"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { warehouseProgressApi, type WarehouseProgress } from "@/lib/api/warehouseProgressClient";
import { useUserStore } from "@/lib/store/userStore";
import { can } from "@/lib/permissions";
import type {
  InventoryProjection,
  OrderResponse,
  ProductResponse,
} from "@/lib/api/generated";

const navItems = [
  { label: "工作台", icon: LayoutDashboard },
  { label: "客户订单", icon: ClipboardList, count: 12 },
  { label: "异常订单", icon: AlertTriangle, count: 3 },
  { label: "库存与入库", icon: Boxes },
  { label: "待出库任务", icon: Truck, count: 8 },
];

function StatusBadge({
  type,
  children,
}: {
  type: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    outbound: "bg-blue-50 text-blue-700 border-blue-200",
    error: "bg-red-50 text-red-700 border-red-200",
    done: "bg-emerald-50 text-emerald-700 border-emerald-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[type] ?? ""}>
      {children}
    </Badge>
  );
}

export default function Page() {
  const router = useRouter();
  const role = useUserStore((state) => state.user?.role);
  const canReadOrders = can(role, "orders:read");
  const canWriteOrders = can(role, "orders:write");
  const canReadWarehouse = can(role, "outbound:read");
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryProjection[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [warehouseProgress, setWarehouseProgress] = useState<WarehouseProgress | null>(null);
  const [warehouseProgressError, setWarehouseProgressError] = useState("");
  const [warehouseProgressLoading, setWarehouseProgressLoading] = useState(false);

  const loadDashboard = async () => {
    const warehouseRequest = canReadWarehouse
      ? (async () => {
          setWarehouseProgressLoading(true);
          try {
            const progress = await warehouseProgressApi.get();
            setWarehouseProgress(progress);
            setWarehouseProgressError("");
          } catch (error) {
            setWarehouseProgress(null);
            setWarehouseProgressError(
              error instanceof Error ? error.message : "仓库执行进度加载失败",
            );
          } finally {
            setWarehouseProgressLoading(false);
          }
        })()
      : Promise.resolve();

    const [orderData, stockData, productData] = await Promise.all([
      canReadOrders ? api.listOrders({ size: 20 }) : Promise.resolve([] as OrderResponse[]),
      api.listInventory(),
      api.listProducts(),
      warehouseRequest,
    ]);
    setOrders(orderData);
    setInventoryData(stockData);
    setProducts(productData);
  };

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    void loadDashboard();
  }, [router, canReadOrders, canReadWarehouse]);

  const statusMeta: Record<string, { label: string; type: string }> = {
    PENDING_CHECK: { label: "待核查", type: "pending" },
    PENDING_OUTBOUND: { label: "待出库", type: "outbound" },
    ABNORMAL: { label: "异常", type: "error" },
    COMPLETED: { label: "已完成", type: "done" },
    CANCELLED: { label: "已取消", type: "error" },
  };

  const recentOrders = useMemo(
    () =>
      orders.map((order) => {
        const meta =
          statusMeta[order.status ?? "PENDING_CHECK"] ??
          statusMeta.PENDING_CHECK;
        return {
          no: order.orderNo ?? "-",
          customer: order.customerName ?? "-",
          items: (order.items ?? [])
            .map(
              (item) =>
                `${item.productName ?? item.sku ?? "商品"} × ${item.orderedQuantity ?? 0}`,
            )
            .join("、"),
          status: meta.label,
          type: meta.type,
          time: order.createdAt ?? "-",
        };
      }),
    [orders],
  );

  const inventory = useMemo(() => {
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    return inventoryData
      .map((item) => {
        const product = productMap.get(item.productId);
        const available = item.availableQuantity ?? 0;
        const safety = product?.safetyStock ?? 0;
        const status =
          safety > 0 && available < safety * 0.5
            ? "需补货"
            : safety > 0 && available < safety
              ? "低库存"
              : "充足";
        return {
          sku: item.sku ?? product?.sku ?? "-",
          name: item.productName ?? product?.name ?? "-",
          available: available.toLocaleString(),
          status,
        };
      })
      .sort(
        (a, b) =>
          (a.status === "充足" ? 1 : -1) - (b.status === "充足" ? 1 : -1),
      )
      .slice(0, 5);
  }, [inventoryData, products]);

  const filteredOrders = useMemo(
    () =>
      recentOrders.filter((order) =>
        `${order.no}${order.customer}${order.items}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [recentOrders, search],
  );
  const pendingCheckCount = orders.filter(
    (order) => order.status === "PENDING_CHECK",
  ).length;
  const pendingOutboundCount = orders.filter(
    (order) => order.status === "PENDING_OUTBOUND",
  ).length;
  const abnormalCount = orders.filter(
    (order) => order.status === "ABNORMAL",
  ).length;
  const lowStockCount = inventoryData.filter((item) => {
    const safety =
      products.find((product) => product.id === item.productId)?.safetyStock ??
      0;
    return safety > 0 && (item.availableQuantity ?? 0) < safety;
  }).length;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <main>
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-9">
          <div>
            <p className="text-xs text-slate-400">周四，2026年9月18日</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              工作台
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block flex items-center justify-center">
              <Search className="absolute left-2.5 top-1.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索订单、客户或 SKU"
                className="h-9 w-64 border-slate-200 bg-slate-50 pl-9 text-xs"
              />
            </div>
            <button className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Bell />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm text-slate-500">
                这里是当前业务概览。
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                运营概览
              </h2>
            </div>
            {canWriteOrders && <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => router.push("/orders")}
            >
              <Plus data-icon="inline-start" />
              创建客户订单
            </Button>}
          </div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="待核查订单"
              value={String(pendingCheckCount)}
              note="等待库存核查"
              icon={ClipboardList}
              tone="amber"
            />
            <MetricCard
              label="待出库任务"
              value={String(pendingOutboundCount)}
              note="当前待出库订单"
              icon={Truck}
              tone="blue"
            />
            <MetricCard
              label="异常订单"
              value={String(abnormalCount)}
              note="需人工介入"
              icon={AlertTriangle}
              tone="red"
            />
            <MetricCard
              label="低库存商品"
              value={String(lowStockCount)}
              note="低于安全库存"
              icon={Boxes}
              tone="violet"
            />
          </section>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            {canReadOrders && <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">近期客户订单</CardTitle>
                  <p className="mt-1 text-xs text-slate-400">
                    最近创建和更新的订单
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-slate-500"
                >
                  查看全部 <ArrowUpRight data-icon="inline-end" />
                </Button>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 text-[11px]">
                        订单号 / 客户
                      </TableHead>
                      <TableHead className="text-[11px]">商品明细</TableHead>
                      <TableHead className="text-[11px]">状态</TableHead>
                      <TableHead className="pr-6 text-right text-[11px]">
                        创建时间
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ?                     
                    (filteredOrders.slice(0, showAll ? 20 : 4).map((order) => (
                      <TableRow key={order.no} className="border-slate-100">
                        <TableCell className="pl-6">
                          <p className="font-mono text-xs font-medium">
                            {order.no}
                          </p>
                          <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                            {order.customer}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {order.items}
                        </TableCell>
                        <TableCell>
                          <StatusBadge type={order.type}>
                            {order.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="pr-6 text-right text-xs text-slate-400">
                          {order.time}
                        </TableCell>
                      </TableRow>
                    ))) :     <TableRow><TableCell colSpan={4} className="h-24 text-center text-sm text-slate-400">当前暂无订单</TableCell></TableRow>                
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>}
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">库存健康度</CardTitle>
                  <p className="mt-1 text-xs text-slate-400">
                    重点关注商品库存状态
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreHorizontal data-icon="inline-start" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {inventory.map((item) => (
                  <div key={item.sku} className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <PackageOpen data-icon="inline-start" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium">
                          {item.name}
                        </p>
                        <span className="text-xs font-semibold">
                          {item.available}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.status === "充足" ? "w-4/5 bg-emerald-500" : item.status === "低库存" ? "w-2/5 bg-amber-400" : "w-1/6 bg-red-500"}`}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>可用库存 · {item.sku}</span>
                        <span>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {canReadWarehouse && (
            <Card className="mt-6 border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">仓库执行进度</CardTitle>
                  <p className="mt-1 text-xs text-slate-400">
                    {warehouseProgress
                      ? `业务日期 ${warehouseProgress.businessDate}（${warehouseProgress.timeZone}）`
                      : "今日入库与出库任务动态"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => void loadDashboard()}
                  disabled={warehouseProgressLoading}
                >
                  <RefreshCw data-icon="inline-start" />
                  刷新数据
                </Button>
              </CardHeader>
              <CardContent>
                {warehouseProgressLoading && !warehouseProgress ? (
                  <p className="text-sm text-slate-500">正在加载仓库执行进度...</p>
                ) : warehouseProgressError ? (
                  <p role="alert" className="text-sm text-red-600">{warehouseProgressError}</p>
                ) : warehouseProgress ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <ProgressItem
                      icon={ArrowDownToLine}
                      label="今日入库"
                      value={warehouseProgress.todayInboundCount}
                      progress={warehouseProgress.todayInboundPercent}
                      note={`今日 ${warehouseProgress.todayInboundCount} / 累计 ${warehouseProgress.totalInboundCount} 笔入库记录`}
                      color="bg-blue-500"
                    />
                    <ProgressItem
                      icon={Truck}
                      label="今日需交付"
                      value={warehouseProgress.todayDueUnfulfilledOrderCount}
                      unit="单"
                      progress={warehouseProgress.todayDueUnfulfilledOrderPercent}
                      note={`今日交付且未完成 ${warehouseProgress.todayDueUnfulfilledOrderCount} / 全部未完成订单 ${warehouseProgress.unfulfilledOrderCount} 单（包含待核查、待出库、异常）；未录入交付日期 ${warehouseProgress.undatedUnfulfilledOrderCount} 单`}
                      color="bg-emerald-500"
                    />
                    <ProgressItem
                      icon={AlertTriangle}
                      label="数量差异记录"
                      value={warehouseProgress.differenceRecordCount}
                      progress={warehouseProgress.differencePercent}
                      note={`存在差异 ${warehouseProgress.differenceRecordCount} / 已完成出库 ${warehouseProgress.completedOutboundCount} 笔（非待处理数）`}
                      color="bg-amber-500"
                    />
                    <ProgressItem
                      icon={AlertTriangle}
                      label="异常订单"
                      value={warehouseProgress.abnormalOrderCount}
                      unit="单"
                      progress={warehouseProgress.abnormalOrderPercent}
                      note={`异常订单 ${warehouseProgress.abnormalOrderCount} / 全部订单 ${warehouseProgress.totalOrderCount} 单`}
                      color="bg-red-500"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">暂无仓库执行进度数据</p>
                )}
                {warehouseProgress && !warehouseProgressError && (
                  <p className="mt-4 text-xs text-slate-400">
                    数据更新于 {new Date(warehouseProgress.updatedAt).toLocaleString("zh-CN", {
                      timeZone: warehouseProgress.timeZone,
                    })} · 点击刷新可获取最新数据
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ElementType;
  tone: string;
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">{note}</p>
          </div>
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}
          >
            <Icon data-icon="inline-start" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function ProgressItem({
  icon: Icon,
  label,
  value,
  progress,
  note,
  color,
  unit = "笔",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  progress: number;
  note: string;
  color: string;
  unit?: string;
}) {
  const percentage = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon data-icon="inline-start" />
        {label}
        <span className={`ml-auto size-2 rounded-full ${color}`} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-2xl font-semibold">
          {value.toLocaleString("zh-CN")}
          <small className="ml-1 text-xs font-normal text-slate-400">{unit}</small>
        </span>
        <span className="text-xs text-slate-400">{percentage.toFixed(1)}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}
