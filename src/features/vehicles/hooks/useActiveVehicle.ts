import { useQuery } from '@tanstack/react-query'
import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import { findNearestStopIndex } from '../../../shared/utils'
import type { VehicleDTO } from '../../../domain/Vehicle/VehicleMapper'

interface ServiceStop {
  id: string
  mnemonic: string
  location: { lat: number; lng: number }
}

interface ServiceStopsResponse {
  polyline: string
  stops: ServiceStop[]
}

function getServiceStops(serviceId: string) {
  return api.get<ServiceStopsResponse>(`${V1_BASE}/stops/service/${serviceId}`)
}

interface ActiveVehicleResult {
  vehicle: VehicleDTO | undefined
  isLive: boolean
}

/** Picks the closest realtime bus that hasn't passed the selected stop yet; falls back to the first vehicle. */
export function useActiveVehicle(
  serviceId: string,
  vehicles: VehicleDTO[],
  selectedStopId: string | undefined
): ActiveVehicleResult {
  const { data: stopsResponse } = useQuery({
    queryKey: ['stops-service', serviceId],
    queryFn: () => getServiceStops(serviceId),
    enabled: !!serviceId,
  })

  const stops = stopsResponse?.stops ?? []
  const selectedStopIdx = selectedStopId ? stops.findIndex((stop) => stop.id === selectedStopId) : -1
  const realtimeVehicles = vehicles.filter((v) => v.lat !== 0 && v.lng !== 0)

  const vehicle =
    selectedStopIdx >= 0 && stops.length > 0
      ? realtimeVehicles
          .map((v) => ({ v, nearestIdx: findNearestStopIndex(v, stops) }))
          .filter(({ nearestIdx }) => nearestIdx <= selectedStopIdx)
          .reduce<{ v: VehicleDTO; nearestIdx: number } | null>(
            (best, candidate) => (!best || candidate.nearestIdx > best.nearestIdx ? candidate : best),
            null
          )?.v ?? realtimeVehicles[0]
      : realtimeVehicles[0]

  return { vehicle, isLive: vehicle != null && vehicle.status !== 'SCHEDULED' }
}
