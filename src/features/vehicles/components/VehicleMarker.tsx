import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { VehicleDTO } from '../../../domain/Vehicle/VehicleMapper'
import { BUS_PATH } from '../../../shared/utils/svgPaths'

interface VehicleMarkerProps {
  vehicle: VehicleDTO
  map: maplibregl.Map
  isSelected: boolean
  onSelect: (id: string) => void
}

const BUS_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${BUS_PATH}" fill="#1d2024"/>
</svg>`

function createBusMarkerElement(
  prefix: string,
  bearing: number,
  isSelected: boolean,
  onSelect: () => void
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
    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
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
  arrowSvg.style.cssText = `transform:rotate(${bearing}deg); transition:transform 0.15s ease;`

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

  wrapper.addEventListener('click', (e) => {
    e.stopPropagation()
    onSelect()
  })

  return {
    element: wrapper,
    refs: { tooltip, tooltipArrow, mainCircle, arrowSvg },
  }
}

export function VehicleMarker({ vehicle, map, isSelected, onSelect }: VehicleMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const refsRef = useRef<{
    tooltip: HTMLDivElement
    tooltipArrow: HTMLDivElement
    mainCircle: HTMLDivElement
    arrowSvg: SVGSVGElement
  } | null>(null)

  useEffect(() => {
    const { element, refs } = createBusMarkerElement(
      `#${vehicle.prefix}`,
      vehicle.bearing ?? 0,
      isSelected,
      () => onSelect(vehicle.id)
    )
    refsRef.current = refs

    markerRef.current = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat([vehicle.lng, vehicle.lat])
      .addTo(map)

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      refsRef.current = null
    }
  }, [])

  useEffect(() => {
    const marker = markerRef.current
    const refs = refsRef.current
    if (!marker || !refs) return

    marker.setLngLat([vehicle.lng, vehicle.lat])

    refs.arrowSvg.style.transform = `rotate(${vehicle.bearing ?? 0}deg)`
    refs.tooltip.textContent = `#${vehicle.prefix}`

    refs.mainCircle.style.transform = isSelected ? 'scale(1.15)' : ''
    refs.mainCircle.style.boxShadow = isSelected
      ? '0 3px 16px rgba(255,173,192,0.5)'
      : '0 2px 10px rgba(0,0,0,0.22)'

    refs.tooltip.style.opacity = isSelected ? '1' : '0'
    refs.tooltipArrow.style.opacity = isSelected ? '1' : '0'
  }, [vehicle.lng, vehicle.lat, vehicle.bearing, vehicle.prefix, isSelected])

  return null
}
