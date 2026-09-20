import { apiFetch } from '@/lib/api-client'
import type { ItemResponse, OrderResponse } from '@/lib/api/generated'

// Runtime response extensions; regenerate Orval against the updated backend schema.
// No hand-edits to lib/api/generated are needed.
export type FulfillmentLine = ItemResponse & {
  id: number
  shippedQuantity: number
  pendingQuantity: number
  waivedQuantity: number
  remainingQuantity: number
}
export type FulfillmentEvent = {
  id: number
  eventType: string
  description: string
  operatorUsername: string | null
  createdAt: string
}
export type FulfillmentOrder = Omit<OrderResponse, 'items'> & {
  items: FulfillmentLine[]
  events: FulfillmentEvent[]
  abnormalType?: 'STOCK_SHORTAGE' | 'SHORT_DELIVERY' | 'UNABLE_TO_DELIVER' | 'OUTBOUND_CANCELLED' | 'OTHER' | null
}

export const fulfillmentApi = {
  partial: (id: number) =>
    apiFetch<FulfillmentOrder>(`/api/orders/${id}/partial-outbound`, {
      method: 'POST', body: JSON.stringify({ customerAgreed: true }),
    }),
  supplemental: (id: number, orderItemId: number, quantity: number) =>
    apiFetch<FulfillmentOrder>(`/api/orders/${id}/supplemental-outbound`, {
      method: 'POST', body: JSON.stringify({ orderItemId, quantity }),
    }),
  acceptShortDelivery: (id: number, reason: string) =>
    apiFetch<FulfillmentOrder>(`/api/orders/${id}/accept-short-delivery`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
}
