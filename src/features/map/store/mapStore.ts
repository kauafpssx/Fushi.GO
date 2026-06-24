import { create } from 'zustand'
import type { ViewportStop } from '../api/mapApi'

interface Bounds {
  nelat: number
  nelng: number
  swlat: number
  swlng: number
}

export type SheetSnap = 'peek' | 'half' | 'full'

export const SHEET_SNAP_VH: Record<SheetSnap, number> = {
  peek: 38,
  half: 60,
  full: 85,
}

interface FlyToRequest {
  lat: number
  lng: number
  nonce: number
}

interface MapState {
  center: [number, number]
  zoom: number
  bearing: number
  bounds: Bounds | null
  selectedVehicleId: string | null
  selectedStopId: string | null
  userLocation: { lat: number; lng: number } | null
  stops: ViewportStop[]
  sheetSnap: SheetSnap
  flyToRequest: FlyToRequest | null
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setBearing: (bearing: number) => void
  setBounds: (bounds: Bounds) => void
  setUserLocation: (loc: { lat: number; lng: number } | null) => void
  setStops: (stops: ViewportStop[]) => void
  selectVehicle: (id: string | null) => void
  selectStop: (id: string | null) => void
  flyTo: (lat: number, lng: number, zoom?: number) => void
  setSheetSnap: (snap: SheetSnap) => void
  requestFlyTo: (lat: number, lng: number) => void
}

export const useMapStore = create<MapState>((set) => ({
  center: [-51.2, -30.0],
  zoom: 13,
  bearing: 0,
  bounds: null,
  selectedVehicleId: null,
  selectedStopId: null,
  userLocation: null,
  stops: [],
  sheetSnap: 'peek',
  flyToRequest: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBearing: (bearing) => set({ bearing }),
  setBounds: (bounds) => set({ bounds }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setStops: (stops) => set({ stops }),
  selectVehicle: (id) => set({ selectedVehicleId: id, selectedStopId: null }),
  selectStop: (id) => set({ selectedStopId: id, selectedVehicleId: null }),
  flyTo: (lat, lng, zoom) => set({ center: [lng, lat], zoom: zoom ?? 15 }),
  setSheetSnap: (snap) => set({ sheetSnap: snap }),
  requestFlyTo: (lat, lng) =>
    set((state) => ({ flyToRequest: { lat, lng, nonce: state.flyToRequest ? state.flyToRequest.nonce + 1 : 1 } })),
}))
