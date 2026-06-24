import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import type { SearchResult } from '../types'

export function search(query: string) {
  return api.get<SearchResult[]>(`${V1_BASE}/search`, { q: query })
}
