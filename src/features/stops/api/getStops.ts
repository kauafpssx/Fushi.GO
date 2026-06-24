import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import type { Stop, StopService } from '../types'

export function getStopsByService(serviceId: string) {
  return api.get<{ stops: Stop[]; polyline: string }>(`${V1_BASE}/stops/service/${serviceId}`)
}

export function getStopPredictions(stopId: string) {
  return api.get<{ messages: unknown[]; alerts: unknown[]; services: StopService[] }>(`${V1_BASE}/predictions/stop/${stopId}`)
}

export function getServiceStopPrediction(serviceId: string, stopId: string) {
  return api.get<StopService>(`${V1_BASE}/predictions/${serviceId}/${stopId}`)
}
