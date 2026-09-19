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
  updatedAt: string
}

export const warehouseProgressApi = {
  get: () => apiFetch<WarehouseProgress>('/api/dashboard/warehouse-progress'),
}
