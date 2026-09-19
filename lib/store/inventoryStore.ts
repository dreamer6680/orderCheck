'use client'

import { create } from 'zustand'

export interface InventoryItem { sku: string; name: string; category: string; available: number; reserved: number; safetyStock: number; unit: string }
interface InventoryState { items: InventoryItem[]; setItems: (items: InventoryItem[]) => void; adjustStock: (sku: string, amount: number) => void }

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  adjustStock: (sku, amount) => set((state) => ({ items: state.items.map((item) => item.sku === sku ? { ...item, available: Math.max(0, item.available + amount) } : item) })),
}))
