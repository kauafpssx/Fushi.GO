import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import type { ServiceDetails } from '../types'

export function getServiceDetails(serviceId: string) {
  return api.get<ServiceDetails>(`${V1_BASE}/services/${serviceId}`)
}
