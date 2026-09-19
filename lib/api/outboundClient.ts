import { apiFetch } from '../api-client'

export type OutboundStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface OutboundRecord {
  id: number
  recordNo: string
  orderId: number
  orderNo: string
  customerName: string
  productId: number
  sku: string
  productName: string
  unit: string
  plannedQuantity: number
  actualQuantity: number | null
  status: OutboundStatus
  differenceReason: string | null
  createdAt: string
  completedAt: string | null
}

export interface OutboundCheck {
  executable: boolean
  reason: string | null
  availableForTask: number
}

export const outboundApi = {
  list: () => apiFetch<OutboundRecord[]>('/api/outbound-records'),

  checkInventory: (id: number) =>
    apiFetch<OutboundCheck>(`/api/outbound-records/${id}/check-inventory`),

  complete: (id: number, actualQuantity: number, differenceReason?: string) =>
    apiFetch<OutboundRecord>(`/api/outbound-records/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ actualQuantity, differenceReason }),
    }),
}
