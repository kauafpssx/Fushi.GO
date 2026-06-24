import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'

export interface Departure {
  departureTimestamp: number
}

export function getDepartures(serviceId: string, date: string, time?: string) {
  return api.get<Departure[]>(`${V1_BASE}/predictions/departure`, {
    serviceId,
    date,
    ...(time ? { time } : {}),
  })
}
