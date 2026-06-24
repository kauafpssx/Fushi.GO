import { useQuery } from '@tanstack/react-query'
import { getStopsByService } from '../api/getStops'

export function useStopsByService(serviceId: string) {
  return useQuery({
    queryKey: ['stops', 'service', serviceId],
    queryFn: () => getStopsByService(serviceId),
    enabled: !!serviceId,
  })
}
