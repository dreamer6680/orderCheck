'use client'

import { create } from 'zustand'

export type OrderStatus = 'PENDING_CHECK' | 'PENDING_OUTBOUND' | 'ABNORMAL' | 'COMPLETED'
export interface OrderRecord { id: number; orderNo: string; customerName: string; status: OrderStatus; items: { sku: string; name: string; quantity: number }[]; createdAt: string; exceptionReason?: string }

interface OrderState {
  orders: OrderRecord[]
  selectedOrderId: number | null
  setOrders: (orders: OrderRecord[]) => void
  addOrder: (order: OrderRecord) => void
  updateOrderStatus: (id: number, status: OrderStatus) => void
  selectOrder: (id: number | null) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrderId: null,
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (id, status) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, status } : order) })),
  selectOrder: (selectedOrderId) => set({ selectedOrderId }),
}))
