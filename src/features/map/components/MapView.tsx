import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { config } from '../../../app/config'
import { useMapStore, SHEET_SNAP_VH } from '../store/mapStore'
import { setMapInstance } from '../hooks/useMap'
import { getViewportRecommendation, getStopsViewport, type ViewportStop } from '../api/mapApi'
import { useAuthStore } from '../../../app/store'
import { BUS_PATH } from '../../../shared/utils/svgPaths'

const STOPS_MIN_ZOOM = 13
const STOP_PADDING_FACTOR = 0.1

function radiusToZoom(radius: number, lat: number): number {
  const viewportWidth = 400
  return Math.log2((viewportWidth * 156543.03392 * Math.cos((lat * Math.PI) / 180)) / (2 * radius))
}

function inBounds(stop: ViewportStop, bounds: maplibregl.LngLatBounds): boolean {
  return bounds.contains([stop.location.lng, stop.location.lat])
}

function createStopIcon(): ImageData {
  const size = 44
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, size, size)

  const pinW = 34
  const pinH = 34
  const px = (size - pinW) / 2
  const py = 2
  const r = 10
  const tailW = 6
  const tailH = 10
  const tailX = size / 2

  ctx.beginPath()
  ctx.moveTo(px + r, py)
  ctx.lineTo(px + pinW - r, py)
  ctx.quadraticCurveTo(px + pinW, py, px + pinW, py + r)
  ctx.lineTo(px + pinW, py + pinH - r)
  ctx.quadraticCurveTo(px + pinW, py + pinH, px + pinW - r, py + pinH)
  ctx.lineTo(tailX + tailW / 2, py + pinH)
  ctx.lineTo(tailX, py + pinH + tailH)
  ctx.lineTo(tailX - tailW / 2, py + pinH)
  ctx.lineTo(px + r, py + pinH)
  ctx.quadraticCurveTo(px, py + pinH, px, py + pinH - r)
  ctx.lineTo(px, py + r)
  ctx.quadraticCurveTo(px, py, px + r, py)
  ctx.closePath()

  ctx.fillStyle = '#ffadc0'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const cx = size / 2
  const cy = py + pinH / 2

  ctx.save()
  const s = 1.2
  ctx.translate(cx - 12 * s, cy - 12 * s)
  ctx.scale(s, s)

  const busPath = new Path2D(BUS_PATH)

  ctx.fillStyle = 'white'
  ctx.fill(busPath)

  ctx.restore()

  return ctx.getImageData(0, 0, size, size)
}

function toGeoJSON(stops: ViewportStop[]) {
  return {
    type: 'FeatureCollection' as const,
    features: stops.map((stop) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [stop.location.lng, stop.location.lat],
      },
      properties: {
        id: stop.id,
        name: stop.mnemonic,
        kind: stop.kind,
      },
    })),
  }
}

function createUserLocationEl(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'relative flex h-5 w-5 items-center justify-center'
  el.innerHTML = `
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40"></span>
    <span class="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-md"></span>
  `
  return el
}

