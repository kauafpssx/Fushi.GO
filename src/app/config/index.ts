export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL ?? '',
  },
  map: {
    style: import.meta.env.VITE_MAP_STYLE ?? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    defaultCenter: [-51.2, -30.0] as [number, number],
    defaultZoom: 13,
  },
  sse: {
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
  },
} as const
