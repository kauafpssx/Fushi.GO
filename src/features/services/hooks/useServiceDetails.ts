import { useQuery } from '@tanstack/react-query'
import { getServiceDetails } from '../api/getServiceDetails'

export function useServiceDetails(serviceId: string) {
  return useQuery({
    queryKey: ['services', serviceId],
    queryFn: () => getServiceDetails(serviceId),
    enabled: !!serviceId,
  })
}
