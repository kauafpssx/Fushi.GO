import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'

export interface ViewportRecommendation {
  type: string
  lat: number
  lng: number
  radiusMeters: number
}

export interface ViewportStop {
  id: string
  mnemonic: string
  location: {
    lat: number
    lng: number
  }
  bearing: number
  status: string
  kind: number
  services: unknown[]
  routeTypes: number
  modal: number
}

export function getViewportRecommendation(lat: number, lng: number) {
  return api.get<ViewportRecommendation>(`${V1_BASE}/viewport/recommendation`, { lat, lng })
}

export function getStopsViewport(
  nelat: number,
  nelng: number,
  swlat: number,
  swlng: number
) {
  return api.get<ViewportStop[]>(`${V1_BASE}/stops/viewport`, {
    nelat,
    nelng,
    swlat,
    swlng,
  })
}
