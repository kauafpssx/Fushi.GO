import { useQuery } from '@tanstack/react-query'
import { search } from '../api/search'

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => search(query),
    enabled: query.length >= 3,
    staleTime: 60_000,
  })
}
