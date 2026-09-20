'use client'

import { create } from 'zustand'

export interface SystemSettings { companyName: string; timezone: string; orderAutoCheck: boolean; lowStockAlert: boolean; alertThreshold: number }
interface SettingsState { settings: SystemSettings; hydrated: boolean; setSettings: (settings: SystemSettings) => void; updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void }

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { companyName: '', timezone: 'Asia/Shanghai', orderAutoCheck: false, lowStockAlert: true, alertThreshold: 10 },
  hydrated: false,
  setSettings: (settings) => set({ settings, hydrated: true }),
  updateSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),
}))
