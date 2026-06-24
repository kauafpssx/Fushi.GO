import { useQuery } from '@tanstack/react-query'
import { getServiceStopPrediction } from '../../stops/api/getStops'
import type { StopVehicle } from '../../stops/types'

interface ServiceStopPredictionResult {
  etaSeconds: number | null
  isRealTime: boolean
  vehicle: StopVehicle | null
  upcoming: StopVehicle[]
}

/** Same prediction source as the stop list ("16 min" pill) — keeps this page consistent with it. */
export function useServiceStopPrediction(
  serviceId: string,
  stopId: string | undefined
): ServiceStopPredictionResult {
  const { data } = useQuery({
    queryKey: ['service-stop-prediction', serviceId, stopId],
    queryFn: () => getServiceStopPrediction(serviceId, stopId as string),
    enabled: !!serviceId && !!stopId,
    refetchInterval: 15_000,
  })

  const service = data
  if (!service) return { etaSeconds: null, isRealTime: false, vehicle: null, upcoming: [] }

  const upcoming = [...service.vehicles]
    .filter((v) => v.prediction > 0 || v.type === null)
    .sort((a, b) => a.prediction - b.prediction)

  const bestVehicle = upcoming[0] ?? null

  if (bestVehicle) {
    return {
      etaSeconds: bestVehicle.prediction,
      isRealTime: bestVehicle.type !== 'SCHEDULE',
      vehicle: bestVehicle,
      upcoming,
    }
  }

  if (service.totalTravelTimeUntilStopSeconds > 0) {
    return {
      etaSeconds: service.totalTravelTimeUntilStopSeconds,
      isRealTime: false,
      vehicle: null,
      upcoming,
    }
  }

  return { etaSeconds: null, isRealTime: false, vehicle: null, upcoming }
}
