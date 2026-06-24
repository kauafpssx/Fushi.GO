import { create } from 'zustand'
import type { Settings } from '../types'

interface SettingsState {
  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void
}

function load(): Settings {
  try {
    const raw = localStorage.getItem('settings')
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    mapStyle: 'dark',
    show3D: false,
    notificationsEnabled: true,
  }
}

function save(settings: Settings): void {
  localStorage.setItem('settings', JSON.stringify(settings))
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: load(),

  updateSettings: (partial) => {
    set((state) => {
      const next = { ...state.settings, ...partial }
      save(next)
      return { settings: next }
    })
  },
}))
