import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import type { Vehicle } from '../types'

export function getVehicles(serviceId: string) {
  return api.get<Vehicle[]>(`${V1_BASE}/vehicles/service/${serviceId}`)
}
