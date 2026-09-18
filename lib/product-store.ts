'use client'

import { create } from 'zustand'

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  unit: string
  price: number
  available: number
  reserved: number
  safetyStock: number
  status: ProductStatus
  updatedAt: string
}

const initialProducts: Product[] = [
  { id: 1, sku: 'AL-CN-024', name: '铝合金连接件', category: '连接件', unit: '件', price: 18.5, available: 860, reserved: 240, safetyStock: 200, status: 'IN_STOCK', updatedAt: '2026-09-18 10:42' },
  { id: 2, sku: 'SS-BL-120', name: '不锈钢螺栓', category: '紧固件', unit: '件', price: 3.8, available: 4200, reserved: 1200, safetyStock: 1000, status: 'IN_STOCK', updatedAt: '2026-09-18 09:18' },
  { id: 3, sku: 'SE-PA-086', name: '密封圈套装', category: '密封件', unit: '套', price: 26, available: 42, reserved: 86, safetyStock: 80, status: 'LOW_STOCK', updatedAt: '2026-09-17 16:36' },
  { id: 4, sku: 'CF-FL-048', name: '碳钢法兰', category: '管件', unit: '件', price: 64, available: 0, reserved: 48, safetyStock: 50, status: 'OUT_OF_STOCK', updatedAt: '2026-09-17 14:05' },
  { id: 5, sku: 'PT-VA-032', name: '聚四氟乙烯阀座', category: '阀件', unit: '件', price: 42, available: 318, reserved: 24, safetyStock: 100, status: 'IN_STOCK', updatedAt: '2026-09-16 11:20' },
]

interface ProductState {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'updatedAt' | 'status'>) => void
  updateProduct: (id: number, patch: Partial<Product>) => void
  removeProduct: (id: number) => void
}

function getStatus(available: number, safetyStock: number): ProductStatus {
  if (available <= 0) return 'OUT_OF_STOCK'
  if (available <= safetyStock) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export const useProductStore = create<ProductState>((set) => ({
  products: initialProducts,
  addProduct: (product) => set((state) => ({ products: [{ ...product, id: Date.now(), status: getStatus(product.available, product.safetyStock), updatedAt: '刚刚' }, ...state.products] })),
  updateProduct: (id, patch) => set((state) => ({ products: state.products.map((product) => product.id === id ? { ...product, ...patch, status: getStatus(patch.available ?? product.available, patch.safetyStock ?? product.safetyStock), updatedAt: '刚刚' } : product) })),
  removeProduct: (id) => set((state) => ({ products: state.products.filter((product) => product.id !== id) })),
}))
