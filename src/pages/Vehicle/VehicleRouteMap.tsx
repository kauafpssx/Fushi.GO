import { useEffect, useImperativeHandle, useRef, useState, useCallback, forwardRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useQuery } from '@tanstack/react-query'
import { config } from '../../app/config'
import { api } from '../../shared/api/http'
import { V1_BASE } from '../../shared/constants'
import { decodePolyline } from '../../shared/utils/decodePolyline'
import { haversineDistanceMeters } from '../../shared/utils'
import { BUS_PATH } from '../../shared/utils/svgPaths'
import { LocateButton } from '../../components/LocateButton/LocateButton'
import type { VehicleDTO } from '../../domain/Vehicle/VehicleMapper'

interface ServiceStopsResponse {
  stops: Array<{
    id: string
    mnemonic: string
    location: { lat: number; lng: number }
  }>
  polyline: string
}

function getServiceStops(serviceId: string) {
  return api.get<ServiceStopsResponse>(`${V1_BASE}/stops/service/${serviceId}`)
}

const BUS_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${BUS_PATH}" fill="#1d2024"/>
</svg>`

function createBusMarkerElement(
  prefix: string,
  bearing: number,
  isSelected: boolean
): {
  element: HTMLDivElement
  refs: {
    tooltip: HTMLDivElement
    tooltipArrow: HTMLDivElement
    mainCircle: HTMLDivElement
    arrowSvg: SVGSVGElement
  }
} {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:relative;width:36px;height:36px;cursor:pointer;overflow:visible;'

  const tooltip = document.createElement('div')
  tooltip.className = 'bus-prefix-tooltip'
  tooltip.style.cssText = `
    position:absolute; bottom:calc(100% + 14px); left:50%; transform:translateX(-50%);
    background:white; color:#1d2024; font-family:'Geist',sans-serif;
    font-size:12px; font-weight:700; padding:4px 10px; border-radius:8px;
    box-shadow:0 2px 12px rgba(0,0,0,0.18); white-space:nowrap; z-index:10;
    opacity:0; transition:opacity 0.2s ease; pointer-events:none;
  `
  tooltip.textContent = prefix

  const tooltipArrow = document.createElement('div')
  tooltipArrow.style.cssText = `
    position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
    width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent;
    border-top:6px solid white; z-index:10;
    opacity:0; transition:opacity 0.2s ease; pointer-events:none;
  `

  const mainCircle = document.createElement('div')
  mainCircle.style.cssText = `
    width:36px; height:36px; border-radius:50%; background:white;
    box-shadow:0 2px 10px rgba(0,0,0,0.22);
    display:flex; align-items:center; justify-content:center;
    transition:box-shadow 0.2s ease;
    ${isSelected ? 'transform:scale(1.15); box-shadow:0 3px 16px rgba(255,173,192,0.5);' : ''}
  `
  mainCircle.innerHTML = BUS_SVG

  const satellite = document.createElement('div')
  satellite.style.cssText = `
    position:absolute; width:16px; height:16px; border-radius:50%;
    background:#ffadc0; box-shadow:0 1px 4px rgba(0,0,0,0.25);
    display:flex; align-items:center; justify-content:center;
    bottom:-4px; right:-6px; z-index:2;
  `

  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  arrowSvg.setAttribute('width', '10')
  arrowSvg.setAttribute('height', '10')
  arrowSvg.setAttribute('viewBox', '0 0 10 10')
  arrowSvg.style.cssText = `transform:rotate(${bearing}deg);`

  const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  arrowHead.setAttribute('points', '2.5,6 5,2.5 7.5,6')
  arrowHead.setAttribute('fill', 'none')
  arrowHead.setAttribute('stroke', 'white')
  arrowHead.setAttribute('stroke-width', '1.8')
  arrowHead.setAttribute('stroke-linecap', 'round')
  arrowHead.setAttribute('stroke-linejoin', 'round')

  const arrowShaft = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  arrowShaft.setAttribute('x1', '5')
  arrowShaft.setAttribute('y1', '4.5')
  arrowShaft.setAttribute('x2', '5')
  arrowShaft.setAttribute('y2', '8.5')
  arrowShaft.setAttribute('stroke', 'white')
  arrowShaft.setAttribute('stroke-width', '1.8')
  arrowShaft.setAttribute('stroke-linecap', 'round')

  arrowSvg.appendChild(arrowHead)
  arrowSvg.appendChild(arrowShaft)
  satellite.appendChild(arrowSvg)

  wrapper.appendChild(tooltip)
  wrapper.appendChild(tooltipArrow)
  wrapper.appendChild(mainCircle)
  wrapper.appendChild(satellite)

  return {
    element: wrapper,
    refs: { tooltip, tooltipArrow, mainCircle, arrowSvg },
  }
}

function ensureUserMarker(map: maplibregl.Map | null, lat: number, lng: number, markerRef: React.MutableRefObject<maplibregl.Marker | null>) {
  if (!map) return
  if (!markerRef.current) {
    const el = document.createElement('div')
    el.className = 'relative flex h-5 w-5 items-center justify-center'
    el.innerHTML = `
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40"></span>
      <span class="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-md"></span>
    `
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map)
  } else {
    markerRef.current.setLngLat([lng, lat])
  }
}

interface VehicleRouteMapProps {
  serviceId: string
  selectedStopId?: string
  vehicle?: VehicleDTO
  vehicles?: VehicleDTO[]
  service?: { vehicles: unknown[] }
  messagePrefixes?: string[]
  sheetHeightVh?: number
}

export interface VehicleRouteMapHandle {
  flyToStop: (lat: number, lng: number) => void
  flyToBus: () => void
  flyToVehicle: (lat: number, lng: number) => void
  fitBusAndStop: (busLat: number, busLng: number, stopLat: number, stopLng: number) => void
  flyToRoute: () => void
}

export const VehicleRouteMap = forwardRef<VehicleRouteMapHandle, VehicleRouteMapProps>(function VehicleRouteMap(
  { serviceId, selectedStopId, vehicle, vehicles = [], service, messagePrefixes, sheetHeightVh = 55 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const vehicleMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; refs: { tooltip: HTMLDivElement; tooltipArrow: HTMLDivElement; mainCircle: HTMLDivElement; arrowSvg: SVGSVGElement } }>>(new Map())
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const hasFitRef = useRef(false)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null)

  const vehicleRef = useRef(vehicle)
  vehicleRef.current = vehicle

  const sheetHeightVhRef = useRef(sheetHeightVh)
  sheetHeightVhRef.current = sheetHeightVh

  const stopsDataRef = useRef<{ stops: Array<{ id: string; location: { lat: number; lng: number } }> } | null>(null)

  useImperativeHandle(ref, () => ({
    flyToStop: (lat: number, lng: number) => {
      const map = mapRef.current
      if (!map) return
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      map.stop()
      map.flyTo({
        center: [lng, lat],
        zoom: 17,
        padding: { top: 100, bottom: pad, left: 60, right: 60 },
        pitch: 45,
        speed: 1.2,
      })
    },
    flyToBus: () => {
      const map = mapRef.current
      const v = vehicleRef.current
      if (!map || !v) return
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      map.stop()
      map.flyTo({
        center: [v.lng, v.lat],
        zoom: 16,
        padding: { top: 100, bottom: pad, left: 60, right: 60 },
        pitch: 45,
        speed: 1.2,
      })
    },
    flyToVehicle: (lat: number, lng: number) => {
      const map = mapRef.current
      if (!map) return
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      map.stop()
      map.flyTo({
        center: [lng, lat],
        zoom: 16,
        padding: { top: 100, bottom: pad, left: 60, right: 60 },
        pitch: 45,
        speed: 1.2,
      })
    },
    fitBusAndStop: (busLat, busLng, stopLat, stopLng) => {
      const map = mapRef.current
      if (!map) return
      if ([busLat, busLng, stopLat, stopLng].some(v => v == null || isNaN(v))) return
      map.stop()
      const dLat = Math.abs(busLat - stopLat)
      const dLng = Math.abs(busLng - stopLng)
      const distDeg = Math.max(dLat, dLng)
      const zoom = distDeg < 0.0005 ? 18 : distDeg < 0.001 ? 17 : distDeg < 0.003 ? 16 : distDeg < 0.008 ? 15 : distDeg < 0.02 ? 14 : 13
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      const center: [number, number] = [(busLng + stopLng) / 2, (busLat + stopLat) / 2]
      map.flyTo({ center, zoom, padding: { top: 100, bottom: pad, left: 60, right: 60 }, pitch: 45, speed: 1.2 })
    },
    flyToRoute: () => {
      const map = mapRef.current
      const data = stopsDataRef.current
      if (!map || !data?.stops?.length) return
      map.stop()
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      const bounds = new maplibregl.LngLatBounds()
      data.stops.forEach((stop) => bounds.extend([stop.location.lng, stop.location.lat]))
      map.fitBounds(bounds, { padding: { top: 100, bottom: pad, left: 60, right: 60 }, maxZoom: 17, pitch: 45 })
    },
  }), [])

  const { data } = useQuery({
    queryKey: ['route-stops', serviceId],
    queryFn: () => getServiceStops(serviceId),
    enabled: !!serviceId,
  })

  stopsDataRef.current = data ?? null

  const hideTooltip = useCallback(() => {
    vehicleMarkersRef.current.forEach(({ refs }) => {
      refs.tooltip.style.opacity = '0'
      refs.tooltipArrow.style.opacity = '0'
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: config.map.style,
      center: config.map.defaultCenter,
      zoom: 13,
      pitch: 45,
    })

    mapRef.current = instance

    instance.on('load', () => {
      setStyleLoaded(true)
    })

    instance.on('click', hideTooltip)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        userLocationRef.current = { lat, lng }
        ensureUserMarker(instance, lat, lng, userMarkerRef)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => {
      instance.off('click', hideTooltip)
      vehicleMarkersRef.current.forEach(({ marker }) => marker.remove())
      vehicleMarkersRef.current.clear()
      instance.remove()
      mapRef.current = null
      setStyleLoaded(false)
    }
  }, [hideTooltip])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoaded) return

    const rawVehicles = vehicles ?? []

    let realtimeVehicles: typeof rawVehicles
    if (messagePrefixes && messagePrefixes.length > 0) {
      realtimeVehicles = rawVehicles.filter(
        (v) => messagePrefixes.includes(v.prefix) && v.lat !== 0 && v.lng !== 0
      )
    } else {
      const messageIds = new Set<string>(
        (service?.vehicles ?? [])
          .filter((v): v is Record<string, unknown> => v != null && typeof v === 'object')
          .filter((v) => (v as Record<string, unknown>).type === 'MESSAGE')
          .map((v) => String((v as Record<string, unknown>).id ?? ''))
          .filter(Boolean)
      )
      realtimeVehicles = messageIds.size > 0
        ? rawVehicles.filter((v) => messageIds.has(String(v.id)) && v.lat !== 0 && v.lng !== 0)
        : rawVehicles.filter((v) => v.lat !== 0 && v.lng !== 0)
    }
    const markers = vehicleMarkersRef.current
    const activeIds = new Set(realtimeVehicles.map((v) => v.id))

    markers.forEach(({ marker }, id) => {
      if (!activeIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    })

    for (const v of realtimeVehicles) {
      const existing = markers.get(v.id)
      if (existing) {
        existing.marker.setLngLat([v.lng, v.lat])
        existing.refs.arrowSvg.style.transform = `rotate(${v.bearing ?? 0}deg)`
        existing.refs.tooltip.textContent = `#${v.prefix}`
      } else {
        const { element, refs } = createBusMarkerElement(`#${v.prefix}`, v.bearing ?? 0, false)
        const marker = new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([v.lng, v.lat])
          .addTo(map)

        element.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation()
          hideTooltip()
          refs.tooltip.style.opacity = '1'
          refs.tooltipArrow.style.opacity = '1'
          const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
          map.stop()
          map.flyTo({
            center: [v.lng, v.lat],
            zoom: 16,
            padding: { top: 100, bottom: pad, left: 60, right: 60 },
            pitch: 45,
            speed: 1.2,
          })
        })

        markers.set(v.id, { marker, refs })
      }
    }
  }, [vehicles, service, messagePrefixes, styleLoaded, hideTooltip])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !data || !styleLoaded) return

    if (data.polyline) {
      const points = decodePolyline(data.polyline)
      const coords: [number, number][] = points.map((p) => [p.lng, p.lat])

      const sourceId = 'route-line'
      const layerId = 'route-line-layer'

      if (map.getSource(sourceId)) {
        map.removeLayer(layerId)
        map.removeSource(sourceId)
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      })

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffadc0', 'line-width': 4, 'line-opacity': 0.8 },
      })
    }

    if (data.stops && data.stops.length > 0) {
      const stopsSourceId = 'route-stops'
      const stopsLayerId = 'route-stops-circle'

      if (map.getSource(stopsSourceId)) {
        map.removeLayer(stopsLayerId)
        map.removeSource(stopsSourceId)
      }

      map.addSource(stopsSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.stops.map((stop) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [stop.location.lng, stop.location.lat] },
            properties: { id: stop.id, name: stop.mnemonic, selected: stop.id === selectedStopId },
          })),
        },
      })

      map.addLayer({
        id: stopsLayerId,
        type: 'circle',
        source: stopsSourceId,
        paint: {
          'circle-radius': ['case', ['get', 'selected'], 9, 5],
          'circle-color': ['case', ['get', 'selected'], '#ffffff', '#ffadc0'],
          'circle-stroke-width': ['case', ['get', 'selected'], 3, 2],
          'circle-stroke-color': ['case', ['get', 'selected'], '#ffadc0', '#0D0E11'],
        },
      })
    }
  }, [data, styleLoaded, selectedStopId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoaded || hasFitRef.current) return

    const firstVehicle = (vehicles ?? []).find((v) => v.lat !== 0 && v.lng !== 0)

    if (firstVehicle && data?.stops?.length) {
      const selectedStop = selectedStopId ? data.stops.find((s) => s.id === selectedStopId) : undefined
      const focusStop = selectedStop ?? data.stops.reduce((nearest, stop) =>
        haversineDistanceMeters(firstVehicle, stop.location) < haversineDistanceMeters(firstVehicle, nearest.location) ? stop : nearest
      )
      hasFitRef.current = true
      const dLat = Math.abs(firstVehicle.lat - focusStop.location.lat)
      const dLng = Math.abs(firstVehicle.lng - focusStop.location.lng)
      const distDeg = Math.max(dLat, dLng)
      const zoom = distDeg < 0.0005 ? 18 : distDeg < 0.001 ? 17 : distDeg < 0.003 ? 16 : distDeg < 0.008 ? 15 : distDeg < 0.02 ? 14 : 13
      const pad = Math.round((window.innerHeight * sheetHeightVh) / 100) + 24
      const center: [number, number] = [(firstVehicle.lng + focusStop.location.lng) / 2, (firstVehicle.lat + focusStop.location.lat) / 2]
      map.flyTo({ center, zoom, padding: { top: 100, bottom: pad, left: 60, right: 60 }, pitch: 45, speed: 1 })
    } else if (data?.stops?.length) {
      const pad = Math.round((window.innerHeight * sheetHeightVh) / 100) + 24
      const bounds = new maplibregl.LngLatBounds()
      data.stops.forEach((stop) => bounds.extend([stop.location.lng, stop.location.lat]))
      map.fitBounds(bounds, { padding: { top: 100, bottom: pad, left: 60, right: 60 }, maxZoom: 17, pitch: 45 })
    } else {
      return
    }
  }, [vehicles, data, styleLoaded, selectedStopId, sheetHeightVh])

  const handleLocate = useCallback(() => {
    const map = mapRef.current
    const loc = userLocationRef.current
    if (!map) return
    if (loc) {
      const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
      map.stop()
      map.flyTo({ center: [loc.lng, loc.lat], zoom: 16, padding: { top: 100, bottom: pad, left: 60, right: 60 }, pitch: 45, speed: 1.2 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        userLocationRef.current = { lat, lng }
        ensureUserMarker(map, lat, lng, userMarkerRef)
        const pad = Math.round((window.innerHeight * sheetHeightVhRef.current) / 100) + 24
        map.flyTo({ center: [lng, lat], zoom: 16, padding: { top: 100, bottom: pad, left: 60, right: 60 }, pitch: 45, speed: 1.2 })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full bg-background" />
      <div className="absolute right-4 top-16 z-30">
        <LocateButton onClick={handleLocate} />
      </div>
    </>
  )
})
