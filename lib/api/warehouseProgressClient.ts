import { apiFetch } from '../api-client'

export interface WarehouseProgress {
  businessDate: string
  timeZone: string
  todayInboundCount: number
  totalInboundCount: number
  todayInboundPercent: number
  todayOutboundCount: number
  pendingOutboundCount: number
  todayPendingOutboundCount: number
  todayPendingOutboundPercent: number
  differenceRecordCount: number
  completedOutboundCount: number
  differencePercent: number
  totalOrderCount: number
  pendingOutboundOrderCount: number
  abnormalOrderCount: number
  abnormalOrderPercent: number
  todayDuePendingOrderCount: number
  todayDuePendingOrderPercent: number
  undatedPendingOrderCount: number
  unfulfilledOrderCount: number
  todayDueUnfulfilledOrderCount: number
  todayDueUnfulfilledOrderPercent: number
  undatedUnfulfilledOrderCount: number
  updatedAt: string
}

const requiredMetricFields = [
  'todayInboundCount',
  'totalInboundCount',
  'todayInboundPercent',
  'todayPendingOutboundCount',
  'pendingOutboundCount',
  'todayPendingOutboundPercent',
  'differenceRecordCount',
  'completedOutboundCount',
  'differencePercent',
  'totalOrderCount',
  'pendingOutboundOrderCount',
  'abnormalOrderCount',
  'abnormalOrderPercent',
  'todayDuePendingOrderCount',
  'todayDuePendingOrderPercent',
  'undatedPendingOrderCount',
  'unfulfilledOrderCount',
  'todayDueUnfulfilledOrderCount',
  'todayDueUnfulfilledOrderPercent',
  'undatedUnfulfilledOrderCount',
] as const satisfies readonly (keyof WarehouseProgress)[]

export const warehouseProgressApi = {
  get: async (): Promise<WarehouseProgress> => {
    const data = await apiFetch<WarehouseProgress>('/api/dashboard/warehouse-progress', { cache: 'no-store' })
    if (!data || requiredMetricFields.some((field) =>
      typeof data[field] !== 'number' || !Number.isFinite(data[field])
    )) {
      throw new Error('仓库执行进度接口字段不完整，请先更新后端到 dev 版本')
    }
    return data
  },
}
