"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, AlertCircle, Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useUserStore } from "@/lib/store/userStore";
import { can } from "@/lib/permissions";

const mockOutboundTasks = [
  {
    id: 1,
    orderNo: "SO-20260918024",
    customerName: "杭州云川贸易有限公司",
    records: [
      {
        recordId: 1,
        sku: "AL-CN-024",
        name: "铝合金连接件",
        planned: 240,
        actual: null,
        status: "PENDING",
      },
    ],
    createdAt: "2026-09-18 10:42",
  },
  {
    id: 2,
    orderNo: "SO-20260918023",
    customerName: "上海远洋工业",
    records: [
      {
        recordId: 2,
        sku: "SS-BL-120",
        name: "不锈钢螺栓",
        planned: 1200,
        actual: null,
        status: "PENDING",
      },
    ],
    createdAt: "2026-09-18 09:18",
  },
  {
    id: 3,
    orderNo: "SO-20260918010",
    customerName: "南京物流有限公司",
    records: [
      {
        recordId: 3,
        sku: "CF-FL-048",
        name: "碳钢法兰",
        planned: 48,
        actual: 45,
        status: "COMPLETED",
        difference: 3,
        reason: "现场发现3件破损，已剔除",
      },
      {
        recordId: 4,
        sku: "AL-CN-024",
        name: "铝合金连接件",
        planned: 300,
        actual: 300,
        status: "COMPLETED",
        difference: 0,
      },
    ],
    createdAt: "2026-09-17 11:30",
  },
];

export default function OutboundTasksPage() {
  const role = useUserStore((state) => state.user?.role);
  const canWriteOutbound = can(role, "outbound:write");
  const [search, setSearch] = useState("");
  const [completeTaskId, setCompleteTaskId] = useState<number | null>(null);
  const [completeQuantity, setCompleteQuantity] = useState("");
  const [completeDifference, setCompleteDifference] = useState("");
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return mockOutboundTasks.filter((task) =>
      `${task.orderNo}${task.customerName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search]);

  const pendingRecords = mockOutboundTasks.flatMap((task) =>
    task.records
      .filter((r) => r.status === "PENDING")
      .map((r) => ({ ...r, orderNo: task.orderNo })),
  );

  const handleCompleteTask = (recordId: number) => {
    if (!canWriteOutbound) return;
    setCompleteTaskId(recordId);
    setCompleteQuantity("");
    setCompleteDifference("");
    setIsCompleteOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] p-6 lg:p-9">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                待出库任务
              </h1>
              <p className="mt-1 text-sm text-slate-500">确认出库和库存扣减</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">待处理任务</p>
              <p className="mt-3 text-3xl font-semibold">
                {pendingRecords.length}
              </p>
              <p className="mt-2 text-xs text-slate-400">需立即处理</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">已完成订单</p>
              <p className="mt-3 text-3xl font-semibold">
                {
                  mockOutboundTasks.filter((t) =>
                    t.records.every((r) => r.status === "COMPLETED"),
                  ).length
                }
              </p>
              <p className="mt-2 text-xs text-emerald-600">已出库完成</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">出库数量差异</p>
              <p className="mt-3 text-3xl font-semibold">
                {mockOutboundTasks
                  .flatMap((t) => t.records)
                  .filter(
                    (r) =>
                      r.status === "COMPLETED" &&
                      r.difference &&
                      r.difference > 0,
                  )
                  .reduce((sum, r) => sum + (r.difference || 0), 0)}
              </p>
              <p className="mt-2 text-xs text-amber-600">需人工说明</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-slate-200 shadow-none">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索订单号、客户名称..."
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {task.orderNo}
                    </CardTitle>
                    <CardDescription>{task.customerName}</CardDescription>
                  </div>
                  <span className="text-xs text-slate-400">
                    创建于 {task.createdAt}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.records.map((record) => (
                  <div
                    key={record.recordId}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs font-medium text-slate-700">
                          {record.sku}
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {record.name}
                        </p>
                      </div>
                      {record.status === "PENDING" ? (
                        <Badge
                          className="bg-blue-100 text-blue-700 border-blue-200"
                          variant="outline"
                        >
                          待处理
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-emerald-100 text-emerald-700 border-emerald-200"
                          variant="outline"
                        >
                          已完成
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">计划出库</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {record.planned}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">实际出库</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {record.actual !== null ? record.actual : "—"}
                        </p>
                      </div>
                    </div>

                    {record.status === "COMPLETED" &&
                      record.difference &&
                      record.difference > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 mb-3">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-xs text-amber-700">
                            {record.reason}
                          </AlertDescription>
                        </Alert>
                      )}

                    {canWriteOutbound && record.status === "PENDING" && (
                      <Dialog
                        open={
                          isCompleteOpen && completeTaskId === record.recordId
                        }
                        onOpenChange={setIsCompleteOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleCompleteTask(record.recordId)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check size={16} data-icon="inline-start" />
                            确认出库
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>确认出库</DialogTitle>
                            <DialogDescription>
                              {record.name} - 计划出库数量: {record.planned}
                            </DialogDescription>
                          </DialogHeader>
                          <FieldGroup className="space-y-4">
                            <Field>
                              <FieldLabel htmlFor="actual-qty">
                                实际出库数量
                              </FieldLabel>
                              <Input
                                id="actual-qty"
                                type="number"
                                value={completeQuantity}
                                onChange={(e) =>
                                  setCompleteQuantity(e.target.value)
                                }
                                placeholder={`请输入实际数量 (1-${record.planned})`}
                                min="1"
                                max={record.planned}
                              />
                              <p className="mt-1 text-xs text-slate-500">
                                必须大于 0，且不能超过 {record.planned}
                              </p>
                            </Field>

                            {completeQuantity &&
                              Number(completeQuantity) !== record.planned && (
                                <Field>
                                  <FieldLabel htmlFor="difference-reason">
                                    差异说明{" "}
                                    <span className="text-red-600">*</span>
                                  </FieldLabel>
                                  <textarea
                                    id="difference-reason"
                                    value={completeDifference}
                                    onChange={(e) =>
                                      setCompleteDifference(e.target.value)
                                    }
                                    placeholder="请说明数量差异原因，如破损、错发等"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                  />
                                  <p className="mt-1 text-xs text-slate-500">
                                    数量差异时必须填写原因说明
                                  </p>
                                </Field>
                              )}
                          </FieldGroup>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsCompleteOpen(false)}
                            >
                              取消
                            </Button>
                            <Button
                              className="bg-slate-900 hover:bg-slate-800"
                              onClick={() => setIsCompleteOpen(false)}
                              disabled={!completeQuantity}
                            >
                              确认出库
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
