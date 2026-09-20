'use client'

import { create } from 'zustand'
import { orderApi } from '../api-client'

export type OrderStatus = 'PENDING_CHECK' | 'PENDING_OUTBOUND' | 'ABNORMAL' | 'COMPLETED' | 'CANCELLED'
export interface OrderItem { id: number; sku: string; productName: string; unit: string; orderedQuantity: number; shippedQuantity: number; pendingQuantity: number; waivedQuantity: number; remainingQuantity: number }
export interface OrderRecord { id: number; orderNo: string; customerName: string; status: OrderStatus; items: OrderItem[]; createdAt: string; deliveryDate: string | null; exceptionReason?: string; abnormalType?: 'STOCK_SHORTAGE' | 'SHORT_DELIVERY' | 'UNABLE_TO_DELIVER' | 'OUTBOUND_CANCELLED' | 'OTHER' | null; events?: { id: number; eventType: string; description: string; operatorUsername: string | null; createdAt: string }[] }

type OrderState = {
  orders: OrderRecord[]
  selectedOrderId: number | null
  isLoading: boolean
  error: string | null
  hasLoaded: boolean
  loadOrders: (params?: { status?: string; keyword?: string }) => Promise<void>
  createOrder: (payload: unknown) => Promise<OrderRecord>
  checkInventory: (id: number, recheck?: boolean) => Promise<void>
  cancelOrder: (id: number) => Promise<void>
  changeDeliveryDate: (id: number, date: string) => Promise<void>
  markUnableToDeliver: (id: number, reason: string) => Promise<void>
  selectOrder: (id: number | null) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [], selectedOrderId: null, isLoading: false, error: null, hasLoaded: false,
  loadOrders: async (params) => {
    set({ isLoading: true, error: null })
    try { set({ orders: await orderApi.list(params), isLoading: false, hasLoaded: true }) }
    catch (error) { set({ isLoading: false, hasLoaded: true, error: error instanceof Error ? error.message : '订单加载失败' }) }
  },
  createOrder: async (payload) => {
    const order = await orderApi.create(payload)
    set((state) => ({ orders: [order, ...state.orders] }))
    return order
  },
  checkInventory: async (id, recheck = false) => {
    const order = recheck ? await orderApi.recheckInventory(id) : await orderApi.checkInventory(id)
    set((state) => ({ orders: state.orders.map((item) => item.id === id ? order : item) }))
  },
  cancelOrder: async (id) => {
    const order = await orderApi.cancel(id)
    set((state) => ({ orders: state.orders.map((item) => item.id === id ? order : item) }))
  },
  changeDeliveryDate: async (id, date) => {
    const order = await orderApi.changeDeliveryDate(id, date)
    set((state) => ({ orders: state.orders.map((item) => item.id === id ? order : item) }))
  },
  markUnableToDeliver: async (id, reason) => {
    const order = await orderApi.markUnableToDeliver(id, reason)
    set((state) => ({ orders: state.orders.map((item) => item.id === id ? order : item) }))
  },
  selectOrder: (selectedOrderId) => set({ selectedOrderId }),
}))
