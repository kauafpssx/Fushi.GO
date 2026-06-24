import { useQuery } from '@tanstack/react-query'
import { getVehicles } from '../api/getVehicles'
import { vehicleMapper, type VehicleDTO } from '../../../domain/Vehicle/VehicleMapper'

export function useVehicles(serviceId: string) {
  return useQuery({
    queryKey: ['vehicles', serviceId],
    queryFn: async () => {
      const raw = await getVehicles(serviceId)
      return raw.map(vehicleMapper) satisfies VehicleDTO[]
    },
    enabled: !!serviceId,
    refetchInterval: 15_000,
  })
}
