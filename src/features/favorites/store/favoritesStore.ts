import { create } from 'zustand'
import type { FavoriteStop, FavoriteService } from '../types'
import { MAX_FAVORITES } from '../../../shared/constants'

interface FavoritesState {
  stops: FavoriteStop[]
  services: FavoriteService[]
  addStop: (stop: FavoriteStop) => void
  removeStop: (stopId: string) => void
  addService: (service: FavoriteService) => void
  removeService: (serviceId: string) => void
  isStopFavorite: (stopId: string) => boolean
  isServiceFavorite: (serviceId: string) => boolean
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  stops: load('fav_stops', []),
  services: load('fav_services', []),

  addStop: (stop) => {
    const stops = get().stops
    if (stops.length >= MAX_FAVORITES) return
    if (stops.some((s) => s.stopId === stop.stopId)) return
    const next = [...stops, stop]
    save('fav_stops', next)
    set({ stops: next })
  },

  removeStop: (stopId) => {
    const next = get().stops.filter((s) => s.stopId !== stopId)
    save('fav_stops', next)
    set({ stops: next })
  },

  addService: (service) => {
    const services = get().services
    if (services.length >= MAX_FAVORITES) return
    if (services.some((s) => s.serviceId === service.serviceId)) return
    const next = [...services, service]
    save('fav_services', next)
    set({ services: next })
  },

  removeService: (serviceId) => {
    const next = get().services.filter((s) => s.serviceId !== serviceId)
    save('fav_services', next)
    set({ services: next })
  },

  isStopFavorite: (stopId) => get().stops.some((s) => s.stopId === stopId),
  isServiceFavorite: (serviceId) => get().services.some((s) => s.serviceId === serviceId),
}))
