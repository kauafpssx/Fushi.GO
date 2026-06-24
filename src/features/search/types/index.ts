export interface SearchResult {
  id: string
  name: string
  type: 'service' | 'stop'
  lat?: number
  lng?: number
}
