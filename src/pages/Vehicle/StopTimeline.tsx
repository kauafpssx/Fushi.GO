import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Flag, Navigation, ChevronRight, EyeOff, MapPin } from 'lucide-react'
import { api } from '../../shared/api/http'
import { V1_BASE } from '../../shared/constants'
import { formatSecondsToMinutes } from '../../shared/utils/formatTime'
import { haversineDistanceMeters } from '../../shared/utils'
import { BUS_PATH } from '../../shared/utils/svgPaths'
import { cn } from '../../shared/lib/cn'

interface ServiceStop {
  id: string
  mnemonic: string
  location: { lat: number; lng: number }
}

interface ServiceStopsResponse {
  polyline: string
  stops: ServiceStop[]
}

function getServiceStops(serviceId: string) {
  return api.get<ServiceStopsResponse>(`${V1_BASE}/stops/service/${serviceId}`)
}

interface StopTimelineProps {
  serviceId: string
  averageSpeed: number
  selectedStopId?: string
  isLive?: boolean
  vehiclePosition?: { lat: number; lng: number }
  onCenterStop: (lat: number, lng: number) => void
}

const NEAREST_STOP_MAX_DISTANCE_METERS = 400

export function StopTimeline({
  serviceId,
  averageSpeed,
  selectedStopId,
  isLive = false,
  vehiclePosition,
  onCenterStop,
}: StopTimelineProps) {
  const { data: response } = useQuery({
    queryKey: ['stops-service', serviceId],
    queryFn: () => getServiceStops(serviceId),
    enabled: !!serviceId,
  })

  const stops = response?.stops ?? []
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [showPassed, setShowPassed] = useState(false)

  const closest = vehiclePosition
    ? stops.reduce(
        (closestIdx, stop, idx) => {
          const dist = haversineDistanceMeters(vehiclePosition, stop.location)
          return dist < closestIdx.dist ? { idx, dist } : closestIdx
        },
        { idx: 0, dist: Infinity }
      )
    : { idx: 0, dist: Infinity }

  const nearestStopIdx = closest.dist <= NEAREST_STOP_MAX_DISTANCE_METERS ? closest.idx : 0

  if (stops.length === 0) return null

  // averageSpeed comes from the API in m/s — convert to km/h for display
  // then floor at a realistic urban cruise speed for ETA extrapolation
  const speedKmH = averageSpeed * 3.6
  const MIN_EXTRAPOLATION_SPEED_KMH = 15
  const speedMetersPerSecond =
    speedKmH > 0 ? (Math.max(speedKmH, MIN_EXTRAPOLATION_SPEED_KMH) * 1000) / 3600 : 0

  function etaToIdx(idx: number): string {
    if (!vehiclePosition || speedMetersPerSecond <= 0) return '--'

    let distanceMeters = haversineDistanceMeters(vehiclePosition, stops[nearestStopIdx].location)
    for (let i = nearestStopIdx; i < idx; i++) {
      distanceMeters += haversineDistanceMeters(stops[i].location, stops[i + 1].location)
    }

    return formatSecondsToMinutes(distanceMeters / speedMetersPerSecond)
  }

  const isLiveMode = isLive && vehiclePosition != null
  const passedCount = isLiveMode ? nearestStopIdx : 0
  const visibleStops = showPassed ? stops : stops.slice(passedCount)

  return (
    <div className="flex flex-col">
      {passedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowPassed((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-surface-low px-3 py-2.5 mb-2 transition-colors hover:bg-surface-high/30 active:scale-[0.98]"
        >
          {showPassed ? (
            <>
              <EyeOff size={14} className="text-on-surface-dim" />
              <span className="font-geist text-xs font-semibold text-primary">
                Ver menos
              </span>
            </>
          ) : (
            <>
              <EyeOff size={14} className="text-on-surface-dim" />
              <span className="font-geist text-xs font-medium text-on-surface-dim">
                {passedCount} {passedCount === 1 ? 'parada anterior' : 'paradas anteriores'}
              </span>
              <span className="ml-auto font-geist text-xs font-semibold text-primary">
                Ver tudo
              </span>
            </>
          )}
        </button>
      )}
      {visibleStops.map((stop) => {
        const idx = stops.indexOf(stop)
        const isTerminal = idx === stops.length - 1
        const isCurrent = isLiveMode && idx === nearestStopIdx
        const isPassed = isLiveMode && idx < nearestStopIdx
        const isSelected = stop.id === selectedStopId

        return (
          <div
            key={`${stop.id}-${idx}`}
            ref={(el) => {
              if (el) rowRefs.current.set(stop.id, el)
              else rowRefs.current.delete(stop.id)
            }}
            className="flex items-stretch gap-3 rounded-xl px-2 cursor-pointer transition-colors active:bg-surface-high/30"
            onClick={() => onCenterStop(stop.location.lat, stop.location.lng)}
          >
            <div className="relative flex w-6 flex-shrink-0 flex-col items-center">
              {!isTerminal && (
                <>
                  <div
                    className={cn(
                      'absolute left-1/2 top-0 z-0 w-1 -translate-x-1/2',
                      (isPassed || isCurrent) ? 'bg-primary' : 'bg-surface-highest',
                      isCurrent ? 'h-[14px]' : '-bottom-px',
                      (isPassed || isCurrent) && 'shadow-[0_0_8px_#ffadc0]'
                    )}
                  />
                  {isCurrent && (
                    <div
                      className="absolute left-1/2 z-0 w-1 -translate-x-1/2 top-[14px] -bottom-px bg-surface-highest"
                    />
                  )}
                </>
              )}
              {idx > 0 && isTerminal && (
                <div className="absolute left-1/2 -top-px z-0 h-1/2 w-1 -translate-x-1/2 bg-surface-highest" />
              )}

              {isCurrent ? (
                <div
                  className="z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d2024">
                    <path d={BUS_PATH} />
                  </svg>
                </div>
              ) : isSelected ? (
                <div
                  className="z-10 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary"
                >
                  <MapPin size={12} className="text-on-primary" />
                </div>
              ) : isTerminal ? (
                <div
                  className="z-10 mt-1 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-lg bg-surface-highest"
                >
                  <Flag className="text-on-surface-dim" size={14} />
                </div>
              ) : (
                <div
                  className={cn(
                    'z-10 mt-1 h-4 w-4 flex-shrink-0 rounded-full',
                    isPassed ? 'bg-primary' : 'bg-surface-highest'
                  )}
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-start justify-between pb-6">
              <div className="min-w-0">
                <h3 className={cn('truncate text-sm font-bold', isSelected ? 'text-primary' : 'text-on-surface')}>
                  {stop.mnemonic.split(',')[0]}
                </h3>
                {isTerminal && (
                  <p className="font-geist text-xs font-medium text-on-surface-dim">
                    Ponto final
                  </p>
                )}
                {isLiveMode && !isTerminal && (
                  <p className={`font-geist text-xs font-medium ${
                    isCurrent ? 'text-primary' : 'text-on-surface-dim'
                  }`}>
                    {isCurrent ? (
                      <span className="flex items-center gap-1">
                        <Navigation size={12} /> Ônibus agora
                      </span>
                    ) : isPassed ? (
                      'Já passou'
                    ) : (
                      etaToIdx(idx)
                    )}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onCenterStop(stop.location.lat, stop.location.lng)}
                className="flex-shrink-0 rounded-full p-1 text-on-surface-dim/40 transition-colors hover:text-primary active:scale-90"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
