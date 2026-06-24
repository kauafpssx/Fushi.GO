import type maplibregl from 'maplibre-gl'

const mapRef = { current: null as maplibregl.Map | null }

export function setMapInstance(instance: maplibregl.Map | null) {
  mapRef.current = instance
}

export function useMap() {
  return {
    getMap: () => mapRef.current,
  }
}
