import { apiFetch } from '../api-client'

export interface WarehouseProgress {
  businessDate: string
  timeZone: string
  todayInboundCount: number
  todayOutboundCount: number
  pendingOutboundCount: number
  differenceRecordCount: number
  updatedAt: string
}

export const warehouseProgressApi = {
  get: () => apiFetch<WarehouseProgress>('/api/dashboard/warehouse-progress'),
}