export function MapView() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const userMarker = useRef<maplibregl.Marker | null>(null)
  const didGeolocate = useRef(false)
  const stopsCache = useRef<Map<string, ViewportStop>>(new Map())
  const lastFetchKey = useRef<string>('')
  const { center, zoom, userLocation, setUserLocation, setBounds, setStops, flyToRequest, sheetSnap } = useMapStore()
  const { isAuthenticated } = useAuthStore()

  const sheetSnapRef = useRef(sheetSnap)
  sheetSnapRef.current = sheetSnap

  const ensureLayer = useCallback((mapInstance: maplibregl.Map) => {
    if (!mapInstance.hasImage('stop-icon')) {
      mapInstance.addImage('stop-icon', createStopIcon(), { pixelRatio: 1 })
    }

    if (!mapInstance.getSource('stops')) {
      mapInstance.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    }

    if (!mapInstance.getLayer('stops-icon')) {
      mapInstance.addLayer({
        id: 'stops-icon',
        type: 'symbol',
        source: 'stops',
        layout: {
          'icon-image': 'stop-icon',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      })

      mapInstance.on('mouseenter', 'stops-icon', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })
      mapInstance.on('mouseleave', 'stops-icon', () => {
        mapInstance.getCanvas().style.cursor = ''
      })

      mapInstance.on('click', 'stops-icon', (e) => {
        const feature = e.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return

        const id = feature.properties?.id as string | undefined
        const [lng, lat] = feature.geometry.coordinates as [number, number]
        if (!id) return

        const store = useMapStore.getState()
        store.selectStop(id)
        store.setSheetSnap('half')
        store.requestFlyTo(lat, lng)
      })
    }
  }, [])

  const getVisibleBounds = useCallback((mapInstance: maplibregl.Map) => {
    const bounds = mapInstance.getBounds()
    const sheetVh = SHEET_SNAP_VH[sheetSnapRef.current]
    const sheetPixels = (window.innerHeight * sheetVh) / 100
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const totalLat = ne.lat - sw.lat
    const adjustedSouth = sw.lat + (totalLat * sheetPixels) / mapInstance.getContainer().offsetHeight
    return new maplibregl.LngLatBounds(
      [sw.lng, adjustedSouth],
      [ne.lng, ne.lat]
    )
  }, [])

  const renderedStopsRef = useRef<Map<string, ViewportStop>>(new Map())

  const updateVisible = useCallback((mapInstance: maplibregl.Map, mode: 'full' | 'accumulate' = 'full') => {
    const bounds = getVisibleBounds(mapInstance)
    const visible = Array.from(stopsCache.current.values()).filter((s) => inBounds(s, bounds))

    ensureLayer(mapInstance)

    if (mode === 'accumulate') {
      for (const s of visible) {
        renderedStopsRef.current.set(s.id, s)
      }
    } else {
      renderedStopsRef.current.clear()
      for (const s of visible) {
        renderedStopsRef.current.set(s.id, s)
      }
    }

    const source = mapInstance.getSource('stops') as maplibregl.GeoJSONSource
    source.setData(toGeoJSON(Array.from(renderedStopsRef.current.values())))

    setStops(Array.from(renderedStopsRef.current.values()))
  }, [setStops, ensureLayer, getVisibleBounds])

  const fetchAndMerge = useCallback(async (mapInstance: maplibregl.Map) => {
    if (!useAuthStore.getState().isAuthenticated) return

    const bounds = mapInstance.getBounds()
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()

    const padLat = (ne.lat - sw.lat) * STOP_PADDING_FACTOR
    const padLng = (ne.lng - sw.lng) * STOP_PADDING_FACTOR

    const pNE = { lat: ne.lat + padLat, lng: ne.lng + padLng }
    const pSW = { lat: sw.lat - padLat, lng: sw.lng - padLng }

    const key = `${pNE.lat.toFixed(3)},${pNE.lng.toFixed(3)},${pSW.lat.toFixed(3)},${pSW.lng.toFixed(3)}`

    if (key === lastFetchKey.current) return
    lastFetchKey.current = key

    setBounds({
      nelat: pNE.lat,
      nelng: pNE.lng,
      swlat: pSW.lat,
      swlng: pSW.lng,
    })

    try {
      const stops = await getStopsViewport(pNE.lat, pNE.lng, pSW.lat, pSW.lng)

      for (const stop of stops) {
        stopsCache.current.set(stop.id, stop)
      }

      updateVisible(mapInstance)
    } catch {
      lastFetchKey.current = ''
    }
  }, [setBounds, updateVisible])

  useEffect(() => {
    if (!container.current || map.current) return

    const instance = new maplibregl.Map({
      container: container.current,
      style: config.map.style,
      center,
      zoom,
    })

    instance.on('load', () => {
      instance.on('zoomend', () => {
        const currentZoom = instance.getZoom()

        if (currentZoom < STOPS_MIN_ZOOM) {
          if (instance.getLayer('stops-icon')) instance.removeLayer('stops-icon')
          if (instance.getSource('stops')) instance.removeSource('stops')
          stopsCache.current.clear()
          lastFetchKey.current = ''
          setStops([])
          return
        }

        fetchAndMerge(instance)
      })

      instance.on('moveend', () => {
        const currentZoom = instance.getZoom()
        if (currentZoom < STOPS_MIN_ZOOM) return

        fetchAndMerge(instance)
      })

      if (!didGeolocate.current) {
        didGeolocate.current = true

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude

            setUserLocation({ lat, lng })

            let targetZoom = 16

            try {
              const rec = await getViewportRecommendation(lat, lng)
              targetZoom = Math.min(17, Math.max(12, radiusToZoom(rec.radiusMeters, lat)))
            } catch {
              // keep default 16
            }

            instance.jumpTo({
              center: [lng, lat],
              zoom: targetZoom,
            })

            fetchAndMerge(instance)
          },
          async () => {
            const [lng, lat] = config.map.defaultCenter

            let targetZoom = config.map.defaultZoom

            try {
              const rec = await getViewportRecommendation(lat, lng)
              targetZoom = Math.min(17, Math.max(12, radiusToZoom(rec.radiusMeters, lat)))
            } catch {
              // keep default
            }

            instance.jumpTo({
              center: [lng, lat],
              zoom: targetZoom,
            })
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
      }
    })

    map.current = instance
    setMapInstance(instance)

    return () => {
      userMarker.current?.remove()
      userMarker.current = null
      instance.remove()
      map.current = null
      setMapInstance(null)
      didGeolocate.current = false
      stopsCache.current.clear()
      lastFetchKey.current = ''
    }
  }, [])

  useEffect(() => {
    if (!map.current || !userLocation) return

    if (!userMarker.current) {
      userMarker.current = new maplibregl.Marker({ element: createUserLocationEl() })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current)
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat])
    }
  }, [userLocation])

  useEffect(() => {
    if (!isAuthenticated || !map.current) return

    const currentZoom = map.current.getZoom()
    if (currentZoom >= STOPS_MIN_ZOOM) {
      lastFetchKey.current = ''
      fetchAndMerge(map.current)
    }
  }, [isAuthenticated, fetchAndMerge])

  useEffect(() => {
    if (!flyToRequest || !map.current) return

    const bottomPadding = Math.round((window.innerHeight * SHEET_SNAP_VH[sheetSnapRef.current]) / 100) + 24

    map.current.flyTo({
      center: [flyToRequest.lng, flyToRequest.lat],
      zoom: 18,
      padding: { top: 80, bottom: bottomPadding, left: 40, right: 40 },
      speed: 1.2,
    })
  }, [flyToRequest])

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    updateVisible(map.current, 'accumulate')
  }, [sheetSnap, updateVisible])

  return <div ref={container} className="h-full w-full bg-background" />
}
